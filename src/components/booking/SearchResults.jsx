import React from 'react'

export const SearchResults = ({
  searchFilteredSchedules,
  searchOrigin,
  searchDestination,
  verificationStatus,
  setBookingStep,
  setShowVerificationForm,
  handleSelectSchedule
}) => {
  const getTripDuration = (from, to) => {
    const isKsa = (city) => ['الرياض', 'جدة', 'الدمام', 'أبها', 'مكة', 'نجران'].includes(city)
    const isYem = (city) => ['البيضاء', 'صنعاء', 'عدن', 'تعز', 'الحديدة', 'ذمار', 'إب'].includes(city)
    if (isYem(from) && isKsa(to)) return '32 ساعة'
    if (isKsa(from) && isYem(to)) return '32 ساعة'
    if (isKsa(from) && isKsa(to)) return '12 ساعة'
    return '8 ساعات'
  }

  const getArrivalTime = (timeStr) => {
    if (!timeStr) return '05:30:00 PM';
    const match = timeStr.match(/^(\d+):(\d+):?(\d+)?\s*(AM|PM)?$/i);
    if (!match) return '05:30:00 PM';
    
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const seconds = match[3] || '00';
    let ampm = match[4] || '';
    
    if (hours === 12) {
      hours = 11;
      if (ampm.toUpperCase() === 'PM') ampm = 'AM';
      else if (ampm.toUpperCase() === 'AM') ampm = 'PM';
    } else if (hours === 1) {
      hours = 12;
    } else {
      hours = hours - 1;
    }
    
    const pad = (n) => String(n).padStart(2, '0');
    const formattedAmPm = ampm ? ' ' + ampm : '';
    return `${pad(hours)}:${minutes}:${seconds}${formattedAmPm}`;
  }

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
      {/* Header / Back Bar */}
      <div className="flex items-center gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 px-6 py-4 rounded-3xl shadow-sm">
        <button
          type="button"
          onClick={() => setBookingStep(1)}
          className="w-9 h-9 rounded-full border border-neutral-300 dark:border-neutral-700 flex items-center justify-center text-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition font-bold cursor-pointer"
        >
          ➔
        </button>
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">نتيجة البحث عن الرحلة</h2>
      </div>

      {/* Unverified Account banner */}
      {verificationStatus === 'unverified' && (
        <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600 text-lg font-black font-sans">!</span>
            <div>
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">غير موثق</h4>
              <p className="text-xs text-neutral-500">الحساب غير موثق، يرجى توثيق بياناتك قبل السفر.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowVerificationForm(true)}
            className="bg-[#c39c40] hover:bg-[#b08c35] text-white px-5 py-2 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            توثيق البيانات
          </button>
        </div>
      )}

      {verificationStatus === 'pending' && (
        <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600 text-lg font-black font-sans">⏱</span>
            <div>
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">قيد المراجعة</h4>
              <p className="text-xs text-neutral-500">طلب التوثيق قيد المراجعة حالياً من قبل الإدارة.</p>
            </div>
          </div>
        </div>
      )}

      {verificationStatus === 'rejected' && (
        <div className="bg-red-50/50 dark:bg-red-950/10 border border-red-200 dark:border-red-900/50 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center text-red-600 text-lg font-black font-sans">✕</span>
            <div>
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">تم رفض التوثيق</h4>
              <p className="text-xs text-neutral-500">تم رفض طلب التوثيق السابق من الإدارة. يرجى إعادة تقديم الطلب بالبيانات الصحيحة.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowVerificationForm(true)}
            className="bg-[#c39c40] hover:bg-[#b08c35] text-white px-5 py-2 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            توثيق البيانات
          </button>
        </div>
      )}

      {/* Results Grid List */}
      {searchFilteredSchedules.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-12 text-center text-neutral-500">
          لا توجد رحلات متوفرة تطابق خيارات البحث الخاصة بك في هذا التاريخ.
        </div>
      ) : (
        <div className="space-y-4">
          {searchFilteredSchedules.map((s) => {
            const availableSeats = s.totalSeats - (s.bookedCount || 0)
            const duration = getTripDuration(searchOrigin, searchDestination)
            
            return (
              <div key={s.id} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm space-y-4 hover:border-[#c39c40] transition">
                
                {/* Top row */}
                <div className="flex justify-between items-center border-b border-neutral-100 dark:border-neutral-850 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold bg-[#c39c40]/10 text-[#c39c40] border border-[#c39c40]/20 px-2 py-0.5 rounded uppercase">
                      {s.busType}
                    </span>
                    <span className="font-bold text-sm text-slate-700 dark:text-slate-300">
                      شركة {s.company}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-[#c39c40] bg-orange-50 dark:bg-orange-950/20 px-3 py-1 rounded-full border border-orange-200 dark:border-orange-900/30">
                    تفاصيل الرحلة
                  </span>
                </div>

                {/* Route Timeline Grid */}
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 py-2">
                  <div className="text-right">
                    <span className="block text-base font-extrabold text-slate-800 dark:text-slate-100">{searchOrigin}</span>
                    <span className="block text-xs text-neutral-400">{s.tripTime}</span>
                    <span className="block text-xs font-mono text-neutral-500">{s.travelDate}</span>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center min-w-[120px]">
                    <span className="text-[10px] text-neutral-400 font-bold mb-1">{duration}</span>
                    <div className="w-full h-0.5 bg-neutral-200 dark:bg-neutral-850 relative flex items-center justify-between">
                      <span className="w-2 h-2 rounded-full bg-[#c39c40]"></span>
                      <span className="w-2 h-2 rounded-full bg-slate-900 dark:bg-white"></span>
                    </div>
                    <span className="text-[10px] text-neutral-500 font-mono mt-1">رقم الرحلة: {s.id}</span>
                  </div>

                  <div className="text-left">
                    <span className="block text-base font-extrabold text-slate-800 dark:text-slate-100">{searchDestination}</span>
                    <span className="block text-xs text-neutral-400">{getArrivalTime(s.tripTime)}</span>
                    <span className="block text-xs font-mono text-neutral-500">{s.travelDate}</span>
                  </div>
                </div>

                {/* Seat details & Pricing */}
                <div className="grid grid-cols-2 gap-4 bg-neutral-50 dark:bg-neutral-950/40 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-850">
                  <div className="space-y-1">
                    <span className="block text-[11px] text-neutral-400">للبالغين</span>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{s.priceAdult || s.price} ريال يمني</span>
                  </div>
                  <div className="space-y-1">
                    <span className="block text-[11px] text-neutral-400">للأطفال</span>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{s.priceChild || s.price} ريال يمني</span>
                  </div>
                </div>

                {/* Footer controls inside card */}
                <div className="flex justify-between items-center pt-2">
                  <div className="flex items-center gap-4 text-xs text-neutral-500">
                    <span className="font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-0.5 rounded">
                      {availableSeats} المقاعد المتبقية
                    </span>
                    <span className="flex items-center gap-1">⚡ شحن USB</span>
                    <span className="flex items-center gap-1">📶 Wifi</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectSchedule(s)}
                      className="bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 hover:border-slate-400 text-slate-700 dark:text-slate-300 px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      تفاصيل الرحلة
                    </button>
                    {verificationStatus === 'verified' ? (
                      <button
                        type="button"
                        onClick={() => handleSelectSchedule(s)}
                        className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 text-xs font-bold rounded-xl transition cursor-pointer"
                      >
                        حجز
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowVerificationForm(true)}
                        className="bg-[#c39c40] hover:bg-[#b08c35] text-white px-5 py-2 text-xs font-bold rounded-xl transition cursor-pointer"
                      >
                        توثيق
                      </button>
                    )}
                  </div>
                </div>

              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default SearchResults
