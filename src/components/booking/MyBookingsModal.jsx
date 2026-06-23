import React from 'react'
import { openPrintWindow } from '../../utils/printTicket'

export const MyBookingsModal = ({
  showMyBookings,
  setShowMyBookings,
  myBookings,
  loadingBookings,
  bookingsError
}) => {
  if (!showMyBookings) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 font-sans">حجوزاتي السابقة</h3>
          <button
            type="button"
            onClick={() => setShowMyBookings(false)}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {loadingBookings ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="mt-4 text-sm text-neutral-500 font-sans">جاري تحميل الحجوزات...</span>
            </div>
          ) : bookingsError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-red-600 text-sm font-sans">
              {bookingsError}
            </div>
          ) : myBookings.length === 0 ? (
            <div className="text-center py-12 text-neutral-500 dark:text-neutral-400 font-sans">
              <svg className="w-12 h-12 mx-auto text-neutral-300 dark:text-neutral-750 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
              </svg>
              لا توجد حجوزات سابقة مسجلة على هذا الرقم.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {myBookings.map((b) => {
                const isConfirmed = b.status === 'confirmed'
                const isPending = b.status === 'pending'
                
                let statusBadge = ''
                if (isConfirmed) {
                  statusBadge = 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-300 border border-green-200 dark:border-green-900/50'
                } else if (isPending) {
                  statusBadge = 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50'
                } else {
                  statusBadge = 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-300 border border-red-200 dark:border-red-900/50'
                }

                const ticketData = {
                  ticketNumber: b.id.startsWith('T-') ? b.id : `T-${b.id}`,
                  passengerName: b.passenger_name,
                  phone: b.phone,
                  passport: b.passport,
                  travelDate: b.travel_date,
                  company: b.company,
                  origin: b.origin,
                  destination: b.destination,
                  seat: b.seat,
                  dob: b.dob,
                  tripTime: b.trip_time,
                  arrivalTime: b.arrival_time,
                  dayOfWeek: b.day_of_week || 'الاثنين',
                  issuingOffice: b.issuing_office,
                  price: b.price,
                  notes: b.notes,
                  busType: b.bus_type
                }

                return (
                  <div key={b.id} className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 bg-neutral-50 dark:bg-neutral-950 flex flex-col justify-between hover:border-violet-500/50 transition">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-mono font-bold text-neutral-500 dark:text-neutral-400">
                          {ticketData.ticketNumber}
                        </span>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold font-sans ${statusBadge}`}>
                          {isConfirmed ? 'مؤكد' : isPending ? 'معلق' : 'ملغي'}
                        </span>
                      </div>
                      
                      <div className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 font-sans">
                        {b.origin} ← {b.destination}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-neutral-600 dark:text-neutral-400 font-sans">
                        <div>التاريخ: <span className="font-medium">{b.travel_date}</span></div>
                        <div>الشركة: <span className="font-medium">{b.company}</span></div>
                        <div>المقعد: <span className="font-semibold text-violet-600 dark:text-violet-400">{b.seat}</span></div>
                        <div>الباص: <span className="font-medium">{b.bus_type}</span></div>
                        <div className="col-span-2">الاسم: <span className="font-medium">{b.passenger_name}</span></div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
                      <span className="text-sm font-bold text-green-600 dark:text-green-400 font-sans">
                        {b.price} YER
                      </span>
                      
                      <button
                        type="button"
                        onClick={() => openPrintWindow(ticketData)}
                        className="inline-flex items-center gap-1 rounded-xl bg-violet-600 px-3.5 py-1.5 text-xs text-white font-semibold hover:bg-violet-700 transition cursor-pointer font-sans"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        طباعة
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 flex justify-end">
          <button
            type="button"
            onClick={() => setShowMyBookings(false)}
            className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-5 py-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition cursor-pointer font-sans"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  )
}

export default MyBookingsModal
