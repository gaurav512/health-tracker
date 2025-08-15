import React from 'react';
import styles from './CalorieBudget.module.css';

interface CalorieBudgetProps {
  target: number | null | undefined;
  food: number;
  onLogCaloriesClick: (food: null) => void;
}

const CalorieBudget: React.FC<CalorieBudgetProps> = ({ target, food = 0, onLogCaloriesClick }) => {
  // Set a default target if none is provided, to prevent division by zero
  const dailyTarget = target || 2000;

  const remaining = dailyTarget - food;
  const progress = food > 0 ? (food / dailyTarget) * 100 : 0;

  let progressBarColorClass = styles.green;
  if (progress > 100) {
    progressBarColorClass = styles.red;
  } else if (progress >= 85) {
    progressBarColorClass = styles.yellow;
  }

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Calorie Budget</h2>
      <div className={styles.summary}>
        <div className={styles.metric}>
          <span>Target</span>
          <span className={styles.value}>{dailyTarget}</span>
        </div>
        <span className={styles.operator}>-</span>
        <div className={styles.metric}>
          <span>Food</span>
          <span className={styles.value}>{food}</span>
        </div>
        <span className={styles.operator}>=</span>
        <div className={styles.metricRemaining}>
          <span>Remaining</span>
          <span className={styles.valueRemaining}>{remaining}</span>
        </div>
      </div>
      <div className={styles.progressBarContainer}>
        <div 
          className={`${styles.progressBar} ${progressBarColorClass}`}
          style={{ width: `${Math.min(progress, 100)}%` }} // Cap width at 100%
        ></div>
      </div>
      <button onClick={() => onLogCaloriesClick(null)} className={styles.logCaloriesButton}>
        (+) Log Calories
      </button>
    </div>
  );
};

export default CalorieBudget;