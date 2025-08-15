/**
 * Calculates age from a year of birth.
 * @param {number} birthYear - The user's birth year.
 * @returns {number} - The calculated age.
 */
const calculateAge = (birthYear) => {
  const currentYear = new Date().getFullYear();
  return currentYear - birthYear;
};

/**
 * Calculates Basal Metabolic Rate (BMR) using the Mifflin-St Jeor equation.
 * Note: This simplified version doesn't require gender.
 * @param {object} metrics - User metrics.
 * @param {number} metrics.weight_kg - Weight in kilograms.
 * @param {number} metrics.height_cm - Height in centimeters.
 * @param {number} metrics.birthYear - Year of birth.
 * @returns {number} - The calculated BMR.
 */
export const calculateBMR = ({ weight_kg, height_cm, birthYear }) => {
  const age = calculateAge(birthYear);
  // Mifflin-St Jeor Equation: 10 * weight (kg) + 6.25 * height (cm) - 5 * age (y) + 5 (for men) / - 161 (for women)
  // We use a simplified, gender-neutral version by omitting the last constant.
  return (10 * weight_kg) + (6.25 * height_cm) - (5 * age);
};

/**
 * Calculates Total Daily Energy Expenditure (TDEE).
 * @param {number} bmr - The user's Basal Metabolic Rate.
 * @param {string} activityLevel - The user's activity level.
 * @returns {number} - The calculated TDEE.
 */
export const calculateTDEE = (bmr, activityLevel) => {
  const activityMultipliers = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
  };
  const multiplier = activityMultipliers[activityLevel] || 1.2;
  return bmr * multiplier;
};

/**
 * Suggests a daily calorie target based on the user's goal.
 * @param {number} tdee - The user's TDEE.
 * @param {string} goal - The user's weight goal ('lose', 'maintain', 'gain').
 * @returns {number} - The suggested daily calorie target.
 */
export const suggestCalorieTarget = (tdee, goal) => {
  let adjustment = 0;
  if (goal === 'lose') {
    adjustment = -500; // Standard 500 calorie deficit for ~1 lb/week loss
  } else if (goal === 'gain') {
    adjustment = 300; // Standard 300 calorie surplus for lean gain
  }
  return Math.round((tdee + adjustment) / 10) * 10; // Round to nearest 10
};