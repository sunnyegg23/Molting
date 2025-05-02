// src/App.js
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CalendarPage from './components/CalendarPage';
import WorkingHabitsPage from "./components/workingHabitsPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
          <Route path="/" element={<CalendarPage />} />
          <Route path="/WorkingHabitsPage" element={<WorkingHabitsPage />} />
        {/* 未來可在這裡加更多頁面 */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
