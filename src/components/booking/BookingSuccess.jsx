import React from 'react'
import { openPrintWindow } from '../../utils/printTicket'

export const BookingSuccess = ({
  lastTicket,
  setLastTicket,
  setSuccessMessage,
  setBookingStep
}) => {
  if (!lastTicket) return null

  return (
    <div className="bg-white dark:bg-neutral-900 border border-green-200 dark:border-green-950 p-8 rounded-3xl space-y-5 shadow-lg text-center max-w-xl mx-auto">
      <div className="w-16 h-16 bg-green-100 dark:bg-green-950 text-green-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold font-sans">✓</div>
      <h3 className="text-2xl font-black text-green-600 font-sans">تم حجز تذكرتكم بنجاح!</h3>
      <div className="space-y-2">
        <p className="text-sm text-neutral-600 dark:text-neutral-400 font-sans">أرقام التذاكر الخاصة بكم هي:</p>
        <div className="flex flex-wrap justify-center gap-2">
          {(Array.isArray(lastTicket) ? lastTicket : [lastTicket]).map((t, idx) => (
            <span key={idx} className="font-mono font-black text-sm text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded border border-neutral-200 dark:border-neutral-750">
              {t.ticketNumber} ({t.passengerName} - مقعد {t.seat})
            </span>
          ))}
        </div>
      </div>
      <p className="text-xs text-neutral-500 leading-5 font-sans">تم تفعيل التذاكر وربطها ببيانات السفر المحددة. يمكنك طباعة الفواتير أو التذاكر الآن.</p>
      
      <div className="flex gap-3 justify-center pt-4">
        <button
          type="button"
          onClick={() => openPrintWindow(lastTicket)}
          className="inline-flex items-center gap-2 rounded-full bg-green-600 hover:bg-green-700 px-8 py-3 text-sm font-bold text-white shadow-lg transition cursor-pointer font-sans"
        >
          طباعة التذاكر
        </button>
        <button
          type="button"
          onClick={() => {
            setLastTicket(null)
            setSuccessMessage('')
            setBookingStep(1)
          }}
          className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-8 py-3 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800 transition cursor-pointer font-sans"
        >
          الرجوع للرئيسية
        </button>
      </div>
    </div>
  )
}

export default BookingSuccess
