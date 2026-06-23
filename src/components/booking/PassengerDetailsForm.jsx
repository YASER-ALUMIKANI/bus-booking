import React from 'react'
import SeatMap from './SeatMap'

export const PassengerDetailsForm = ({
  selectedSchedule,
  bookedSeats,
  selectedSeats,
  handleSeatClick,
  passengersDetails,
  setPassengersDetails,
  searchAdults,
  totalPassengers,
  phone,
  setPhone,
  paymentRef,
  setPaymentRef,
  paymentPreview,
  handlePaymentImageChange,
  status,
  handleSubmit
}) => {
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* Seating Map */}
      <SeatMap
        selectedSchedule={selectedSchedule}
        bookedSeats={bookedSeats}
        selectedSeats={selectedSeats}
        handleSeatClick={handleSeatClick}
      />

      {selectedSeats.length > 0 && (
        <p className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-bold text-violet-700 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-300 text-center font-sans">
          المقاعد المحددة حالياً ({selectedSeats.length} من {totalPassengers}): {selectedSeats.join(', ')}
        </p>
      )}

      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 border-b border-neutral-100 dark:border-neutral-850 pb-2 font-sans">معلومات المسافرين</h3>

      <div className="space-y-6">
        {passengersDetails.map((passenger, index) => {
          const seatNum = selectedSeats[index]
          const passengerType = index < searchAdults ? 'adult' : 'child'
          const price = passengerType === 'child'
            ? (selectedSchedule?.priceChild || selectedSchedule?.price || 35000)
            : (selectedSchedule?.priceAdult || selectedSchedule?.price || 35000)

          return (
            <div key={index} className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 bg-neutral-50 dark:bg-neutral-950/20 space-y-4">
              <div className="flex justify-between items-center border-b border-neutral-200 dark:border-neutral-800 pb-2">
                <h4 className="text-sm font-bold text-violet-600 dark:text-violet-400 font-sans">
                  المسافر {index + 1} ({passengerType === 'child' ? 'طفل' : 'بالغ'}) - {seatNum ? `المقعد: ${seatNum}` : 'يرجى اختيار المقعد من الخريطة'}
                </h4>
                <span className="text-xs font-bold text-green-600 dark:text-green-400 font-sans">
                  السعر: {price} YER
                </span>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5 font-sans">اسم المسافر (ثلاثي أو رباعي) <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={passenger.name}
                  onChange={(e) => {
                    const val = e.target.value
                    setPassengersDetails(prev => prev.map((p, idx) => idx === index ? { ...p, name: val } : p))
                  }}
                  required
                  maxLength={100}
                  pattern="[\u0600-\u06FF\u0621-\u064A\u0660-\u0669A-Za-z ]+"
                  title="الاسم يجب أن يحتوي على حروف ومسافات فقط ويكون بين 3 و100 حرف."
                  placeholder={`اكتب اسم المسافر ${index + 1}`}
                  className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 py-2.5 text-neutral-900 dark:text-neutral-100 outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-100 font-semibold text-sm"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5 font-sans">رقم الجواز <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={passenger.passport}
                    onChange={(e) => {
                      const val = e.target.value
                      setPassengersDetails(prev => prev.map((p, idx) => idx === index ? { ...p, passport: val } : p))
                    }}
                    required
                    minLength={5}
                    maxLength={20}
                    pattern="^[A-Za-z0-9-]{5,20}$"
                    title="رقم الجواز يجب أن يحتوي على أحرف أو أرقام أو شرطات فقط، وطوله بين 5 و20 حرفاً."
                    placeholder="اكتب رقم الجواز"
                    className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 py-2.5 text-neutral-900 dark:text-neutral-100 outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-100 font-semibold text-sm font-sans"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5 font-sans">العمر / سنة الميلاد <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={passenger.dob}
                    onChange={(e) => {
                      const val = e.target.value
                      setPassengersDetails(prev => prev.map((p, idx) => idx === index ? { ...p, dob: val } : p))
                    }}
                    required
                    placeholder="مثال: 1995"
                    className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 py-2.5 text-neutral-900 dark:text-neutral-100 outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-100 font-semibold text-sm font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5 font-sans">صورة جواز السفر <span className="text-red-500">*</span></label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <label htmlFor={`passportImage-${index}`} className="inline-flex items-center justify-center rounded-xl bg-violet-600 px-4 py-2.5 text-white font-semibold text-xs shadow-sm hover:bg-violet-700 transition cursor-pointer">
                    اختر صورة جواز السفر
                  </label>
                  <input
                    id={`passportImage-${index}`}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setPassengersDetails(prev => prev.map((p, idx) => idx === index ? {
                          ...p,
                          passportImage: file,
                          passportPreview: URL.createObjectURL(file)
                        } : p))
                      }
                    }}
                    className="sr-only"
                  />
                  <span className="text-xs text-neutral-500 font-sans">JPG أو PNG أو WEBP أقل من 5 ميجابايت.</span>
                </div>
                {passenger.passportPreview && (
                  <img
                    src={passenger.passportPreview}
                    alt={`معاينة جواز السفر للمسافر ${index + 1}`}
                    className="mt-3 h-28 w-full max-w-xs rounded-xl object-cover border border-neutral-200 dark:border-neutral-800"
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>

      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 border-b border-neutral-100 dark:border-neutral-850 pb-2 font-sans">بيانات الاتصال والدفع</h3>

      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 font-sans font-semibold">رقم الجوال</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          minLength={7}
          maxLength={15}
          pattern="^[0-9]{7,15}$"
          title="اكتب رقم جوال صالح مكون من 7 إلى 15 رقماً."
          placeholder="مثال: 0912345678"
          className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 px-4 py-3 text-neutral-900 dark:text-neutral-100 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900 font-semibold"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 font-sans font-semibold">رقم الحوالة المالية / إشعار الدفع (اختياري)</label>
        <input
          type="text"
          value={paymentRef}
          onChange={(e) => setPaymentRef(e.target.value)}
          placeholder="أدخل رقم الحوالة أو المرجع المالي"
          className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 px-4 py-3 text-neutral-900 dark:text-neutral-100 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900 font-semibold"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 font-sans font-semibold">صورة إشعار الدفع / الحوالة (اختياري)</label>
        <div className="space-y-3">
          <label htmlFor="paymentImage" className="inline-flex items-center justify-center rounded-full bg-violet-600 px-4 py-3 text-white font-semibold shadow-sm hover:bg-violet-700 transition cursor-pointer">
            اختر صورة إشعار الدفع
          </label>
          <input
            id="paymentImage"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePaymentImageChange}
            className="sr-only"
          />
          <p className="text-sm text-neutral-500 dark:text-neutral-400 font-sans">ارفع صورة إيصال الدفع أو التحويل المالي لتأكيد الحجز.</p>
          {paymentPreview && (
            <img
              src={paymentPreview}
              alt="معاينة إشعار الدفع"
              className="mt-3 h-40 w-full max-w-xs rounded-2xl object-cover border border-neutral-200 dark:border-neutral-800"
            />
          )}
        </div>
      </div>

      <div className="flex gap-4 items-center flex-wrap pt-3 border-t border-neutral-100 dark:border-neutral-850">
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-full bg-violet-600 px-8 py-3 text-white font-semibold shadow-lg shadow-violet-200/30 hover:bg-violet-700 transition cursor-pointer"
          disabled={status === 'sending'}
        >
          {status === 'sending' ? 'جاري الإرسال...' : 'تأكيد وإرسال الحجز'}
        </button>
      </div>
    </form>
  )
}

export default PassengerDetailsForm
