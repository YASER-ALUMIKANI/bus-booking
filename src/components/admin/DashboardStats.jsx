import React from 'react'

const DashboardStats = ({
  username,
  dbSize,
  totalBookings,
  bookingsToday,
  travelToday,
  pendingCount,
  confirmedCount,
  cancelledCount
}) => {
  return (
    <div className="w-full xl:w-80 space-y-6 shrink-0">
      {/* General Information Box */}
      <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="bg-slate-50 dark:bg-neutral-800/50 px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">معلومات عامة (General Info)</h3>
        </div>
        <div className="p-4 divide-y divide-slate-100 dark:divide-neutral-850 text-xs leading-6">
          <div className="py-2 flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">المستخدم الحالي</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{username}</span>
          </div>
          <div className="py-2 flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">النطاق الأساسي</span>
            <span className="font-mono text-slate-600 dark:text-slate-400">yemenbus.com</span>
          </div>
          <div className="py-2 flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">المجلد الرئيسي</span>
            <span className="font-mono text-slate-600 dark:text-slate-400">/home/yemenbus</span>
          </div>
          <div className="py-2 flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">خادم الويب</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">Waitress (WSGI)</span>
          </div>
          <div className="py-2 flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">بيئة تشغيل البيانات</span>
            <span className="text-emerald-600 font-bold dark:text-emerald-400">SQLite WAL Mode</span>
          </div>
        </div>
      </div>

      {/* Statistics Box */}
      <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="bg-slate-50 dark:bg-neutral-800/50 px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">الإحصائيات (Statistics)</h3>
        </div>
        <div className="p-4 divide-y divide-slate-100 dark:divide-neutral-850 text-xs leading-6">
          <div className="py-2 flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400">حجم قاعدة البيانات</span>
            <span className="font-mono font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20 px-2 py-0.5 rounded">
              {(dbSize / 1024).toFixed(2)} KB
            </span>
          </div>
          <div className="py-2 flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400">إجمالي الحجوزات</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{totalBookings}</span>
          </div>
          <div className="py-2 flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400">حجوزات اليوم</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{bookingsToday}</span>
          </div>
          <div className="py-2 flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400">رحلات اليوم</span>
            <span className="font-bold text-blue-600 dark:text-blue-400">{travelToday}</span>
          </div>
          <div className="py-2 flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400">حالات معلقة</span>
            <span className="font-bold text-yellow-600 dark:text-yellow-400">{pendingCount}</span>
          </div>
          <div className="py-2 flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400">حالات مؤكدة</span>
            <span className="font-bold text-green-600 dark:text-green-400">{confirmedCount}</span>
          </div>
          <div className="py-2 flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400">حالات ملغاة</span>
            <span className="font-bold text-red-600 dark:text-red-400">{cancelledCount}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default React.memo(DashboardStats)
