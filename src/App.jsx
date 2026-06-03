import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/navbar/Navbar';
import Home from './pages/Home';
import About from './pages/About';
import Bus from './pages/Bus';
import Services from './pages/Services';
import AdminLogin from './pages/AdminLogin';
import AdminNotifications from './pages/AdminNotifications';
import AdminDashboard from './pages/AdminDashboard';

function App() {

  return (
      <Router>
        <div className='w-full min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-800 dark:text-neutral-300 flex flex-col overflow-hidden'>
          {/* Navbar */}
          <Navbar />

          <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/about' element={<About />} />
            <Route path='/bus' element={<Bus />} />
            <Route path='/services' element={<Services />} />
            <Route path='/admin/login' element={<AdminLogin />} />
            <Route path='/admin' element={<AdminNotifications />} />
            <Route path='/admin/dashboard' element={<AdminDashboard />} />
            <Route path='*' element={<Home />} />
          </Routes>
        </div>
      </Router>
  )
}

export default App
