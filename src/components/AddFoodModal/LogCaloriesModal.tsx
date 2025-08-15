import React, { useState, useEffect, FormEvent } from 'react';
import styles from './LogCaloriesModal.module.css';
import { FoodLogEntry } from '../../firebase/firestore';

interface LogCaloriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (action: 'add' | 'edit', mealType: string, foodData: { description: string; calories: number }, selectedDate: string, foodToEdit: FoodLogEntry | null) => void;
  selectedDate: string;
  foodToEdit: FoodLogEntry | null;
}

const LogCaloriesModal: React.FC<LogCaloriesModalProps> = ({ isOpen, onClose, onSave, selectedDate, foodToEdit }) => {
  const [description, setDescription] = useState('');
  const [calories, setCalories] = useState('');
  const [selectedMealType, setSelectedMealType] = useState('Breakfast');

  const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

  useEffect(() => {
    if (foodToEdit) {
      setDescription(foodToEdit.description || '');
      setCalories(typeof foodToEdit.calories === 'number' ? foodToEdit.calories.toString() : '');
      setSelectedMealType(foodToEdit.mealType || 'Breakfast');
    } else {
      setDescription('');
      setCalories('');
      setSelectedMealType('Breakfast');
    }
  }, [foodToEdit, isOpen]);

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    const finalDescription = description.trim() === '' ? selectedMealType : description;

    if (finalDescription && Number(calories) > 0) {
      const actionType = foodToEdit ? 'edit' : 'add';
      const foodData = { description: finalDescription, calories: Number(calories) };

      onSave(actionType, selectedMealType, foodData, selectedDate, foodToEdit);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className={styles.closeButton}>×</button>
        <h2 className={styles.title}>{`Log Calories (for ${selectedDate})`}</h2>
        
        <form onSubmit={handleSave} className={styles.form}>
          <div className={styles.inputGroup}>
            <label>Meal Type</label>
            <div className={styles.mealTypeTiles}>
              {mealTypes.map(type => (
                <button
                  key={type}
                  type="button"
                  className={`${styles.mealTypeTile} ${selectedMealType === type ? styles.active : ''}`}
                  onClick={() => setSelectedMealType(type)}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="description">Description (optional)</label>
            <input 
              type="text" 
              id="description"
              placeholder="e.g., Apple slices with peanut butter"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="calories">Calories (kcal)</label>
            <input 
              type="number" 
              id="calories"
              placeholder="e.g., 250"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              className={styles.input}
              required
            />
          </div>

          <button type="submit" className={styles.saveButton}>
            LOG
          </button>
        </form>
      </div>
    </div>
  );
};

export default LogCaloriesModal;