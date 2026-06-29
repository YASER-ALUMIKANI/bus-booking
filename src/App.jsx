import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/navbar/Navbar';
import Home from './pages/Home';
import About from './pages/About';
import Bus from './pages/Bus';
import Services from './pages/Services';
import AdminLogin from './pages/Admin/AdminLogin';
import AdminNotifications from './pages/Admin/AdminNotifications';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminSchedules from './pages/Admin/AdminSchedules';

function AppShell() {
  const location = useLocation();
  const showNavbar = location.pathname !== '/';

  return (
    <div className='w-full min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-800 dark:text-neutral-300 flex flex-col overflow-hidden'>
      {/* Navbar */}
      {showNavbar && <Navbar />}

      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/about' element={<About />} />
        <Route path='/bus' element={<Bus />} />
        <Route path='/services' element={<Services />} />
        <Route path='/admin/login' element={<AdminLogin />} />
        <Route path='/admin' element={<AdminNotifications />} />
        <Route path='/admin/dashboard' element={<AdminDashboard />} />
        <Route path='/admin/schedules' element={<AdminSchedules />} />
        <Route path='*' element={<Home />} />
      </Routes>

      <footer className="w-full py-4 mt-auto border-t border-neutral-200 dark:border-neutral-800 bg-neutral-100/50 dark:bg-neutral-900/50 text-center text-xs text-neutral-500 dark:text-neutral-400 font-sans z-10">
        Developed for Yemen Bus by{' '}
        <a
          href="https://www.linkedin.com/in/yaser-alhumikani-412042319"
          target="_blank"
          rel="noopener noreferrer"
          className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 transition-colors font-bold underline"
        >
          Y-Tech
        </a>
      </footer>
    </div>
  )
}

function App() {

  return (
      <Router>
        <AppShell />
      </Router>
  )
}

export default App
