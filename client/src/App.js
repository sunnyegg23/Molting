// src/App.js
import { BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import CalendarPage from './components/CalendarPage';
import WorkingHabitsPage from "./components/workingHabitsPage";
import TaskOverview from "./components/TaskOverview";
import SelfSpace from "./components/SelfSpace";

function App() {
  return (
    <Router>
      <Routes>
          <Route path="/" element={<CalendarPage />} />
          <Route path="/WorkingHabitsPage" element={<WorkingHabitsPage />} />
          <Route path="/TaskOverview" element={<TaskOverview />} />
          <Route path="/SelfSpace" element={<SelfSpace />} />
        {/* 未來可在這裡加更多頁面 */}
      </Routes>
    </Router>
  );
}

export default App;
