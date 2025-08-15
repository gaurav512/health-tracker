import { doc, getDoc, setDoc, updateDoc, collection, getDocs, addDoc, deleteDoc, query, where, Timestamp, serverTimestamp, orderBy } from "firebase/firestore"; 
import { db } from './config';

// --- INTERFACES --- //

export interface UserProfile {
  goal: string;
  height_cm: number;
  birthYear: number;
  activityLevel: string;
  calorieTarget: number;
  weightGoal_kg: number;
  displayName: string;
  email: string;
  createdAt: Timestamp;
}

export interface WeightEntry {
  id: string;
  weight_kg: number;
  timestamp: Timestamp;
}

export interface FoodLogEntry {
  id: string;
  description: string;
  calories: number;
  mealType: string;
  timestamp: Timestamp;
}

export interface RecentFood {
  id: string;
  description: string;
  calories: number;
  lastUsed: Timestamp;
}

// --- USER PROFILE --- //

/**
 * Fetches a user's profile from Firestore.
 * @param {string} userId - The ID of the user to fetch.
 * @returns {Promise<object|null>} - The user's profile data or null if not found.
 */
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const userDocRef = doc(db, 'users', userId);
  const userDocSnap = await getDoc(userDocRef);
  return userDocSnap.exists() ? userDocSnap.data() as UserProfile : null;
};

/**
 * Updates a user's document in Firestore with their onboarding data.
 * Also creates an initial weight entry.
 * @param {string} userId - The ID of the user.
 * @param {object} data - The onboarding data.
 */
export const updateUserOnboardingData = async (userId: string, data: any): Promise<void> => {
  const userDocRef = doc(db, 'users', userId);
  
  // 1. Update the main user document
  await updateDoc(userDocRef, {
    goal: data.goal,
    height_cm: Number(data.height_cm),
    birthYear: Number(data.birthYear),
    activityLevel: data.activityLevel,
    calorieTarget: data.calorieTarget,
    weightGoal_kg: Number(data.currentWeight_kg),
  });

  // 2. Create the very first weight entry in the subcollection
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const weightEntryRef = doc(db, `users/${userId}/weightEntries`, today);
  await setDoc(weightEntryRef, {
    weight_kg: Number(data.currentWeight_kg),
    timestamp: Timestamp.fromDate(new Date(today))
  });
};

/**
 * Updates a user's profile data in Firestore.
 * @param {string} userId - The ID of the user.
 * @param {object} data - The profile data to update.
 */
export const updateUserProfileData = async (userId: string, data: any): Promise<void> => {
  const userDocRef = doc(db, 'users', userId);
  await updateDoc(userDocRef, data);
};

// --- WEIGHT ENTRIES --- //

/**
 * Fetches all weight entries for a user.
 * @param {string} userId - The user's ID.
 * @returns {Promise<Array>} - An array of weight entry objects.
 */
export const getWeightEntries = async (userId: string): Promise<WeightEntry[]> => {
  const entriesColRef = collection(db, `users/${userId}/weightEntries`);
  const q = query(entriesColRef, orderBy('timestamp', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WeightEntry));
};

/**
 * Creates or updates a weight entry for a specific date.
 * @param {string} userId - The user's ID.
 * @param {string} date - The date string (YYYY-MM-DD).
 * @param {number} weight_kg - The weight in kilograms.
 */
export const addOrUpdateWeightEntry = async (userId: string, date: string, weight_kg: number): Promise<void> => {
  const entryDocRef = doc(db, `users/${userId}/weightEntries`, date);
  await setDoc(entryDocRef, { 
    weight_kg: Number(weight_kg),
    timestamp: Timestamp.fromDate(new Date(date))
  }, { merge: true });
};

// --- DAILY LOGS (CALORIES) --- //

/**
 * Fetches all food log entries for a user on a specific date.
 * @param {string} userId - The user's ID.
 * @param {string} date - The date string (YYYY-MM-DD).
 * @returns {Promise<Array>} - An array of food log entry objects.
 */
export const getDailyLogEntries = async (userId: string, date: string): Promise<FoodLogEntry[]> => {
  
  const startOfDay = Timestamp.fromDate(new Date(date));
  const endOfDay = Timestamp.fromDate(new Date(`${date}T23:59:59.999`));
  
  const entriesColRef = collection(db, `users/${userId}/dailyLogs`);
  const q = query(entriesColRef, 
    where('timestamp', '>=', startOfDay),
    where('timestamp', '<=', endOfDay)
  );
  
  try {
    const snapshot = await getDocs(q);
    const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FoodLogEntry));
    
    return logs;
  } catch (error) {
    console.error('Firestore - Error in getDailyLogEntries:', error); // DIAGNOSTIC LOG
    throw error;
  }
};

/**
 * Adds a new food entry to the daily log.
 * @param {string} userId - The user's ID.
 * @param {object} foodData - The food item data.
 * @param {string} date - The date string (YYYY-MM-DD) for the log entry.
 * @returns {Promise<DocumentReference>} - The reference to the newly created document.
 */
