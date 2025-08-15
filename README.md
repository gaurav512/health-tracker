## HealthTracker Application Overview

HealthTracker is a comprehensive web application designed to help users manage their health and fitness goals. Built with React and Vite, it leverages Firebase for backend services, providing a robust and personalized experience.

### Key Features:

*   **User Authentication & Authorization:** Secure sign-up and login using Firebase, with protected routes ensuring only authenticated users can access core application features.
*   **User Profile & Onboarding:** Collects initial user data (birth year, height, weight, activity level, weight goal) to personalize health metrics.
*   **Personalized Health Metrics:** Calculates Basal Metabolic Rate (BMR) and Total Daily Energy Expenditure (TDEE), and suggests daily calorie targets based on user goals.
*   **Calorie Tracking:**
    *   Displays calorie budget and current consumption.
    *   Allows detailed food logging by meal type (Breakfast, Lunch, Dinner, Snacks) with descriptions and calorie counts.
    *   Supports adding, editing, and deleting food entries.
    *   Tracks and suggests recently logged foods for quick entry.
    *   Visualizes calorie intake over time with charts.
    *   Enables navigation to view/log data for past days.
*   **Weight Tracking:**
    *   Allows users to log their weight on specific dates.
    *   Visualizes weight trends and progress towards a weight goal using charts.
*   **Data Persistence:** All user data (profiles, weight entries, food logs, recent foods) is stored and managed using Firebase Firestore.
*   **User Experience & Utilities:** Includes toast notifications for user feedback, theme switching (light/dark mode), confirmation modals for critical actions, and loading indicators for data fetching.
