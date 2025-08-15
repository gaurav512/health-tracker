import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../firebase/auth';
import { getUserProfile } from '../firebase/firestore';

export const UserContext = createContext(null);

export const useUserProfile = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = useCallback(async () => {
    if (user) {
      setLoading(true);
      try {
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile);
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setLoading(false);
      }
    } else {
      setUserProfile(null);
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const refreshUserProfile = useCallback(() => {
    return fetchUserProfile();
  }, [fetchUserProfile]);

  return (
    <UserContext.Provider value={{ userProfile, loading, refreshUserProfile }}>
      {children}
    </UserContext.Provider>
  );
};