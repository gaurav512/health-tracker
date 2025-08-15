import { useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from './config';

/**
 * Signs up a new user with email, password, and display name.
 * Also creates a corresponding user document in Firestore.
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 * @param {string} displayName - The user's display name.
 * @returns {Promise<UserCredential>} - The user credential object.
 */
export const signUp = async (email, password, displayName) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  
  // Create user document in Firestore
  await setDoc(doc(db, 'users', user.uid), {
    displayName,
    email,
    createdAt: Timestamp.now(),
    // Onboarding data will be added in the onboarding flow
    height_cm: null,
    birthYear: null, // Changed from dob to birthYear
    activityLevel: null,
    calorieTarget: null,
    weightGoal_kg: null,
  });

  return userCredential;
};

/**
 * Signs in an existing user with email and password.
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 * @returns {Promise<UserCredential>} - The user credential object.
 */
export const signIn = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

/**
 * Signs out the current user.
 * @returns {Promise<void>}
 */
export const logOut = () => {
  return signOut(auth);
};

/**
 * A custom hook to get the current authenticated user.
 * Listens to Firebase auth state changes.
 * @returns {{user: object|null, loading: boolean}} - The current user and loading state.
 */
export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  return { user: currentUser, loading };
};