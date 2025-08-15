import React from 'react';
import styles from './MealLogger.module.css';
import { FoodLogEntry } from '../../firebase/firestore';

interface MealLoggerProps {
  dailyLogData: {
    Breakfast: FoodLogEntry[];
    Lunch: FoodLogEntry[];
    Dinner: FoodLogEntry[];
    Snacks: FoodLogEntry[];
  };
  onUpdateLog: (action: 'delete', mealType: string, food: FoodLogEntry) => void;
  selectedDate: string;
  getRelativeDateString: (date: string) => string;
  onEditFoodClick: (foodItem: FoodLogEntry) => void;
}

const MealLogger: React.FC<MealLoggerProps> = ({ dailyLogData, onUpdateLog, selectedDate, getRelativeDateString, onEditFoodClick }) => {
  const allLoggedFoods = Object.keys(dailyLogData).flatMap(mealType =>
    (dailyLogData[mealType as keyof typeof dailyLogData] || []).map(item => ({ ...item, mealType }))
  );

  const handleDeleteFood = (item: FoodLogEntry) => {
    onUpdateLog('delete', item.mealType, item);
  };

  const handleEditClick = (foodItem: FoodLogEntry) => {
    onEditFoodClick(foodItem);
  };

  return (
    <>
      <div className={styles.loggerContainer}>
        <div className={styles.loggerHeader}>
          <h2 className={styles.mainTitle}>
            Calorie Intake
            <span className={styles.subTitleDate}>{getRelativeDateString(selectedDate)}</span>
          </h2>
        </div>
        <div className={styles.tableContainer}>
          {allLoggedFoods.length > 0 ? (
            <table className={styles.foodTable}>
              <thead>
                <tr>
                  <th>Meal</th>
                  <th>Description</th>
                  <th>Calories</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allLoggedFoods.map(item => (
                  <tr key={item.id}>
                    <td>{item.mealType}</td>
                    <td>{item.description}</td>
                    <td>{item.calories} kcal</td>
                    <td>
                      <div className={styles.actionIcons}>
                        <button onClick={() => handleEditClick(item)} className={styles.iconButton} title="Edit">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-edit">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </button>
                        <button onClick={() => handleDeleteFood(item)} className={styles.iconButton} title="Delete">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-trash-2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className={styles.emptyText}>No calorie intake logged for this day.</p>
          )}
        </div>
      </div>
    </>
  );
};

export default MealLogger;
