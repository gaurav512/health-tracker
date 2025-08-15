import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ProfilePage.module.css';
import { useAuth } from '../../firebase/auth';
import { useUserProfile } from '../../context/UserProvider';
import { useToast } from '../../context/ToastProvider';
import {
  updateUserProfileData,
  getUserProfile
} from '../../firebase/firestore';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userProfile, refreshUserProfile } = useUserProfile();
  const { showToast } = useToast();

  useEffect(() => {
    document.title = 'HealthTracker - Profile';
  }, []);

  const [displayName, setDisplayName] = useState('');
  const [height, setHeight] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [activityLevel, setActivityLevel] = useState('sedentary');
  const [goal, setGoal] = useState('maintain');
  const [weightGoal, setWeightGoal] = useState('');
  const [calorieTarget, setCalorieTarget] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [loading, setLoading] = useState(true);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);

  const activityLevels: { value: string; label: string }[] = [
    { value: 'sedentary', label: 'Sedentary (little or no exercise)' },
    { value: 'lightly_active', label: 'Lightly Active (light exercise/sports 1-3 days/week)' },
    { value: 'moderately_active', label: 'Moderately Active (moderate exercise/sports 3-5 days/week)' },
    { value: 'very_active', label: 'Very Active (hard exercise/sports 6-7 days/week)' },
  ];

  const goals: { value: string; label: string }[] = [
    { value: 'lose', label: 'Lose Weight' },
    { value: 'maintain', label: 'Maintain Weight' },
    { value: 'gain', label: 'Gain Weight' },
  ];

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setHeight(userProfile.height_cm?.toString() || '');
      setBirthYear(userProfile.birthYear?.toString() || '');
      setActivityLevel(userProfile.activityLevel || 'sedentary');
      setGoal(userProfile.goal || 'maintain');
      setWeightGoal(userProfile.weightGoal_kg?.toString() || '');
      setCalorieTarget(userProfile.calorieTarget?.toString() || '');
      setLoading(false);
    } else if (user) {
      const fetchProfile = async () => {
        const profile = await getUserProfile(user.uid);
        if (profile) {
          setDisplayName(profile.displayName || '');
          setHeight(profile.height_cm?.toString() || '');
          setBirthYear(profile.birthYear?.toString() || '');
          setActivityLevel(profile.activityLevel || 'sedentary');
          setGoal(profile.goal || 'maintain');
          setWeightGoal(profile.weightGoal_kg?.toString() || '');
          setCalorieTarget(profile.calorieTarget?.toString() || '');
        }
        setLoading(false);
      };
      fetchProfile();
    }
  }, [user, userProfile]);

  const handleProfileUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsProfileSaving(true);
    try {
      await updateUserProfileData(user.uid, {
        displayName,
        height_cm: Number(height),
        birthYear: Number(birthYear),
        activityLevel,
        goal,
        weightGoal_kg: Number(weightGoal),
        calorieTarget: Number(calorieTarget) || null,
      });
      await refreshUserProfile();
      showToast('Profile updated successfully!', 'success');
    } catch (error: any) {
      showToast(`Profile update failed: ${error.message}`, 'error');
      console.error('Profile update error:', error);
    } finally {
      setIsProfileSaving(false);
    }
  };

  const handlePasswordUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (newPassword !== confirmNewPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Password should be at least 6 characters.', 'error');
      return;
    }

    setIsPasswordSaving(true);
    try {
      if (user.email) {
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);
        showToast('Password updated successfully!', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      }
    } catch (error: any) {
      showToast(`Password update failed: ${error.message}. Please re-login if you haven\'t recently.`, 'error');
      console.error('Password update error:', error);
    } finally {
      setIsPasswordSaving(false);
    }
  };

  if (loading) {
    return <div className="full-page-loader"><div></div></div>;
  }

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1 className={styles.logo}>HealthTracker</h1>
        <button onClick={() => navigate('/dashboard')} className={styles.backButton}>&lt; Back to Dashboard</button>
      </header>
      <main className={styles.profileContent}>
        <h2 className={styles.sectionTitle}>Edit Profile</h2>
        <form onSubmit={handleProfileUpdate} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="displayName">Display Name</label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setDisplayName(e.target.value)}
              className={styles.input}
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="height">Height (cm)</label>
            <input
              type="number"
              id="height"
              value={height}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setHeight(e.target.value)}
              className={styles.input}
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="birthYear">Birth Year</label>
            <input
              type="number"
              id="birthYear"
              value={birthYear}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setBirthYear(e.target.value)}
              className={styles.input}
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="activityLevel">Activity Level</label>
            <select
              id="activityLevel"
              value={activityLevel}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setActivityLevel(e.target.value)}
              className={styles.select}
            >
              {activityLevels.map(level => (
                <option key={level.value} value={level.value}>{level.label}</option>
              ))}
            </select>
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="goal">Goal</label>
            <select
              id="goal"
              value={goal}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setGoal(e.target.value)}
              className={styles.select}
            >
              {goals.map(g => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="weightGoal">Target Weight (kg)</label>
            <input
              type="number"
              id="weightGoal"
              value={weightGoal}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setWeightGoal(e.target.value)}
              className={styles.input}
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="calorieTarget">Daily Calorie Target</label>
            <input
              type="number"
              id="calorieTarget"
              value={calorieTarget}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setCalorieTarget(e.target.value)}
              className={styles.input}
            />
          </div>
          <button type="submit" className={styles.saveButton} disabled={isProfileSaving}>
            {isProfileSaving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>

        <h2 className={styles.sectionTitle}>Change Password</h2>
        <form onSubmit={handlePasswordUpdate} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="currentPassword">Current Password</label>
            <input
              type="password"
              id="currentPassword"
              value={currentPassword}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setCurrentPassword(e.target.value)}
              className={styles.input}
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
              className={styles.input}
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="confirmNewPassword">Confirm New Password</label>
            <input
              type="password"
              id="confirmNewPassword"
              value={confirmNewPassword}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirmNewPassword(e.target.value)}
              className={styles.input}
              required
            />
          </div>
          <button type="submit" className={styles.saveButton} disabled={isPasswordSaving}>
            {isPasswordSaving ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </main>
    </div>
  );
};

export default ProfilePage;