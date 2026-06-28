import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAdminAuth } from '../../hooks/useAdminAuth'
import { useBookings } from '../../hooks/useBookings'
import { useUsers } from '../../hooks/useUsers'
import { isToday } from '../../utils/dateHelpers'
import AdminSchedules from './AdminSchedules'
import DashboardHeader from '../../components/admin/DashboardHeader'
import DashboardStats from '../../components/admin/DashboardStats'
import BookingTable from '../../components/admin/bookings/BookingTable'
import UserManager from '../../components/admin/users/UserManager'
import DangerZone from '../../components/admin/danger/DangerZone'

const AdminDashboard = () => {
  const auth = useAdminAuth()
  const bookingsHook = useBookings(auth)
  const usersHook = useUsers(auth)

  const [activeTab, setActiveTab] = useState('tools')

  const { fetchBookings, bookings, loading, error, fetchVerificationRequests } = bookingsHook
  const { fetchAdminUsers } = usersHook

  // Sync initial stats loading
  useEffect(() => {
    fetchBookings((token) => {
      if (localStorage.getItem('adminRole') === 'manager') {
        fetchAdminUsers(token)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync verifications tab
  useEffect(() => {
    if (activeTab === 'verifications') {
      fetchVerificationRequests()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  // Stats computation
  const bookingsToday = useMemo(() => {
    return bookings.filter((b) => isToday(b.timestamp, true)).length
  }, [bookings])

  const travelToday = useMemo(() => {
    return bookings.filter((b) => isToday(b.travel_date, false)).length
  }, [bookings])

  const confirmedCount = useMemo(() => bookings.filter((b) => b.status === 'confirmed').length, [bookings])
  const cancelledCount = useMemo(() => bookings.filter((b) => b.status === 'cancelled').length, [bookings])
  const pendingCount = useMemo(() => bookings.filter((b) => b.status === 'pending').length, [bookings])

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans" dir="rtl">
      <DashboardHeader username={auth.username} handleLogout={auth.handleLogout} />

      {/* Main Body Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Right Sidebar (Navigation) */}
        <aside className="w-full md:w-64 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-800/80">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">لوحة التحكم والموقع</p>
          </div>
          <nav className="flex-1 p-3 space-y-1.5">
            <button
              onClick={() => setActiveTab('tools')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === 'tools'
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              الأدوات الرئيسية (cPanel)
            </button>
            <button
              onClick={() => setActiveTab('database')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === 'database'
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
              مستعرض قاعدة البيانات
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === 'users'
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              إدارة المشرفين والحسابات
            </button>
            <button
              onClick={() => setActiveTab('verifications')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === 'verifications'
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              طلبات توثيق الحسابات
            </button>
            <button
              onClick={() => setActiveTab('schedules')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === 'schedules'
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <svg xmlns="http://www.w3.org/2050/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" />
              </svg>
              إدارة الجداول والمواعيد
            </button>
            <Link
              to="/admin"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              إشعارات وتذاكر الركاب
            </Link>
            {auth.role === 'manager' && (
              <button
                onClick={() => setActiveTab('danger')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition ${
                  activeTab === 'danger'
                    ? 'bg-red-650 text-white shadow-md'
                    : 'text-red-500 hover:bg-red-950/20 hover:text-red-400'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                منطقة الخطر (Dangerous Zone)
              </button>
            )}
          </nav>
          <div className="p-4 border-t border-slate-800/80 text-xs text-slate-500 text-center font-mono">
            YemenBus © 2026
          </div>
        </aside>

        {/* Content Wrapper */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950 flex flex-col xl:flex-row gap-6">
          {loading ? (
            <div className="flex-1 flex items-center justify-center p-12 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-3xl">
              <div className="text-center">
                <div className="inline-block w-8 h-8 border-4 border-t-orange-500 border-r-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-slate-500">جارٍ تحميل لوحة تحكم cPanel...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex-1 p-8 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-3xl text-red-700 dark:text-red-300">
              {error}
            </div>
          ) : (
            <>
              {/* Tab Content (Right 3 Columns on large screens) */}
              <div className="flex-1 xl:max-w-[75%] space-y-6">
                
                {/* 1. TOOLS TAB */}
                {activeTab === 'tools' && (
                  <div className="space-y-6 animate-fadeIn">
                    {/* Header Intro */}
                    <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-3xl p-8 shadow-lg relative overflow-hidden">
                      <div className="absolute top-0 left-0 translate-x-[-10%] translate-y-[-10%] w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>
                      <h2 className="text-3xl font-black mb-2">أهلاً بك في لوحة إدارة الموقع</h2>
                      <p className="text-orange-50 max-w-2xl text-sm leading-6">
                        تحكّم بشكل كامل في إعدادات الموقع والمشرفين والجداول الزمنية وتصدير البيانات من خلال هذا النظام المتكامل المصمم كلياً لتوفير أقصى درجات الفعالية والأمان.
                      </p>
                    </div>

                    {/* cPanel Categories */}
                    <div className="space-y-6">
                      {/* Section: Accounts */}
                      <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-sm">
                        <div className="bg-slate-50 dark:bg-neutral-800/50 px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">إدارة الحسابات والمشرفين (Accounts)</h3>
                        </div>
                        <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <button
                            onClick={() => setActiveTab('users')}
                            className="flex flex-col items-center justify-center p-5 rounded-2xl border border-slate-100 dark:border-neutral-800 hover:border-orange-500 dark:hover:border-orange-500 bg-slate-50/50 dark:bg-neutral-950/40 hover:bg-white transition text-center group"
                          >
                            <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                              </svg>
                            </div>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">إنشاء مشرف جديد</span>
                          </button>

                          <button
                            onClick={() => setActiveTab('users')}
                            className="flex flex-col items-center justify-center p-5 rounded-2xl border border-slate-100 dark:border-neutral-800 hover:border-orange-500 dark:hover:border-orange-500 bg-slate-50/50 dark:bg-neutral-950/40 hover:bg-white transition text-center group"
                          >
                            <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                            </div>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">قائمة المسؤولين</span>
                          </button>
                        </div>
                      </div>

                      {/* Section: Database & Files */}
                      <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-sm">
                        <div className="bg-slate-50 dark:bg-neutral-800/50 px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">إدارة البيانات والأرشيف (Files & Databases)</h3>
                        </div>
                        <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <button
                            onClick={() => setActiveTab('database')}
                            className="flex flex-col items-center justify-center p-5 rounded-2xl border border-slate-100 dark:border-neutral-800 hover:border-orange-500 dark:hover:border-orange-500 bg-slate-50/50 dark:bg-neutral-950/40 hover:bg-white transition text-center group"
                          >
                            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                              </svg>
                            </div>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">مستعرض قاعدة البيانات</span>
                          </button>

                          <button
                            onClick={() => bookingsHook.filteredBookings && bookingsHook.filteredBookings.length > 0 && require('../utils/bookingHelpers').handleExcelDownload(bookingsHook.filteredBookings)}
                            className="flex flex-col items-center justify-center p-5 rounded-2xl border border-slate-100 dark:border-neutral-800 hover:border-orange-500 dark:hover:border-orange-500 bg-slate-50/50 dark:bg-neutral-950/40 hover:bg-white transition text-center group"
                          >
                            <div className="w-12 h-12 rounded-full bg-teal-500/10 text-teal-600 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">تصدير البيانات Excel</span>
                          </button>

                          <button
                            onClick={() => bookingsHook.filteredBookings && bookingsHook.filteredBookings.length > 0 && require('../utils/bookingHelpers').handlePrintManifest(bookingsHook.filteredBookings)}
                            className="flex flex-col items-center justify-center p-5 rounded-2xl border border-slate-100 dark:border-neutral-800 hover:border-orange-500 dark:hover:border-orange-500 bg-slate-50/50 dark:bg-neutral-950/40 hover:bg-white transition text-center group"
                          >
                            <div className="w-12 h-12 rounded-full bg-violet-500/10 text-violet-600 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                              </svg>
                            </div>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">طباعة الكشوفات (البيان)</span>
                          </button>
                        </div>
                      </div>

                      {/* Section: Schedules & Trips */}
                      <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-sm">
                        <div className="bg-slate-50 dark:bg-neutral-800/50 px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">الرحلات وجداول العمل (Schedules)</h3>
                        </div>
                        <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <button
                            onClick={() => setActiveTab('schedules')}
                            className="flex flex-col items-center justify-center p-5 rounded-2xl border border-slate-100 dark:border-neutral-800 hover:border-orange-500 dark:hover:border-orange-500 bg-slate-50/50 dark:bg-neutral-950/40 hover:bg-white transition text-center group"
                          >
                            <div className="w-12 h-12 rounded-full bg-orange-500/10 text-orange-600 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">إدارة مواعيد الرحلات</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. DATABASE TAB */}
                {activeTab === 'database' && (
                  <BookingTable
                    bookings={bookings}
                    filteredBookings={bookingsHook.filteredBookings}
                    dbSearch={bookingsHook.dbSearch}
                    setDbSearch={bookingsHook.setDbSearch}
                    dbStatusFilter={bookingsHook.dbStatusFilter}
                    setDbStatusFilter={bookingsHook.setDbStatusFilter}
                    dbDateFilter={bookingsHook.dbDateFilter}
                    setDbDateFilter={bookingsHook.setDbDateFilter}
                    dbPage={bookingsHook.dbPage}
                    setDbPage={bookingsHook.setDbPage}
                  />
                )}

                {/* 3. USERS TAB */}
                {activeTab === 'users' && (
                  <UserManager
                    adminUsers={usersHook.adminUsers}
                    newUser={usersHook.newUser}
                    setNewUser={usersHook.setNewUser}
                    userMessage={usersHook.userMessage}
                    userError={usersHook.userError}
                    creatingUser={usersHook.creatingUser}
                    handleCreateUser={usersHook.handleCreateUser}
                  />
                )}

                {/* 4. VERIFICATIONS TAB */}
                {activeTab === 'verifications' && (
                  <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm space-y-6 animate-fadeIn">
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-neutral-800 pb-4">
                      <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">طلبات توثيق حسابات الركاب</h2>
                        <p className="text-xs text-slate-500 mt-1">مراجعة وثائق الهوية والتحقق منها لتأكيد حسابات الركاب.</p>
                      </div>
                      <button
                        onClick={fetchVerificationRequests}
                        className="rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 hover:bg-slate-100 dark:bg-neutral-800 dark:hover:bg-neutral-700 px-4 py-2 text-xs font-bold transition flex items-center gap-1.5"
                      >
                        🔄 تحديث القائمة
                      </button>
                    </div>

                    {bookingsHook.loadingVerifications ? (
                      <div className="text-center py-12">
                        <div className="inline-block w-8 h-8 border-4 border-t-orange-500 border-r-transparent rounded-full animate-spin mb-3"></div>
                        <p className="text-sm text-slate-500">جاري تحميل طلبات التوثيق...</p>
                      </div>
                    ) : bookingsHook.verificationError ? (
                      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-950 dark:bg-red-950/20 dark:text-red-400">
                        {bookingsHook.verificationError}
                      </div>
                    ) : bookingsHook.verificationRequests.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 dark:text-slate-500 font-semibold">
                        لا توجد طلبات توثيق معروضة حالياً.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-right text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-neutral-800 text-slate-400 font-bold bg-slate-50/50 dark:bg-neutral-800/20">
                              <th className="p-3">المسافر</th>
                              <th className="p-3">الهاتف</th>
                              <th className="p-3">نوع الهوية</th>
                              <th className="p-3">رقم الهوية</th>
                              <th className="p-3">مكان/تاريخ الإصدار</th>
                              <th className="p-3 text-center">الوثيقة</th>
                              <th className="p-3 text-center">الحالة</th>
                              <th className="p-3 text-center">الإجراءات</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bookingsHook.verificationRequests.map((req) => (
                              <tr key={req.id} className="border-b border-slate-100 dark:border-neutral-800/60 hover:bg-slate-50/30 dark:hover:bg-neutral-800/10">
                                <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{req.fullname}</td>
                                <td className="p-3 font-mono">{req.phone}</td>
                                <td className="p-3">{req.identityType}</td>
                                <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-350">{req.identityNumber}</td>
                                <td className="p-3">
                                  <div>{req.issuePlace}</div>
                                  <div className="text-[10px] text-slate-400">{req.issueDate}</div>
                                </td>
                                <td className="p-3 text-center">
                                  <button
                                    onClick={() => {
                                      bookingsHook.setSelectedVerifyRequest(req)
                                      bookingsHook.setShowVerifyModal(true)
                                    }}
                                    className="text-violet-600 dark:text-violet-400 hover:underline font-bold"
                                  >
                                    🔍 عرض الوثيقة
                                  </button>
                                </td>
                                <td className="p-3 text-center">
                                  {req.status === 'approved' && (
                                    <span className="bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-300 px-2.5 py-0.5 rounded-full font-bold">
                                      موثق
                                    </span>
                                  )}
                                  {req.status === 'pending' && (
                                    <span className="bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300 px-2.5 py-0.5 rounded-full font-bold">
                                      معلق
                                    </span>
                                  )}
                                  {req.status === 'rejected' && (
                                    <span className="bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-300 px-2.5 py-0.5 rounded-full font-bold">
                                      مرفوض
                                    </span>
                                  )}
                                </td>
                                <td className="p-3 text-center">
                                  {req.status === 'pending' ? (
                                    <div className="flex justify-center gap-1.5">
                                      <button
                                        onClick={() => bookingsHook.handleApproveVerification(req.id)}
                                        className="bg-green-600 hover:bg-green-700 text-white px-2.5 py-1 rounded-lg font-bold text-[10px] transition"
                                      >
                                        ✓ موافقة
                                      </button>
                                      <button
                                        onClick={() => bookingsHook.handleRejectVerification(req.id)}
                                        className="bg-red-650 hover:bg-red-700 text-white px-2.5 py-1 rounded-lg font-bold text-[10px] transition"
                                      >
                                        ✕ رفض
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-slate-400">-</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* 5. SCHEDULES TAB */}
                {activeTab === 'schedules' && (
                  <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm animate-fadeIn">
                    <AdminSchedules isDashboard={true} />
                  </div>
                )}

                {/* 6. DANGER TAB */}
                {activeTab === 'danger' && (
                  <DangerZone
                    handleClearDatabase={bookingsHook.handleClearDatabase}
                    handleClearClients={bookingsHook.handleClearClients}
                    adminUsers={usersHook.adminUsers}
                    handleDeleteAdmin={usersHook.handleDeleteAdmin}
                  />
                )}

              </div>

              {/* cPanel Sidebar Info (Left Column) */}
              <DashboardStats
                username={auth.username}
                dbSize={bookingsHook.dbSize}
                totalBookings={bookings.length}
                bookingsToday={bookingsToday}
                travelToday={travelToday}
                pendingCount={pendingCount}
                confirmedCount={confirmedCount}
                cancelledCount={cancelledCount}
              />
            </>
          )}
        </div>
      </div>

      {/* IDENTITY IMAGE MODAL */}
      {bookingsHook.showVerifyModal && bookingsHook.selectedVerifyRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl font-sans">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800" dir="rtl">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">وثيقة الهوية: {bookingsHook.selectedVerifyRequest.fullname}</h3>
              <button
                type="button"
                onClick={() => {
                  bookingsHook.setShowVerifyModal(false)
                  bookingsHook.setSelectedVerifyRequest(null)
                }}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-950" dir="rtl">
              <img
                src={`${bookingsHook.selectedVerifyRequest.identityImageUrl}?token=${auth.getToken()}`}
                alt="وثيقة الهوية"
                className="max-h-[50vh] w-full object-contain rounded-2xl border border-neutral-200 dark:border-neutral-850 shadow-md"
              />
              <div className="mt-4 grid grid-cols-2 gap-4 w-full max-w-md text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-2xl">
                <div>رقم الهوية: <span className="font-bold font-mono">{bookingsHook.selectedVerifyRequest.identityNumber}</span></div>
                <div>نوع الهوية: <span className="font-bold">{bookingsHook.selectedVerifyRequest.identityType}</span></div>
                <div>مكان الإصدار: <span className="font-bold">{bookingsHook.selectedVerifyRequest.issuePlace}</span></div>
                <div>تاريخ الإصدار: <span className="font-bold font-mono">{bookingsHook.selectedVerifyRequest.issueDate}</span></div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  bookingsHook.setShowVerifyModal(false)
                  bookingsHook.setSelectedVerifyRequest(null)
                }}
                className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-5 py-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default React.memo(AdminDashboard)
