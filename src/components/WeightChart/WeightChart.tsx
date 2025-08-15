import React, { useState, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  registerables
} from 'chart.js';
import styles from './WeightChart.module.css';
import { WeightEntry } from '../../firebase/firestore';

ChartJS.register(...registerables);

interface MovingAverageEntry {
  date: string;
  weight_kg: number;
}

const calculateMovingAverage = (data: WeightEntry[], windowSize = 7): MovingAverageEntry[] => {
  let averages: MovingAverageEntry[] = [];
  for (let i = 0; i < data.length; i++) {
    const window = data.slice(Math.max(0, i - windowSize + 1), i + 1);
    const sum = window.reduce((acc, val) => acc + val.weight_kg, 0);
    averages.push({ date: data[i].id, weight_kg: parseFloat((sum / window.length).toFixed(2)) });
  }
  return averages;
};

const getTrend = (movingAverage: MovingAverageEntry[]): string => {
  if (movingAverage.length < 7) return 'Maintaining';
  const lastWeek = movingAverage.slice(-7);
  const start = lastWeek[0].weight_kg;
  const end = lastWeek[lastWeek.length - 1].weight_kg;
  const diff = end - start;

  if (Math.abs(diff) < 0.1) return 'Maintaining';
  return diff > 0 ? 'Gaining' : 'Losing';
};

interface WeightChartProps {
  weightData: WeightEntry[];
  weightGoal: number | null | undefined;
}

const WeightChart: React.FC<WeightChartProps> = ({ weightData = [], weightGoal }) => {
  const [timeRange, setTimeRange] = useState(30);

  const filteredData = useMemo(() => {
    if (!weightData) return [];
    if (timeRange === 0) return weightData;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeRange);
    return weightData.filter(d => new Date(d.id) >= cutoffDate);
  }, [weightData, timeRange]);

  const movingAverage = useMemo(() => calculateMovingAverage(filteredData), [filteredData]);
  const trend = useMemo(() => getTrend(movingAverage), [movingAverage]);

  const chartData = {
    labels: filteredData.map(d => d.id),
    datasets: [
      {
        label: 'Daily Weight',
        data: filteredData.map(d => d.weight_kg),
        borderColor: '#1877f2',
        backgroundColor: '#1877f2',
        tension: 0.1,
        borderWidth: 3,
      },
      {
        label: '7-Day Average',
        data: movingAverage.map(d => d.weight_kg),
        borderColor: '#00b894',
        backgroundColor: '#00b894',
        borderDash: [5, 5],
        pointRadius: 0,
        tension: 0.2,
        borderWidth: 3,
      },
      {
        label: 'Goal Weight',
        data: Array(filteredData.length).fill(weightGoal),
        borderColor: '#ff7675',
        backgroundColor: '#ff7675',
        borderDash: [],
        pointRadius: 0,
        fill: false,
        borderWidth: 3,
      }
    ].filter(d => d.label !== 'Goal Weight' || weightGoal)
  };

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          pointStyle: 'line',
          boxWidth: 40,
          boxHeight: 10,
        },
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        title: {
          display: true,
          text: 'Weight (kg)'
        }
      }
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>Weight Chart</h2>
        <div className={styles.timeToggles}>
          {[30, 90, 0].map(range => (
            <button 
              key={range}
              className={`${styles.toggleButton} ${timeRange === range ? styles.active : ''}`}
              onClick={() => setTimeRange(range)}>
              {range === 0 ? 'All Time' : `${range} Days`}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.chartContainer}>
        {filteredData.length > 0 ? (
          <Line options={chartOptions} data={chartData} />
        ) : (
          <p className={styles.emptyText}>Log your weight to see your progress chart.</p>
        )}
      </div>
      <div className={styles.trendIndicator}>
        <strong>Trend:</strong> {trend}
      </div>
    </div>
  );
};

export default WeightChart;
