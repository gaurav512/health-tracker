import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './DashboardPage.module.css';
import CalorieBudget from '../../components/CalorieBudget/CalorieBudget';
import MealLogger from '../../components/MealLogger/MealLogger';
import WeightEntryForm from '../../components/WeightEntryForm/WeightEntryForm';
import WeightChart from '../../components/WeightChart/WeightChart';
import CalorieChart from '../../components/CalorieChart/CalorieChart';
import LogCaloriesModal from '../../components/AddFoodModal/LogCaloriesModal'; // Import LogCaloriesModal
import ConfirmationModal from '../../components/ConfirmationModal/ConfirmationModal'; // Import ConfirmationModal
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
  updateFoodLogEntry
} from '../../firebase/firestore';

// Helper to get today's date in YYYY-MM-DD format
const getTodayString = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// Helper to format date for display
const formatDate = (dateString) => {
  const options = { weekday: 'short', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

// Helper to get relative date string (Today, Yesterday)
const getRelativeDateString = (dateString) => {
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

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userProfile } = useUserProfile();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    document.title = 'HealthTracker - Dashboard';
  }, []);

  const [weightData, setWeightData] = useState([]);
  const [dailyLog, setDailyLog] = useState({ Breakfast: [], Lunch: [], Dinner: [], Snacks: [] });
  const [loadingWeightData, setLoadingWeightData] = useState(true); // Separate loading state for weight
  const [loadingDailyLog, setLoadingDailyLog] = useState(true); // Separate loading state for daily log
  const [currentLogDate, setCurrentLogDate] = useState(getTodayString());

  const [isLogCaloriesModalOpen, setIsLogCaloriesModalOpen] = useState(false); // State for modal
  const [foodToEdit, setFoodToEdit] = useState(null); // State for editing food

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false); // State for confirmation modal
  const [itemToDelete, setItemToDelete] = useState(null); // Item to be deleted

  // Define fetch functions using useCallback
  const fetchWeight = useCallback(async () => {
    if (user) {
      setLoadingWeightData(true);
      const weights = await getWeightEntries(user.uid);
      const formattedWeights = weights.map(w => ({...w, date: w.id }));
      setWeightData(formattedWeights);
      setLoadingWeightData(false);
    }
  }, [user]);

  const fetchDailyLog = useCallback(async () => {
    if (user) {
      setLoadingDailyLog(true);
      const logs = await getDailyLogEntries(user.uid, currentLogDate);
      const groupedLogs = { Breakfast: [], Lunch: [], Dinner: [], Snacks: [] };
      logs.forEach(log => {
        if (groupedLogs[log.mealType]) {
          groupedLogs[log.mealType].push(log);
        }
      });
      setDailyLog(groupedLogs);
      setLoadingDailyLog(false);
    }
  }, [user, currentLogDate]); // Dependencies for fetchDailyLog

  // Effects to call fetch functions
  useEffect(() => {
    fetchWeight();
  }, [fetchWeight]);

  useEffect(() => {
    fetchDailyLog();
  }, [fetchDailyLog]);

  const totalCalories = useMemo(() => {
    return Object.values(dailyLog).flat().reduce((sum, item) => sum + item.calories, 0);
  }, [dailyLog]);

  const handleLogUpdate = async (action, mealType, food, date = getTodayString(), originalFood = null) => {
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
        // Open confirmation modal instead of window.confirm
        setItemToDelete(food); // Store the item to be deleted
        setIsConfirmModalOpen(true); // Open the confirmation modal
        return; // Exit to wait for confirmation
      } else if (action === 'edit') { 
        const updatedLogData = { ...food, mealType };
        await updateFoodLogEntry(user.uid, originalFood.id, updatedLogData);
      }
      
      // After any log update (except for delete, which is handled by handleConfirmDelete), re-fetch daily logs to update UI for the currentLogDate
      await fetchDailyLog(); // Call the dedicated fetch function
    } catch (error) {
      console.error('DashboardPage - Error in handleLogUpdate:', error);
      // Optionally, show a toast message to the user about the error
    }
  };

  const handleConfirmDelete = async () => {
    if (!user || !itemToDelete) return;

    try {
      await deleteFoodLogEntry(user.uid, itemToDelete.id);
      await fetchDailyLog(); // Refresh UI after deletion
    } catch (error) {
      console.error('DashboardPage - Error during deletion confirmation:', error);
    } finally {
      setIsConfirmModalOpen(false); // Close modal
      setItemToDelete(null); // Clear item to delete
    }
  };

  const handleWeightUpdate = async (date, weight) => {
    if (!user) return;
    await addOrUpdateWeightEntry(user.uid, date, weight);
    // After weight update, re-fetch weight data to update chart
    await fetchWeight(); // Call the dedicated fetch function
  };

  const handleSignOut = async () => {
    try {
      await logOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };

  const handleDateChange = (offset) => {
    const newDate = new Date(currentLogDate);
    newDate.setDate(newDate.getDate() + offset);
    setCurrentLogDate(newDate.toISOString().split('T')[0]);
  };

  const handleOpenLogCaloriesModal = (food = null) => {
    setFoodToEdit(food);
    setIsLogCaloriesModalOpen(true);
  };

  const handleCloseLogCaloriesModal = () => {
    setIsLogCaloriesModalOpen(false);
    setFoodToEdit(null);
  };

  const handleEditFoodFromMealLogger = (foodItem) => {
    handleOpenLogCaloriesModal(foodItem);
  };

  // Initial loading for auth and user profile
  if (user === undefined || userProfile === undefined) {
    return <div className="full-page-loader"><div></div></div>; // Initial app loading
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
            onClick={() => navigate('/profile')} /* Make welcome message clickable */
            style={{ cursor: 'pointer' }} /* Add pointer cursor for UX */
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
                onEditFoodClick={handleEditFoodFromMealLogger} /* New prop */
              />
              <CalorieChart />
            </>
          )}
        </section>
      </main>
      {/* LogCaloriesModal rendered here */}
      <LogCaloriesModal 
        isOpen={isLogCaloriesModalOpen}
        onClose={handleCloseLogCaloriesModal}
        onSave={handleLogUpdate} // handleLogUpdate will handle add/edit
        selectedDate={currentLogDate}
        foodToEdit={foodToEdit}
      />

      {/* ConfirmationModal rendered here */}
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