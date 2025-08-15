import React, { useState, useEffect, forwardRef, ChangeEvent, FormEvent } from 'react';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';
import 'react-datepicker/dist/react-datepicker.css';
import styles from './WeightEntryForm.module.css';
import { useToast } from '../../context/ToastProvider';
import { WeightEntry } from '../../firebase/firestore';



interface CustomDateInputProps {
  value?: string;
  onClick?: () => void;
  getRelativeDateString: (date: string) => string;
  formattedDate: string;
}

const CustomDateInput = forwardRef<HTMLInputElement, CustomDateInputProps>((
  { onClick, getRelativeDateString, formattedDate }, 
  ref
) => (
  <input
    type="text"
    className={styles.dateDisplayButton}
    onClick={onClick}
    value={getRelativeDateString(formattedDate)}
    readOnly
    ref={ref}
  />
));

interface WeightEntryFormProps {
  onSave: (date: string, weight: string) => void;
  entries: WeightEntry[];
  getRelativeDateString: (date: string) => string;
}

const WeightEntryForm: React.FC<WeightEntryFormProps> = ({ onSave, entries = [], getRelativeDateString }) => {
  const [date, setDate] = useState<Date>(new Date());
  const [weight, setWeight] = useState('');
  const [isExistingEntry, setIsExistingEntry] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const entryForDate = entries.find(e => e.id === format(date, 'yyyy-MM-dd'));
    if (entryForDate) {
      setWeight(entryForDate.weight_kg.toString());
      setIsExistingEntry(true);
    } else {
      setWeight('');
      setIsExistingEntry(false);
    }
  }, [date, entries]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!weight || Number(weight) <= 0) {
      showToast('Please enter a valid weight.', 'error');
      return;
    }
    onSave(format(date, 'yyyy-MM-dd'), weight);
    showToast(`Weight for ${getRelativeDateString(format(date, 'yyyy-MM-dd'))} has been saved.`, 'success');
  };

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Weight Entry</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <DatePicker
            selected={date}
            onChange={(newDate: Date | null) => setDate(newDate || new Date())}
            dateFormat="yyyy-MM-dd"
            maxDate={new Date()}
            customInput={
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
            onChange={(e: ChangeEvent<HTMLInputElement>) => setWeight(e.target.value)}
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
