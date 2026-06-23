import React from 'react'

// Constants
import { STEPS } from '../constants/bookingSteps'

// Custom Hooks
import { useBooking } from '../hooks/useBooking'

// Subcomponents
import PromoSlider from '../components/booking/PromoSlider'
import SearchForm from '../components/booking/SearchForm'
import SearchResults from '../components/booking/SearchResults'
import PassengerDetailsForm from '../components/booking/PassengerDetailsForm'
import VerificationModal from '../components/booking/VerificationModal'
import MyBookingsModal from '../components/booking/MyBookingsModal'
import BookingSuccess from '../components/booking/BookingSuccess'

const Bus = () => {
  const booking = useBooking()

  return (
    <main className="pt-[8ch] min-h-[calc(100vh-8ch)] bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 md:px-16 lg:px-28 py-12">
        
        {/* Header Bar */}
        <div className="flex justify-between items-center mb-8 flex-row gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-4">
          <div className="relative" ref={booking.dropdownRef}>
            <button
              type="button"
              onClick={() => {
                if (sessionStorage.getItem('clientPhone')) {
                  booking.setShowUserDropdown(!booking.showUserDropdown)
                }
              }}
              className="flex items-center gap-3 focus:outline-none hover:opacity-80 transition cursor-pointer select-none text-right"
              aria-expanded={booking.showUserDropdown}
            >
              <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-950 flex items-center justify-center font-bold text-orange-600 text-sm shadow-sm ring-2 ring-orange-500/20">
                👤
              </div>
              <div>
                <p className="text-xs text-neutral-400 font-sans">مرحباً بك،</p>
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 font-sans">
                  {sessionStorage.getItem('clientName') || (sessionStorage.getItem('clientPhone') ? `عميل (${sessionStorage.getItem('clientPhone')})` : 'زائر')}
                  {sessionStorage.getItem('clientPhone') && (
                    <svg className={`w-3 h-3 text-neutral-400 transition-transform duration-200 ${booking.showUserDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </h2>
              </div>
            </button>

            {/* User Dropdown Menu */}
            {booking.showUserDropdown && sessionStorage.getItem('clientPhone') && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl z-50 py-2 animate-fadeIn origin-top-right divide-y divide-neutral-100 dark:divide-neutral-800">
                <div className="px-4 py-3 text-xs text-neutral-500 dark:text-neutral-400 space-y-1 font-sans">
                  <div className="font-bold text-neutral-800 dark:text-neutral-200">معلومات الحساب</div>
                  <div>الجوال: <span className="font-mono text-neutral-700 dark:text-neutral-300">{sessionStorage.getItem('clientPhone')}</span></div>
                  <div>حالة التوثيق: <span className={`font-semibold ${booking.verificationStatus === 'verified' ? 'text-green-600 dark:text-green-400' : booking.verificationStatus === 'pending' ? 'text-amber-500' : 'text-red-500'}`}>
                    {booking.verificationStatus === 'verified' ? 'موثق' : booking.verificationStatus === 'pending' ? 'قيد المراجعة' : 'غير موثق'}
                  </span></div>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      booking.setShowUserDropdown(false)
                      booking.setShowMyBookings(true)
                      booking.handleFetchMyBookings()
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-right text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition cursor-pointer font-sans"
                  >
                    <svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    حجوزاتي
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      booking.setShowUserDropdown(false)
                      booking.handleClientLogout()
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-right text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition cursor-pointer font-sans"
                  >
                    <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    تسجيل الخروج
                  </button>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      booking.setShowUserDropdown(false)
                      booking.setShowDeleteConfirmModal(true)
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-right text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition cursor-pointer font-sans"
                  >
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    حذف الحساب نهائياً
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            {sessionStorage.getItem('clientPhone') && (
              <button
                type="button"
                onClick={() => {
                  booking.setShowMyBookings(true)
                  booking.handleFetchMyBookings()
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-violet-600 hover:bg-violet-700 px-5 py-2.5 text-xs font-semibold text-white shadow transition cursor-pointer font-sans"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                حجوزاتي
              </button>
            )}
          </div>
        </div>

        {booking.error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-950 dark:bg-red-950/20 dark:text-red-400 font-sans">
            {booking.error}
          </div>
        )}

        {booking.showVerificationForm ? (
          <VerificationModal
            verifyFullname={booking.verifyFullname}
            setVerifyFullname={booking.setVerifyFullname}
            verifyIdType={booking.verifyIdType}
            setVerifyIdType={booking.setVerifyIdType}
            verifyIdNumber={booking.verifyIdNumber}
            setVerifyIdNumber={booking.setVerifyIdNumber}
            verifyIssueDate={booking.verifyIssueDate}
            setVerifyIssueDate={booking.setVerifyIssueDate}
            verifyIssuePlace={booking.verifyIssuePlace}
            setVerifyIssuePlace={booking.setVerifyIssuePlace}
            verifyImagePreview={booking.verifyImagePreview}
            setVerifyImagePreview={booking.setVerifyImagePreview}
            setVerifyImage={booking.setVerifyImage}
            verifyError={booking.verifyError}
            verifySuccess={booking.verifySuccess}
            verifyLoading={booking.verifyLoading}
            handleVerifySubmit={booking.handleVerifySubmit}
            onClose={() => {
              booking.setVerifyError('')
              booking.setVerifySuccess('')
              booking.setShowVerificationForm(false)
            }}
          />
        ) : (
          <>
            {/* STEP 1: SEARCH & SLIDER */}
            {booking.bookingStep === STEPS.SEARCH && (
              <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
                <PromoSlider />
                <SearchForm
                  searchOrigin={booking.searchOrigin}
                  setSearchOrigin={booking.setSearchOrigin}
                  searchDestination={booking.searchDestination}
                  setSearchDestination={booking.setSearchDestination}
                  searchAdults={booking.searchAdults}
                  setSearchAdults={booking.setSearchAdults}
                  searchChildren={booking.searchChildren}
                  setSearchChildren={booking.setSearchChildren}
                  searchDate={booking.searchDate}
                  setSearchDate={booking.setSearchDate}
                  availableDates={booking.availableDates}
                  searching={booking.searching}
                  handleSearch={booking.handleSearchSubmit}
                />
              </div>
            )}

            {/* STEP 2: SEARCH RESULTS */}
            {booking.bookingStep === STEPS.RESULTS && (
              <SearchResults
                searchFilteredSchedules={booking.searchFilteredSchedules}
                searchOrigin={booking.searchOrigin}
                searchDestination={booking.searchDestination}
                verificationStatus={booking.verificationStatus}
                setBookingStep={booking.setBookingStep}
                setShowVerificationForm={booking.setShowVerificationForm}
                handleSelectSchedule={booking.handleSelectSchedule}
              />
            )}

            {/* STEP 3: DETAILS, SEATMAP & PASSPORT FORM */}
            {booking.bookingStep === STEPS.DETAILS && (
              <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
                {/* Header / Back Bar */}
                <div className="flex items-center gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 px-6 py-4 rounded-3xl shadow-sm">
                  <button
                    type="button"
                    onClick={() => {
                      booking.setLastTicket(null)
                      booking.setSuccessMessage('')
                      booking.setSelectedSeats([])
                      booking.setBookingStep(STEPS.RESULTS)
                    }}
                    className="w-9 h-9 rounded-full border border-neutral-300 dark:border-neutral-700 flex items-center justify-center text-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition font-bold cursor-pointer"
                  >
                    ➔
                  </button>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 font-sans">تفاصيل الرحلة وحجز المقعد</h2>
                </div>

                {booking.lastTicket ? (
                  <BookingSuccess
                    lastTicket={booking.lastTicket}
                    setLastTicket={booking.setLastTicket}
                    setSuccessMessage={booking.setSuccessMessage}
                    setBookingStep={booking.setBookingStep}
                  />
                ) : (
                  <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
                    <section className="space-y-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 shadow-sm">
                      <div className="relative rounded-2xl overflow-hidden h-40 bg-slate-900 border border-neutral-100 dark:border-neutral-800">
                        <img src="/service-slide-2.jpg" alt="مقاعد مريحة" className="w-full h-full object-cover object-center opacity-85" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                        <div className="absolute bottom-4 right-4 text-white space-y-1">
                          <h4 className="text-base font-bold font-sans">باص شركة {booking.company}</h4>
                          <p className="text-xs text-neutral-300 font-sans">أحدث الحافلات المجهزة لسفر مريح</p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-xs text-neutral-500 border-b border-neutral-100 dark:border-neutral-850 pb-2">
                        <span className="flex items-center gap-1 font-semibold text-violet-600 bg-violet-50 dark:bg-violet-950/20 px-2.5 py-0.5 rounded font-sans">
                          🚌 نوع الحافلة: {booking.selectedSchedule?.busType}
                        </span>
                        <div className="flex gap-4 font-sans">
                          <span>⚡ شحن USB</span>
                          <span>📶 واي فاي Wifi</span>
                        </div>
                      </div>

                      <PassengerDetailsForm
                        selectedSchedule={booking.selectedSchedule}
                        bookedSeats={booking.bookedSeats}
                        selectedSeats={booking.selectedSeats}
                        handleSeatClick={booking.handleSeatClick}
                        passengersDetails={booking.passengersDetails}
                        setPassengersDetails={booking.setPassengersDetails}
                        searchAdults={booking.searchAdults}
                        totalPassengers={booking.totalPassengers}
                        phone={booking.phone}
                        setPhone={booking.setPhone}
                        paymentRef={booking.paymentRef}
                        setPaymentRef={booking.setPaymentRef}
                        paymentPreview={booking.paymentPreview}
                        handlePaymentImageChange={booking.handlePaymentImageChange}
                        status={booking.status}
                        handleSubmit={booking.handleBookingSubmit}
                      />
                    </section>

                    {/* Sidebar Overview */}
                    <aside className="space-y-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm">
                      <div className="rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-850 p-5 space-y-3">
                        <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-200 border-b border-neutral-200 dark:border-neutral-800 pb-2 font-sans">المقاعد والأسعار</h3>
                        <div className="flex justify-between text-xs">
                          <span className="text-neutral-500 font-sans">المقاعد المتوفرة:</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300 font-sans">
                            {booking.selectedSchedule.totalSeats - (booking.selectedSchedule.bookedCount || 0)} مقعد
                          </span>
                        </div>
                        <div className="flex justify-between text-xs pt-2 border-t border-neutral-200 dark:border-neutral-800">
                          <span className="text-neutral-500 font-sans">المقاعد المحددة:</span>
                          <span className="font-bold text-violet-600 dark:text-violet-400 font-sans">
                            {booking.selectedSeats.length > 0 ? booking.selectedSeats.join(', ') : 'لا يوجد'}
                          </span>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-850 p-5 space-y-4">
                        <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-200 border-b border-neutral-200 dark:border-neutral-800 pb-2 font-sans">تفاصيل الأسعار</h3>
                        
                        {booking.searchAdults > 0 && (
                          <div className="flex justify-between items-center text-xs">
                            <div>
                              <span className="block font-bold font-sans">الكبار ({booking.searchAdults} × Adults)</span>
                              <span className="text-neutral-400 font-sans">سياحي ({booking.selectedSchedule.busType})</span>
                            </div>
                            <span className="font-extrabold text-green-600 dark:text-green-400 font-sans font-bold">
                              {booking.searchAdults * (booking.selectedSchedule.priceAdult || booking.selectedSchedule.price || 35000)} YER
                            </span>
                          </div>
                        )}

                        {booking.searchChildren > 0 && (
                          <div className="flex justify-between items-center text-xs border-t border-neutral-200 dark:border-neutral-800 pt-3">
                            <div>
                              <span className="block font-bold font-sans">الصغار ({booking.searchChildren} × Children)</span>
                              <span className="text-neutral-400 font-sans">سياحي ({booking.selectedSchedule.busType})</span>
                            </div>
                            <span className="font-extrabold text-green-600 dark:text-green-400 font-sans font-bold">
                              {booking.searchChildren * (booking.selectedSchedule.priceChild || booking.selectedSchedule.price || 35000)} YER
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between items-center text-sm border-t border-neutral-200 dark:border-neutral-800 pt-3 font-bold">
                          <span className="text-slate-800 dark:text-slate-200 font-sans">إجمالي السعر ({booking.totalPassengers} مسافرين)</span>
                          <span className="text-lg text-emerald-600 dark:text-emerald-400 font-sans font-bold">
                            {(booking.searchAdults * (booking.selectedSchedule.priceAdult || booking.selectedSchedule.price || 35000) + booking.searchChildren * (booking.selectedSchedule.priceChild || booking.selectedSchedule.price || 35000))} YER
                          </span>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-850 p-5 space-y-3">
                        <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-200 border-b border-neutral-200 dark:border-neutral-800 pb-2 font-sans">معلومات الرحلة</h3>
                        <div className="text-xs space-y-2 font-sans">
                          <div className="flex justify-between">
                            <span className="text-neutral-500">مسار السفر:</span>
                            <span className="font-bold">{booking.origin} ← {booking.destination}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-500">الشركة الناقلة:</span>
                            <span className="font-bold">{booking.company}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-500">تاريخ السفر:</span>
                            <span className="font-bold">{booking.travelDate}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-500">توقيت الانطلاق:</span>
                            <span className="font-bold">{booking.tripTime}</span>
                          </div>
                        </div>
                      </div>
                    </aside>
                  </div>
                )}
              </div>
            )}
          </>
        )}

      </div>

      {/* MY BOOKINGS HISTORY LIST MODAL */}
      <MyBookingsModal
        showMyBookings={booking.showMyBookings}
        setShowMyBookings={booking.setShowMyBookings}
        myBookings={booking.myBookings}
        loadingBookings={booking.loadingBookings}
        bookingsError={booking.bookingsError}
      />

      {/* Delete Account Confirmation Modal */}
      {booking.showDeleteConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-6 text-right" dir="rtl">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center font-bold text-lg">
                ⚠️
              </div>
              <div>
                <h3 className="text-base font-bold font-sans">حذف الحساب نهائياً</h3>
                <p className="text-xs text-red-500 font-semibold font-sans">تحذير: هذا الإجراء لا يمكن التراجع عنه!</p>
              </div>
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-sans">
              هل أنت متأكد من رغبتك في حذف حسابك؟ سيؤدي هذا الإجراء إلى حذف جميع بياناتك الشخصية، طلبات توثيق الحساب، وحجوزات الرحلات المرتبطة برقم جوالك بشكل كامل ونهائي من النظام.
            </p>

            {booking.deleteConfirmError && (
              <div className="text-xs text-red-600 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-950 p-3 rounded-xl font-sans">
                {booking.deleteConfirmError}
              </div>
            )}

            <div className="flex justify-start gap-3">
              <button
                type="button"
                disabled={booking.deletingAccount}
                onClick={booking.handleClientDeleteAccount}
                className="inline-flex items-center justify-center rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-red-400 px-4 py-2.5 text-xs font-bold text-white shadow transition cursor-pointer font-sans"
              >
                {booking.deletingAccount ? 'جاري الحذف...' : 'نعم، احذف حسابي'}
              </button>
              <button
                type="button"
                disabled={booking.deletingAccount}
                onClick={() => {
                  booking.setShowDeleteConfirmModal(false)
                  booking.setDeleteConfirmError('')
                }}
                className="inline-flex items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-50 px-4 py-2.5 text-xs font-bold text-neutral-700 dark:text-neutral-300 transition cursor-pointer font-sans"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  )
}

export default Bus
