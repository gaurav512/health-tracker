import React, { useState, useEffect, forwardRef } from 'react';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';
import 'react-datepicker/dist/react-datepicker.css';
import styles from './WeightEntryForm.module.css';
import { useToast } from '../../context/ToastProvider';

// Helper to get today's date in YYYY-MM-DD format (keep this for max date)
const getTodayString = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// Custom Input for DatePicker
const CustomDateInput = forwardRef(({
  value,
  onClick,
  getRelativeDateString,
  formattedDate
}, ref) => (
  <input
    type="text"
    className={styles.dateDisplayButton}
    onClick={onClick}
    value={getRelativeDateString(formattedDate)}
    readOnly
    ref={ref}
  />
));

// Add getRelativeDateString as a prop
const WeightEntryForm = ({ onSave, entries = [], getRelativeDateString }) => {
  const [date, setDate] = useState(new Date()); // Initialize with Date object
  const [weight, setWeight] = useState('');
  const [isExistingEntry, setIsExistingEntry] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const entryForDate = entries.find(e => e.id === format(date, 'yyyy-MM-dd'));
    if (entryForDate) {
      setWeight(entryForDate.weight_kg);
      setIsExistingEntry(true);
    } else {
      setWeight('');
      setIsExistingEntry(false);
    }
  }, [date, entries]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!weight || weight <= 0) {
      showToast('Please enter a valid weight.', 'error');
      return;
    };
    onSave(format(date, 'yyyy-MM-dd'), weight); // Pass formatted date string
    showToast(`Weight for ${getRelativeDateString(format(date, 'yyyy-MM-dd'))} has been saved.`, 'success'); // Use relative date in toast
  };

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Weight Entry</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <DatePicker
            selected={date}
            onChange={(newDate) => setDate(newDate)}
            dateFormat="yyyy-MM-dd"
            maxDate={new Date()}
            customInput={ // Render a custom input to display the date
              <CustomDateInput
                getRelativeDateString={getRelativeDateString}
                formattedDate={format(date, 'yyyy-MM-dd')}
              />
            }
          />
        </div>
        <div className={styles.inputGroup}>
          <label htmlFor="weight-kg">Weight (kg)</label>
          <input
            type="number"
            id="weight-kg"
            step="0.1"
            placeholder="e.g., 75.5"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className={styles.weightInput}
          />
        </div>
        <button type="submit" className={styles.submitButton}>
          {isExistingEntry ? 'Update Weight' : 'Record Weight'}
        </button>
      </form>
    </div>
  );
};

export default WeightEntryForm;