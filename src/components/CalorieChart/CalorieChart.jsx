import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import styles from './CalorieChart.module.css';
import { getDailyCalorieTotals } from '../../firebase/firestore';
import { useAuth } from '../../firebase/auth';
import { useUserProfile } from '../../context/UserProvider';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const CalorieChart = () => {
  const { user } = useAuth();
  const { userProfile } = useUserProfile();
  const [calorieData, setCalorieData] = useState([]);
  const [timeRange, setTimeRange] = useState('30'); // '30', '90', 'all'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCalorieData = async () => {
      if (!user) return;
      setLoading(true);

      const today = new Date();
      let startDate = new Date();

      if (timeRange === '30') {
        startDate.setDate(today.getDate() - 29);
      } else if (timeRange === '90') {
        startDate.setDate(today.getDate() - 89);
      } else { // 'all'
        // For 'all time', we might need a very early date or rely on the first log entry
        // For simplicity, let's set a fixed far-back date or fetch all available
        // For now, let's assume a reasonable default if 'all' is too broad for initial fetch
        startDate = new Date(2023, 0, 1); // Example: Start of 2023
      }

      const startDateString = startDate.toISOString().split('T')[0];
      const endDateString = today.toISOString().split('T')[0];

      try {
        const data = await getDailyCalorieTotals(user.uid, startDateString, endDateString);
        setCalorieData(data);
      } catch (error) {
        console.error("Error fetching calorie data:", error);
      }
      setLoading(false);
    };

    fetchCalorieData();
  }, [user, timeRange]);

  const chartLabels = calorieData.map(entry => entry.date);
  const chartCalories = calorieData.map(entry => entry.totalCalories);

  const data = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Calories Consumed',
        data: chartCalories,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.1,
        fill: false,
        borderWidth: 3, // Thickness for the chart line
      },
      userProfile?.calorieTarget && {
        label: 'Calorie Target',
        data: chartLabels.map(() => userProfile.calorieTarget),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false,
        borderWidth: 3, // Thickness for the chart line
      },
    ].filter(Boolean), // Filter out null/undefined datasets
  };

  const options = {
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
        display: true,
        text: 'Calorie Intake Over Time',
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Date',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Calories (kcal)',
        },
        beginAtZero: true,
      },
    },
  };

  if (loading) {
    return <div className={styles.chartContainer}>Loading calorie data...</div>;
  }

  return (
    <div className={styles.chartCard}>
      <div className={styles.chartHeader}>
        <h3>Calorie Trends</h3>
        <div className={styles.timeRangeButtons}>
          <button 
            className={`${styles.timeRangeButton} ${timeRange === '30' ? styles.active : ''}`}
            onClick={() => setTimeRange('30')}
          >
            30 Days
          </button>
          <button 
            className={`${styles.timeRangeButton} ${timeRange === '90' ? styles.active : ''}`}
            onClick={() => setTimeRange('90')}
          >
            90 Days
          </button>
          <button 
            className={`${styles.timeRangeButton} ${timeRange === 'all' ? styles.active : ''}`}
            onClick={() => setTimeRange('all')}
          >
            All Time
          </button>
        </div>
      </div>
      <div className={styles.chartCanvasContainer}>
        {calorieData.length > 0 ? (
          <Line data={data} options={options} />
        ) : (
          <p className={styles.emptyChart}>No calorie data available for this period.</p>
        )}
      </div>
    </div>
  );
};

export default CalorieChart;