export const addFoodLogEntry = async (userId: string, foodData: any, date: string): Promise<void> => {
  
  const entriesColRef = collection(db, `users/${userId}/dailyLogs`);
  // Use the provided date to create a timestamp for the log entry
  const logTimestamp = Timestamp.fromDate(new Date(date));
  try {
    await addDoc(entriesColRef, {
      ...foodData,
      timestamp: logTimestamp
    });
    
    await addRecentFood(userId, foodData); // Add to recent foods
  } catch (error) {
    console.error('Firestore - Error in addFoodLogEntry:', error); // DIAGNOSTIC LOG
    throw error;
  }
};

/**
 * Updates an existing food entry in the daily log.
 * @param {string} userId - The user's ID.
 * @param {string} entryId - The ID of the log entry to update.
 * @param {object} updatedFoodData - The updated food item data.
 */
export const updateFoodLogEntry = async (userId: string, entryId: string, updatedFoodData: any): Promise<void> => {
  
  const entryDocRef = doc(db, `users/${userId}/dailyLogs`, entryId);
  try {
    await updateDoc(entryDocRef, {
      description: updatedFoodData.description,
      calories: updatedFoodData.calories,
      mealType: updatedFoodData.mealType,
      // timestamp is not updated on edit, it remains the original log time
    });
    
    await addRecentFood(userId, updatedFoodData); // Update recent foods with new data
  } catch (error) {
    console.error('Firestore - Error in updateFoodLogEntry:', error); // DIAGNOSTIC LOG
    throw error;
  }
};

/**
 * Deletes a food entry from the daily log.
 * @param {string} userId - The user's ID.
 * @param {string} entryId - The ID of the log entry to delete.
 */
export const deleteFoodLogEntry = async (userId: string, entryId: string): Promise<void> => {
  
  const entryDocRef = doc(db, `users/${userId}/dailyLogs`, entryId);
  try {
    await deleteDoc(entryDocRef);
    
  } catch (error) {
    console.error('Firestore - Error in deleteFoodLogEntry:', error); // DIAGNOSTIC LOG
    throw error;
  }
};

/**
 * Fetches daily calorie totals for a user within a specified date range.
 * @param {string} userId - The user's ID.
 * @param {string} startDate - The start date string (YYYY-MM-DD).
 * @param {string} endDate - The end date string (YYYY-MM-DD).
 * @returns {Promise<Array>} - An array of objects, each with a date and totalCalories.
 */
export const getDailyCalorieTotals = async (userId: string, startDate: string, endDate: string): Promise<{ date: string; totalCalories: number; }[]> => {
  
  const startTimestamp = Timestamp.fromDate(new Date(startDate));
  const endTimestamp = Timestamp.fromDate(new Date(`${endDate}T23:59:59.999`));

  const entriesColRef = collection(db, `users/${userId}/dailyLogs`);
  const q = query(entriesColRef,
    where('timestamp', '>=', startTimestamp),
    where('timestamp', '<=', endTimestamp),
    orderBy('timestamp', 'asc')
  );

  try {
    const snapshot = await getDocs(q);
    const dailyTotals: { [key: string]: number } = {};

    snapshot.docs.forEach(doc => {
      const data = doc.data() as FoodLogEntry;
      const date = data.timestamp.toDate().toISOString().split('T')[0];
      dailyTotals[date] = (dailyTotals[date] || 0) + data.calories;
    });

    // Convert to array of { date, totalCalories } objects and ensure all days in range are present
    const result: { date: string; totalCalories: number; }[] = [];
    let currentDate = new Date(startDate);
    const lastDate = new Date(endDate);

    while (currentDate <= lastDate) {
      const dateString = currentDate.toISOString().split('T')[0];
      result.push({
        date: dateString,
        totalCalories: dailyTotals[dateString] || 0
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return result;
  } catch (error) {
    console.error('Firestore - Error in getDailyCalorieTotals:', error); // DIAGNOSTIC LOG
    throw error;
  }
};

// --- RECENT FOODS --- //

/**
 * Fetches the most recently used food items for a user.
 * @param {string} userId - The user's ID.
 * @returns {Promise<Array>} - An array of recent food objects.
 */
export const getRecentFoods = async (userId: string): Promise<RecentFood[]> => {
  const recentFoodsColRef = collection(db, `users/${userId}/recentFoods`);
  const q = query(recentFoodsColRef, orderBy('lastUsed', 'desc'), where('lastUsed', '!=', null));
  const snapshot = await getDocs(q);
  const foods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RecentFood));
  return foods;
};

/**
 * Adds a food item to the user's recent foods list.
 * Uses a hash of the description to avoid duplicates.
 * @param {string} userId - The user's ID.
 * @param {object} foodData - The food item data.
 */
export const addRecentFood = async (userId: string, foodData: any): Promise<void> => {
  
  // A simple hash to create a consistent ID for each unique food description.
  const foodId = btoa(foodData.description.toLowerCase()).substring(0, 20);
  const recentFoodDocRef = doc(db, `users/${userId}/recentFoods`, foodId);
  try {
    await setDoc(recentFoodDocRef, {
      description: foodData.description,
      calories: foodData.calories,
      lastUsed: serverTimestamp()
    }, { merge: true });
    
  } catch (error) {
    console.error('Firestore - Error in addRecentFood:', error); // DIAGNOSTIC LOG
    throw error;
  }
};