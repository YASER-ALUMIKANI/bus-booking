import React from 'react'
import { Link } from 'react-router-dom'

const DashboardHeader = ({ username, handleLogout }) => {
  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between px-6 shrink-0 shadow-md">
      <div className="flex items-center gap-3">
        <span className="text-xl font-black text-orange-500 tracking-wider">cPanel</span>
        <span className="text-xs font-semibold bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">YemenBus v1.2</span>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <div className="hidden sm:flex flex-col items-end">
          <span className="font-semibold text-slate-200">المسؤول: {username}</span>
          <span className="text-xs text-slate-400 font-mono">الدور: مدير النظام</span>
        </div>
        <Link
          to="/admin"
          className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
          </svg>
          التذاكر والطلبات
        </Link>
        <button
          onClick={handleLogout}
          className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition shadow"
        >
          تسجيل خروج
        </button>
      </div>
    </header>
  )
}

export default React.memo(DashboardHeader)
