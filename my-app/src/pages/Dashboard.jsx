import { Routes, Route } from 'react-router-dom';
import Overview from './Overview';
import Sessions from './Sessions';
import Attendance from './Attendance';
import Submissions from './Submissions';
import Projects from './Projects';
import Announcements from './Announcements';
import Profile from './Profile';

const Dashboard = () => {
  return (
    <Routes>
      <Route path="/" element={<Overview />} />
      <Route path="/sessions" element={<Sessions />} />
      <Route path="/attendance" element={<Attendance />} />
      <Route path="/submissions" element={<Submissions />} />
      <Route path="/projects" element={<Projects />} />
      <Route path="/announcements" element={<Announcements />} />
      <Route path="/profile" element={<Profile />} />
    </Routes>
  );
};

export default Dashboard;

