import React, { useMemo } from 'react'
import { STATUS_COLORS, STATUS_LABELS, DB_PAGE_SIZE } from '../../../constants/admin'
import { handleExcelDownload, handlePrintManifest } from '../../../utils/bookingHelpers'

const BookingTable = ({
  bookings,
  filteredBookings,
  dbSearch,
  setDbSearch,
  dbStatusFilter,
  setDbStatusFilter,
  dbDateFilter,
  setDbDateFilter,
  dbPage,
  setDbPage
}) => {
  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / DB_PAGE_SIZE))
  const safePage = Math.min(dbPage, totalPages)
  const pageData = useMemo(() => {
    return filteredBookings.slice((safePage - 1) * DB_PAGE_SIZE, safePage * DB_PAGE_SIZE)
  }, [filteredBookings, safePage])

  const statusBadge = (status) => {
    const cls = STATUS_COLORS[status] || 'bg-slate-100 text-slate-600 border border-slate-300'
    const label = STATUS_LABELS[status] || status || '-'
    return (
      <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${cls}`}>
        {label}
      </span>
    )
  }

  const uniqueTravelDates = useMemo(() => {
    return [...new Set(bookings.map((b) => b.travel_date).filter(Boolean))].sort()
  }, [bookings])

  return (
    <div className="rounded-3xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-slate-50 dark:bg-neutral-800/40 border-b border-slate-200 dark:border-slate-800 px-6 py-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">مستعرض قاعدة البيانات التفاعلي</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{filteredBookings.length} سجل من أصل {bookings.length}</p>
        </div>
        <div className="flex gap-2.5 flex-wrap">
          <button
            onClick={() => handlePrintManifest(filteredBookings)}
            className="inline-flex items-center gap-2 rounded-full bg-violet-600 hover:bg-violet-700 transition px-5 py-2.5 text-sm font-semibold text-white shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            طباعة البيان (كشف الركاب)
          </button>
          <button
            onClick={() => handleExcelDownload(filteredBookings)}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-700 transition px-5 py-2.5 text-sm font-semibold text-white shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            تنزيل Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-neutral-900/20">
        <div className="relative flex-1">
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            value={dbSearch}
            onChange={(e) => { setDbSearch(e.target.value); setDbPage(1) }}
            placeholder="بحث بالاسم، الهاتف، الجواز، الوجهة..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-neutral-950 pr-9 pl-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-950"
          />
        </div>
        <select
          value={dbStatusFilter}
          onChange={(e) => { setDbStatusFilter(e.target.value); setDbPage(1) }}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-neutral-950 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-950"
        >
          <option value="all">كل الحالات</option>
          <option value="pending">معلق</option>
          <option value="confirmed">مؤكد</option>
          <option value="cancelled">ملغي</option>
        </select>
        <select
          value={dbDateFilter}
          onChange={(e) => { setDbDateFilter(e.target.value); setDbPage(1) }}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-neutral-950 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-950"
        >
          <option value="all">كل التواريخ</option>
          {uniqueTravelDates.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100 dark:divide-neutral-800 text-sm" dir="rtl">
          <thead className="bg-slate-100 dark:bg-neutral-800/60">
            <tr>
              {['معرّف','المسافر','الهاتف','الجواز','من','إلى','التاريخ','الحالة','رقم الحوالة','الحالة المطلوبة','سبب الإلغاء','سبب طلب الإلغاء','مقفول','طلب تغيير','موافقة','ضيف','الطابع الزمني'].map((h) => (
                <th key={h} className="px-4 py-3 text-right text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={17} className="px-4 py-10 text-center text-slate-400 text-sm">لا توجد نتائج مطابقة</td>
              </tr>
            ) : pageData.map((booking, idx) => (
              <tr key={booking.id} className={idx % 2 === 0 ? 'bg-white dark:bg-neutral-900' : 'bg-slate-50/60 dark:bg-neutral-950/20'} style={{transition:'background 0.15s'}}>
                <td className="px-4 py-3 text-right text-slate-500 font-mono text-xs max-w-[120px] truncate" title={booking.id}>{booking.id}</td>
                <td className="px-4 py-3 text-right text-slate-800 dark:text-slate-200 font-medium whitespace-nowrap">{booking.passenger_name}</td>
                <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400 whitespace-nowrap">{booking.phone}</td>
                <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">{booking.passport}</td>
                <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400 whitespace-nowrap">{booking.origin}</td>
                <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400 whitespace-nowrap">{booking.destination}</td>
                <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400 whitespace-nowrap">{booking.travel_date}</td>
                <td className="px-4 py-3 text-right">{statusBadge(booking.status)}</td>
                <td className="px-4 py-3 text-right text-green-600 font-semibold">{booking.payment_ref || '-'}</td>
                <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400">{booking.requested_status || '-'}</td>
                <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400 max-w-[150px] truncate" title={booking.cancellation_reason}>{booking.cancellation_reason || '-'}</td>
                <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400 max-w-[150px] truncate" title={booking.requested_cancellation_reason}>{booking.requested_cancellation_reason || '-'}</td>
                <td className="px-4 py-3 text-right">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${booking.locked ? 'bg-red-100 text-red-600 dark:bg-red-950/20 dark:text-red-400' : 'bg-slate-100 text-slate-500'}`}>{booking.locked ? 'نعم' : 'لا'}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${booking.change_requested ? 'bg-orange-100 text-orange-600 dark:bg-orange-950/20 dark:text-orange-400' : 'bg-slate-100 text-slate-500'}`}>{booking.change_requested ? 'نعم' : 'لا'}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${booking.approval_granted ? 'bg-green-100 text-green-600 dark:bg-green-950/20 dark:text-green-400' : 'bg-slate-100 text-slate-500'}`}>{booking.approval_granted ? 'نعم' : 'لا'}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${booking.guest ? 'bg-blue-100 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400' : 'bg-slate-100 text-slate-500'}`}>{booking.guest ? 'نعم' : 'لا'}</span>
                </td>
                <td className="px-4 py-3 text-right text-slate-500 text-xs whitespace-nowrap">{booking.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-neutral-800/40">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            صفحة {safePage} من {totalPages} — عرض {(safePage-1)*DB_PAGE_SIZE+1}–{Math.min(safePage*DB_PAGE_SIZE, filteredBookings.length)} من {filteredBookings.length}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setDbPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-neutral-900 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >السابق</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(safePage - 2, totalPages - 4))
              const pg = start + i
              if (pg > totalPages) return null
              return (
                <button
                  key={pg}
                  onClick={() => setDbPage(pg)}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${
                    pg === safePage
                      ? 'border-orange-600 bg-orange-600 text-white'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-neutral-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-neutral-800'
                  }`}
                >{pg}</button>
              )
            })}
            <button
              onClick={() => setDbPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-neutral-900 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >التالي</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default React.memo(BookingTable)
