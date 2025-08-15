import React, { useState, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart, // Changed from Chart as ChartJS
  registerables // Import registerables
} from 'chart.js';
import styles from './WeightChart.module.css';

Chart.register(
  ...registerables // Use registerables
);

const calculateMovingAverage = (data, windowSize = 7) => {
  let averages = [];
  for (let i = 0; i < data.length; i++) {
    const window = data.slice(Math.max(0, i - windowSize + 1), i + 1);
    const sum = window.reduce((acc, val) => acc + val.weight_kg, 0);
    averages.push({ date: data[i].date, weight_kg: parseFloat((sum / window.length).toFixed(2)) });
  }
  return averages;
};

const getTrend = (movingAverage) => {
  if (movingAverage.length < 7) return 'Maintaining'; // Default to Maintaining if not enough data
  const lastWeek = movingAverage.slice(-7);
  const start = lastWeek[0].weight_kg;
  const end = lastWeek[lastWeek.length - 1].weight_kg;
  const diff = end - start;

  if (Math.abs(diff) < 0.1) return 'Maintaining';
  return diff > 0 ? 'Gaining' : 'Losing';
};

const WeightChart = ({ weightData = [], weightGoal }) => {
  const [timeRange, setTimeRange] = useState(30); // 30, 90, or 0 for All Time

  const filteredData = useMemo(() => {
    if (!weightData) return [];
    if (timeRange === 0) return weightData;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeRange);
    return weightData.filter(d => new Date(d.date) >= cutoffDate);
  }, [weightData, timeRange]);

  const movingAverage = useMemo(() => calculateMovingAverage(filteredData), [filteredData]);
  const trend = useMemo(() => getTrend(movingAverage), [movingAverage]);

  const chartData = {
    labels: filteredData.map(d => d.date),
    datasets: [
      {
        label: 'Daily Weight',
        data: filteredData.map(d => d.weight_kg),
        borderColor: '#1877f2',
        backgroundColor: '#1877f2',
        tension: 0.1,
        borderWidth: 3, // Thickness for the chart line
      },
      {
        label: '7-Day Average',
        data: movingAverage.map(d => d.weight_kg),
        borderColor: '#00b894', // Emerald Green
        backgroundColor: '#00b894',
        borderDash: [5, 5],
        pointRadius: 0, // No points on the average line
        tension: 0.2,
        borderWidth: 3, // Thickness for the chart line
      },
      {
        label: 'Goal Weight',
        data: Array(filteredData.length).fill(weightGoal),
        borderColor: '#ff7675', // Coral Red
        backgroundColor: '#ff7675',
        borderDash: [], // Solid line
        pointRadius: 0,
        fill: false,
        borderWidth: 3, // Thickness for the chart line
      }
    ].filter(d => d.label !== 'Goal Weight' || weightGoal) // Only show goal line if it exists
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true, // Use point style for legend items
          pointStyle: 'line', // Force line style
          boxWidth: 40, // Standard width for the line symbol
          boxHeight: 10, // Standard height for the line symbol
          fontColor: 'var(--color-text-primary)', // Ensure legend text color adapts to theme
          // Removed custom generateLabels
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