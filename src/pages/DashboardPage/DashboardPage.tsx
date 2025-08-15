import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './DashboardPage.module.css';
import CalorieBudget from '../../components/CalorieBudget/CalorieBudget';
import MealLogger from '../../components/MealLogger/MealLogger';
import WeightEntryForm from '../../components/WeightEntryForm/WeightEntryForm';
import WeightChart from '../../components/WeightChart/WeightChart';
import CalorieChart from '../../components/CalorieChart/CalorieChart';
import LogCaloriesModal from '../../components/AddFoodModal/LogCaloriesModal';
import ConfirmationModal from '../../components/ConfirmationModal/ConfirmationModal';
import { useAuth, logOut } from '../../firebase/auth';
import { useUserProfile } from '../../context/UserProvider';
import { useTheme } from '../../context/ThemeProvider';
import {
  getWeightEntries,
  addOrUpdateWeightEntry,
  getDailyLogEntries,
  addFoodLogEntry,
  deleteFoodLogEntry,
  addRecentFood,
  updateFoodLogEntry,
  WeightEntry,
  FoodLogEntry
} from '../../firebase/firestore';

const getTodayString = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

const formatDate = (dateString: string): string => {
  const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

const getRelativeDateString = (dateString: string): string => {
  const today = getTodayString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayString = yesterday.toISOString().split('T')[0];

  if (dateString === today) {
    return 'Today';
  } else if (dateString === yesterdayString) {
    return 'Yesterday';
  } else {
    return formatDate(dateString);
  }
};

interface DailyLog {
  Breakfast: FoodLogEntry[];
  Lunch: FoodLogEntry[];
  Dinner: FoodLogEntry[];
  Snacks: FoodLogEntry[];
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userProfile } = useUserProfile();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    document.title = 'HealthTracker - Dashboard';
  }, []);

  const [weightData, setWeightData] = useState<WeightEntry[]>([]);
  const [dailyLog, setDailyLog] = useState<DailyLog>({ Breakfast: [], Lunch: [], Dinner: [], Snacks: [] });
  const [loadingWeightData, setLoadingWeightData] = useState(true);
  const [loadingDailyLog, setLoadingDailyLog] = useState(true);
  const [currentLogDate, setCurrentLogDate] = useState(getTodayString());

  const [isLogCaloriesModalOpen, setIsLogCaloriesModalOpen] = useState(false);
  const [foodToEdit, setFoodToEdit] = useState<FoodLogEntry | null>(null);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<FoodLogEntry | null>(null);

  const fetchWeight = useCallback(async () => {
    if (user) {
      setLoadingWeightData(true);
      const weights = await getWeightEntries(user.uid);
      setWeightData(weights);
      setLoadingWeightData(false);
    }
  }, [user]);

  const fetchDailyLog = useCallback(async () => {
    if (user) {
      setLoadingDailyLog(true);
      const logs = await getDailyLogEntries(user.uid, currentLogDate);
      const groupedLogs: DailyLog = { Breakfast: [], Lunch: [], Dinner: [], Snacks: [] };
      logs.forEach(log => {
        if (groupedLogs[log.mealType as keyof DailyLog]) {
          groupedLogs[log.mealType as keyof DailyLog].push(log);
        }
      });
      setDailyLog(groupedLogs);
      setLoadingDailyLog(false);
    }
  }, [user, currentLogDate]);

  useEffect(() => {
    fetchWeight();
  }, [fetchWeight]);

  useEffect(() => {
    fetchDailyLog();
  }, [fetchDailyLog]);

  const totalCalories = useMemo(() => {
    return Object.values(dailyLog).flat().reduce((sum, item) => sum + item.calories, 0);
  }, [dailyLog]);

  const handleLogUpdate = async (action: 'add' | 'edit' | 'delete', mealType: string, food: any, date: string = getTodayString(), originalFood: FoodLogEntry | null = null) => {
    if (!user) {
      return;
    }

    try {
      if (action === 'add') {
        const newLogData = { ...food, mealType };
        delete newLogData.id;
        await addFoodLogEntry(user.uid, newLogData, date);
        await addRecentFood(user.uid, food);
      } else if (action === 'delete') {
        setItemToDelete(food);
        setIsConfirmModalOpen(true);
        return;
      } else if (action === 'edit') {
        const updatedLogData = { ...food, mealType };
        if (originalFood) {
          await updateFoodLogEntry(user.uid, originalFood.id, updatedLogData);
        }
      }
      
      await fetchDailyLog();
    } catch (error) {
      console.error('DashboardPage - Error in handleLogUpdate:', error);
    }
  };

  const handleConfirmDelete = async () => {
    if (!user || !itemToDelete) return;

    try {
      await deleteFoodLogEntry(user.uid, itemToDelete.id);
      await fetchDailyLog();
    } catch (error) {
      console.error('DashboardPage - Error during deletion confirmation:', error);
    } finally {
      setIsConfirmModalOpen(false);
      setItemToDelete(null);
    }
  };

  const handleWeightUpdate = async (date: string, weight: string) => {
    if (!user) return;
    await addOrUpdateWeightEntry(user.uid, date, Number(weight));
    await fetchWeight();
  };

  const handleSignOut = async () => {
    try {
      await logOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };

  const handleDateChange = (offset: number) => {
    const newDate = new Date(currentLogDate);
    newDate.setDate(newDate.getDate() + offset);
    setCurrentLogDate(newDate.toISOString().split('T')[0]);
  };

  const handleOpenLogCaloriesModal = (food: FoodLogEntry | null = null) => {
    setFoodToEdit(food);
    setIsLogCaloriesModalOpen(true);
  };

  const handleCloseLogCaloriesModal = () => {
    setIsLogCaloriesModalOpen(false);
    setFoodToEdit(null);
  };

  const handleEditFoodFromMealLogger = (foodItem: FoodLogEntry) => {
    handleOpenLogCaloriesModal(foodItem);
  };

  if (user === undefined || userProfile === undefined) {
    return <div className="full-page-loader"><div></div></div>;
  }

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1 className={styles.logo}>HealthTracker</h1>
        <div className={styles.headerControls}>
          <button onClick={toggleTheme} className={styles.themeToggleButton} title="Toggle theme">
            {theme === 'light' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-moon">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-sun">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            )}
          </button>
          <span 
            className={styles.welcomeMessage}
            onClick={() => navigate('/profile')} 
            style={{ cursor: 'pointer' }} 
          >
            Welcome, {userProfile?.displayName || user?.displayName}!
          </span>
          <button onClick={handleSignOut} className={styles.signOutButton}>Sign Out</button>
        </div>
      </header>
      <main className={styles.dashboardGrid}>
        <section className={styles.gridColumn}>
          {loadingWeightData ? (
            <div className={styles.sectionLoader}>Loading Weight Data...</div>
          ) : (
            <>
              <WeightEntryForm onSave={handleWeightUpdate} entries={weightData} getRelativeDateString={getRelativeDateString} />
              <WeightChart weightData={weightData} weightGoal={userProfile?.weightGoal_kg} />
            </>
          )}
        </section>
        <section className={styles.gridColumn}>
          <CalorieBudget target={userProfile?.calorieTarget} food={totalCalories} onLogCaloriesClick={handleOpenLogCaloriesModal} />
          <div className={styles.dateNavigationContainer}>
            <button onClick={() => handleDateChange(-1)} className={styles.dateNavButton}>&lt;</button>
            <span className={styles.currentDateDisplay}>{getRelativeDateString(currentLogDate)}</span>
            <button
              onClick={() => handleDateChange(1)}
              className={styles.dateNavButton}
              disabled={currentLogDate === getTodayString()}
              title={currentLogDate === getTodayString() ? "You are viewing today's data." : "Navigate to next day"}
            >&gt;</button>
          </div>
          {loadingDailyLog ? (
            <div className={styles.sectionLoader}>Loading Meal Data...</div>
          ) : (
            <>
              <MealLogger 
                dailyLogData={dailyLog} 
                onUpdateLog={handleLogUpdate} 
                selectedDate={currentLogDate} 
                getRelativeDateString={getRelativeDateString} 
                onEditFoodClick={handleEditFoodFromMealLogger} 
              />
              <CalorieChart />
            </>
          )}
        </section>
      </main>
      <LogCaloriesModal 
        isOpen={isLogCaloriesModalOpen}
        onClose={handleCloseLogCaloriesModal}
        onSave={handleLogUpdate}
        selectedDate={currentLogDate}
        foodToEdit={foodToEdit}
      />

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirm Deletion"
        message={itemToDelete ? `Are you sure you want to delete ${itemToDelete.description}?` : 'Are you sure you want to delete this item?'}
      />
    </div>
  );
};

export default DashboardPage;