import React, { useState, useEffect, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './OnboardingFlow.module.css';
import { calculateBMR, calculateTDEE, suggestCalorieTarget } from '../../utils/healthCalculators';
import { useAuth } from '../../firebase/auth';
import { updateUserOnboardingData } from '../../firebase/firestore';
import { useUserProfile } from '../../context/UserProvider';

interface FormData {
  goal: 'lose' | 'maintain' | 'gain';
  height_cm: string;
  currentWeight_kg: string;
  birthYear: string;
  activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active';
}

const OnboardingFlow: React.FC = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    goal: 'maintain',
    height_cm: '',
    currentWeight_kg: '',
    birthYear: '',
    activityLevel: 'sedentary',
  });
  const [calculatedTarget, setCalculatedTarget] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshUserProfile } = useUserProfile();

  useEffect(() => {
    document.title = 'HealthTracker - Onboarding';
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value as any }));
  };

  const handleNext = () => {
    const currentYear = new Date().getFullYear();
    if (step === 2) {
      if (!formData.height_cm || !formData.currentWeight_kg || !formData.birthYear) {
        alert('Please fill in all your metrics.');
        return;
      }
      const parsedBirthYear = Number(formData.birthYear);
      if (isNaN(parsedBirthYear) || parsedBirthYear <= 0) {
        alert('Please enter a valid year of birth.');
        return;
      }
      if (parsedBirthYear > currentYear) {
        alert('Birth year cannot be in the future.');
        return;
      }
      if (currentYear - parsedBirthYear < 10) {
        alert('You must be at least 10 years old.');
        return;
      }
      const bmr = calculateBMR({
        weight_kg: Number(formData.currentWeight_kg),
        height_cm: Number(formData.height_cm),
        birthYear: parsedBirthYear
      });
      const tdee = calculateTDEE(bmr, formData.activityLevel);
      const target = suggestCalorieTarget(tdee, formData.goal);
      setCalculatedTarget(target);
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleFinish = async () => {
    if (!user) {
      alert("Error: You are not logged in.");
      return;
    }
    setLoading(true);
    try {
      const finalData = {
        ...formData,
        height_cm: Number(formData.height_cm),
        currentWeight_kg: Number(formData.currentWeight_kg),
        birthYear: Number(formData.birthYear),
        calorieTarget: calculatedTarget
      };
      await updateUserOnboardingData(user.uid, finalData);
      
      if (refreshUserProfile) {
        await refreshUserProfile();
      }
      navigate('/dashboard');
    } catch (error) {
      console.error("Error saving onboarding data: ", error);
      alert("Failed to save your information. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.progressBar}>
          <div className={styles.progress} style={{ width: `${(step / 3) * 100}%` }}></div>
        </div>

        {step === 1 && (
          <div className={styles.step}>
            <h2 className={styles.title}>What is your primary goal?</h2>
            <div className={styles.goalOptions}>
              {['lose', 'maintain', 'gain'].map(goal => (
                <button 
                  key={goal}
                  name="goal"
                  onClick={() => setFormData(prev => ({ ...prev, goal: goal as FormData['goal'] }))}
                  className={`${styles.goalButton} ${formData.goal === goal ? styles.selected : ''}`}>
                  {goal.charAt(0).toUpperCase() + goal.slice(1)} Weight
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className={styles.step}>
            <h2 className={styles.title}>Tell us about yourself</h2>
            <div className={styles.metricsForm}>
              <div className={styles.inputGroup}>
                <label>Height (cm)</label>
                <input type="number" name="height_cm" value={formData.height_cm} onChange={handleChange} placeholder="e.g., 175" />
              </div>
              <div className={styles.inputGroup}>
                <label>Current Weight (kg)</label>
                <input type="number" name="currentWeight_kg" value={formData.currentWeight_kg} onChange={handleChange} placeholder="e.g., 70" />
              </div>
              <div className={styles.inputGroup}>
                <label>Year of Birth</label>
                <input 
                  type="number" 
                  name="birthYear" 
                  value={formData.birthYear} 
                  onChange={handleChange} 
                  placeholder="e.g., 1990"
                  min="1900"
                  max={new Date().getFullYear()}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Activity Level</label>
                <select name="activityLevel" value={formData.activityLevel} onChange={handleChange}>
                  <option value="sedentary">Sedentary (little or no exercise)</option>
                  <option value="lightly_active">Lightly Active (light exercise/sports 1-3 days/week)</option>
                  <option value="moderately_active">Moderately Active (moderate exercise/sports 3-5 days/week)</option>
                  <option value="very_active">Very Active (hard exercise/sports 6-7 days a week)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className={styles.step}>
            <h2 className={styles.title}>Your Personalized Target</h2>
            <p className={styles.targetSubtitle}>Based on your information, we suggest this daily calorie target to help you reach your goal.</p>
            <div className={styles.targetDisplay}>
              {calculatedTarget ? `${calculatedTarget} kcal` : 'Calculating...'}
            </div>
            <p className={styles.disclaimer}>You can adjust this later in your settings.</p>
          </div>
        )}

        <div className={styles.navigation}>
          {step > 1 && <button onClick={handleBack} className={styles.backButton} disabled={loading}>Back</button>}
          {step < 3 && <button onClick={handleNext} className={styles.nextButton}>Next</button>}
          {step === 3 && <button onClick={handleFinish} className={styles.nextButton} disabled={loading}>{loading ? 'Saving...' : 'Finish Setup'}</button>}
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;
