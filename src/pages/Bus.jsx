import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { openPrintWindow } from '../utils/printTicket'

// Constants
import { STEPS } from '../constants/bookingSteps'
import { cityOptions, companyOptions } from '../constants/cities'

// Custom Hooks
import { useClientStatus } from '../hooks/useClientStatus'

// Services APIs
import { clientLogout, deleteClientAccount } from '../services/authApi'
import { fetchClientBookings, createBooking } from '../services/bookingApi'
import { fetchSchedules, fetchBookedSeats } from '../services/scheduleApi'
import { submitVerification } from '../services/verificationApi'

// Subcomponents
import PromoSlider from '../components/booking/PromoSlider'
import SearchForm from '../components/booking/SearchForm'
import SearchResults from '../components/booking/SearchResults'
import PassengerDetailsForm from '../components/booking/PassengerDetailsForm'
import VerificationModal from '../components/booking/VerificationModal'
import MyBookingsModal from '../components/booking/MyBookingsModal'
import BookingSuccess from '../components/booking/BookingSuccess'

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

const Bus = () => {
  const navigate = useNavigate()
  const dropdownRef = useRef(null)

  // Custom status hook
  const {
    passengerName,
    setPassengerName,
    phone,
    setPhone,
    verificationStatus,
    setVerificationStatus,
    csrfToken,
    fetchClientStatus
  } = useClientStatus()

  // Passenger & Travel Details
  const [paymentRef, setPaymentRef] = useState('')
  const [paymentImage, setPaymentImage] = useState(null)
  const [paymentPreview, setPaymentPreview] = useState('')
  const [travelDate, setTravelDate] = useState('')
  const [availableDates, setAvailableDates] = useState([])
  const [company, setCompany] = useState('البركة')
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [selectedSeats, setSelectedSeats] = useState([])
  const [passengersDetails, setPassengersDetails] = useState([])
  
  // Trip details (automatically updated on selected schedule)
  const [tripTime, setTripTime] = useState('06:30:00 PM')
  const [arrivalTime, setArrivalTime] = useState('05:30:00 PM')
  const [issuingOffice, setIssuingOffice] = useState('وكيل اب مساعد كامل')
  const [notes, setNotes] = useState('الصعود من عفار')
  const [bookedSeats, setBookedSeats] = useState([])
  
  // Status message states
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [lastTicket, setLastTicket] = useState(null)

  // Multi-step Booking States
  const [bookingStep, setBookingStep] = useState(STEPS.SEARCH)
  const [searchOrigin, setSearchOrigin] = useState('')
  const [searchDestination, setSearchDestination] = useState('')
  const [searchDate, setSearchDate] = useState('')
  const [searchAdults, setSearchAdults] = useState(1)
  const [searchChildren, setSearchChildren] = useState(0)
  const [searchFilteredSchedules, setSearchFilteredSchedules] = useState([])
  const [selectedSchedule, setSelectedSchedule] = useState(null)
  const [searching, setSearching] = useState(false)

  // Profile dropdown and deletion modal states
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [deleteConfirmError, setDeleteConfirmError] = useState('')

  // Account Verification Form States
  const [showVerificationForm, setShowVerificationForm] = useState(false)
  const [verifyFullname, setVerifyFullname] = useState('')
  const [verifyIdType, setVerifyIdType] = useState('جواز سفر')
  const [verifyIdNumber, setVerifyIdNumber] = useState('')
  const [verifyIssueDate, setVerifyIssueDate] = useState('')
  const [verifyIssuePlace, setVerifyIssuePlace] = useState('')
  const [verifyImage, setVerifyImage] = useState(null)
  const [verifyImagePreview, setVerifyImagePreview] = useState('')
  const [verifyError, setVerifyError] = useState('')
  const [verifySuccess, setVerifySuccess] = useState('')
  const [verifyLoading, setVerifyLoading] = useState(false)

  // Past Bookings Modal States
  const [showMyBookings, setShowMyBookings] = useState(false)
  const [myBookings, setMyBookings] = useState([])
  const [loadingBookings, setLoadingBookings] = useState(false)
  const [bookingsError, setBookingsError] = useState('')

  const totalPassengers = searchAdults + searchChildren

  // Synchronize passenger count and details list
  useEffect(() => {
    if (bookingStep !== STEPS.DETAILS) return
    setPassengersDetails((prev) => {
      const next = [...prev]
      if (next.length < totalPassengers) {
        for (let i = next.length; i < totalPassengers; i++) {
          const defaultName = i === 0 ? (passengerName || sessionStorage.getItem('clientName') || '') : ''
          next.push({
            name: defaultName,
            passport: '',
            dob: '1985',
            passportImage: null,
            passportPreview: ''
          })
        }
      } else if (next.length > totalPassengers) {
        next.splice(totalPassengers)
      }
      return next
    })
  }, [totalPassengers, bookingStep, passengerName])

  // Click outside user dropdown handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Initial schedules load
  useEffect(() => {
    const loadSchedules = async () => {
      try {
        const data = await fetchSchedules()
        setAvailableDates(data.dates || [])
      } catch (e) {
        // ignore
      }
    }
    loadSchedules()
  }, [])

  // Handle transport company matching
  const uniqueCompanies = [...new Set(availableDates.map(d => d.company))].filter(Boolean)
  const activeCompanies = uniqueCompanies.length > 0 ? uniqueCompanies : companyOptions
  const filteredDates = availableDates.filter((d) => d.company === company)

  useEffect(() => {
    if (availableDates.length > 0) {
      const companies = [...new Set(availableDates.map(d => d.company))].filter(Boolean)
      if (companies.length > 0 && !companies.includes(company)) {
        setCompany(companies[0])
      }
    }
  }, [availableDates, company])

  // Synchronize trip details when a schedule is selected
  useEffect(() => {
    if (selectedSchedule) {
      const time = selectedSchedule.tripTime || '06:30:00 PM'
      setTripTime(time)
      setNotes(selectedSchedule.notes || 'الصعود من عفار')
      setIssuingOffice(selectedSchedule.issuingOffice || 'وكيل اب مساعد كامل')
      setArrivalTime(getArrivalTime(time))
    } else {
      setTripTime('06:30:00 PM')
      setNotes('الصعود من عفار')
      setIssuingOffice('وكيل اب مساعد كامل')
      setArrivalTime('05:30:00 PM')
    }
  }, [selectedSchedule])

  // Validate travel date on company change
  useEffect(() => {
    if (travelDate && availableDates.length > 0) {
      const isDateValidForCompany = availableDates.some(
        (d) => d.company === company && d.travelDate === travelDate
      )
      if (!isDateValidForCompany) {
        setTravelDate('')
      }
    }
  }, [company, availableDates])

  // Fetch booked seats when a specific schedule is selected
  useEffect(() => {
    const getBookedSeats = async () => {
      if (selectedSchedule) {
        try {
          const data = await fetchBookedSeats(selectedSchedule.id)
          setBookedSeats(data.bookedSeats || [])
        } catch (e) {
          // ignore
        }
      } else {
        setBookedSeats([])
      }
    }
    getBookedSeats()
  }, [selectedSchedule])

  // Filter out seats that become booked
  useEffect(() => {
    setSelectedSeats(prev => prev.filter(s => !bookedSeats.includes(s)))
  }, [bookedSeats])

  // Fetch customer bookings
  const handleFetchMyBookings = async () => {
    setLoadingBookings(true)
    setBookingsError('')
    try {
      const data = await fetchClientBookings()
      setMyBookings(data.bookings || [])
    } catch (err) {
      setBookingsError(err.message)
    } finally {
      setLoadingBookings(false)
    }
  }

  // Handle travel search submission
  const handleSearchSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!searchOrigin) {
      setError('يرجى اختيار مدينة الانطلاق.')
      return
    }
    if (!searchDestination) {
      setError('يرجى اختيار مدينة الوصول.')
      return
    }
    if (searchOrigin === searchDestination) {
      setError('يجب أن تكون مدينة الوصول مختلفة عن مدينة الانطلاق.')
      return
    }
    if (!searchDate) {
      setError('يرجى تحديد تاريخ السفر.')
      return
    }

    setSearching(true)
    try {
      const matches = availableDates.filter((s) => s.travelDate === searchDate)
      
      // Fetch booked counts for matched schedules
      const updatedMatches = await Promise.all(
        matches.map(async (s) => {
          try {
            const data = await fetchBookedSeats(s.id)
            return { ...s, bookedCount: (data.bookedSeats || []).length }
          } catch (err) {
            // ignore
          }
          return { ...s, bookedCount: 0 }
        })
      )
      setSearchFilteredSchedules(updatedMatches)
      setBookingStep(STEPS.RESULTS)
    } catch (err) {
      setError('حدث خطأ أثناء البحث عن الرحلات. حاول مرة أخرى.')
    } finally {
      setSearching(false)
    }
  }

  // Handle schedule selection
  const handleSelectSchedule = (s) => {
    setSelectedSchedule(s)
    setCompany(s.company)
    setTravelDate(s.travelDate)
    setOrigin(searchOrigin)
    setDestination(searchDestination)
    setSelectedSeats([])
    setBookingStep(STEPS.DETAILS)
  }

  // Seat click handler
  const handleSeatClick = (seatNum) => {
    if (bookedSeats.includes(seatNum)) return
    setLastTicket(null)
    if (selectedSeats.includes(seatNum)) {
      setSelectedSeats(selectedSeats.filter(s => s !== seatNum))
    } else {
      if (selectedSeats.length >= totalPassengers) {
        setError(`لقد قمت باختيار الحد الأقصى للمقاعد المتاحة لك بناءً على عدد المسافرين (${totalPassengers} مقعد)`)
        return
      }
      setError('')
      setSelectedSeats([...selectedSeats, seatNum])
    }
  }

  // Handle payment image change
  const handlePaymentImageChange = (event) => {
    setLastTicket(null)
    const file = event.target.files?.[0]
    if (!file) {
      setPaymentImage(null)
      setPaymentPreview('')
      return
    }
    setPaymentImage(file)
    setPaymentPreview(URL.createObjectURL(file))
  }

  // Handle passenger booking submission
  const handleBookingSubmit = async (event) => {
    event.preventDefault()
    setSuccessMessage('')
    const namePattern = /^[\u0600-\u06FF\u0621-\u064A\u0660-\u0669A-Za-z ]{3,100}$/
    const phonePattern = /^[0-9]{7,15}$/
    const passportPattern = /^[A-Za-z0-9-]{5,20}$/
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp']

    if (selectedSeats.length !== totalPassengers) {
      setError(`يرجى تحديد ${totalPassengers} مقاعد من الحافلة قبل إرسال الحجز (المحدد حالياً: ${selectedSeats.length} مقعد).`)
      return
    }

    if (!phonePattern.test(phone.trim())) {
      setError('رقم الجوال غير صالح. يجب أن يحتوي على 7 إلى 15 رقماً.')
      return
    }

    // Validate details for all passengers
    for (let i = 0; i < totalPassengers; i++) {
      const passenger = passengersDetails[i]
      const seatNum = selectedSeats[i]
      if (!passenger) {
        setError(`يرجى استكمال بيانات المسافر ${i + 1}.`)
        return
      }
      if (!namePattern.test(passenger.name.trim())) {
        setError(`اسم المسافر ${i + 1} غير صالح. استخدم حروفاً ومسافات فقط، بين 3 و100 حرف.`)
        return
      }
      if (!passportPattern.test(passenger.passport.trim())) {
        setError(`رقم الجواز للمسافر ${i + 1} غير صالح. استخدم أحرفاً وأرقاماً فقط، بين 5 و20 حرفاً.`)
        return
      }
      if (!passenger.dob || !passenger.dob.trim()) {
        setError(`يرجى تحديد العمر / سنة الميلاد للمسافر ${i + 1}.`)
        return
      }
      if (!passenger.passportImage) {
        setError(`يرجى رفع صورة جواز السفر للمسافر ${i + 1} (المقعد ${seatNum}).`)
        return
      }
      if (!allowedImageTypes.includes(passenger.passportImage.type)) {
        setError(`يُسمح فقط بصور جواز السفر بصيغة JPG أو PNG أو WEBP للمسافر ${i + 1}.`)
        return
      }
      if (passenger.passportImage.size > 5 * 1024 * 1024) {
        setError(`حجم صورة جواز السفر للمسافر ${i + 1} كبير جداً. الرجاء اختيار صورة أقل من 5 ميجابايت.`)
        return
      }
    }

    if (!activeCompanies.includes(company)) {
      setError('شركة النقل غير صحيحة.')
      return
    }
    if (!cityOptions.includes(origin.trim()) || !cityOptions.includes(destination.trim())) {
      setError('اختر مدينة صالحة من القائمة.')
      return
    }
    if (origin.trim() === destination.trim()) {
      setError('يجب أن تكون الوجهة مختلفة عن نقطة الانطلاق.')
      return
    }
    const filteredDateStrings = filteredDates.map((d) => {
      const value = d && (d.travelDate || d)
      return typeof value === 'string' ? value.trim() : ''
    }).filter(Boolean)

    if (!filteredDateStrings.includes(travelDate)) {
      setError('اختر تاريخ مغادرة صالحاً من التقويم.')
      return
    }

    if (paymentImage) {
      if (!allowedImageTypes.includes(paymentImage.type)) {
        setError('يُسمح فقط بصور إشعار الحوالة بصيغة JPG أو PNG أو WEBP.')
        return
      }
      if (paymentImage.size > 5 * 1024 * 1024) {
        setError('حجم صورة إشعار الحوالة كبير جداً. الرجاء اختيار صورة أقل من 5 ميجابايت.')
        return
      }
    }

    setStatus('sending')
    setError('')

    try {
      if (!csrfToken) {
        setError('فشل الحصول على رمز CSRF. حاول إعادة تحميل الصفحة.')
        setStatus('')
        return
      }

      // Submit all bookings in parallel
      const bookingPromises = passengersDetails.map(async (passenger, index) => {
        const seatNum = selectedSeats[index]
        const passengerType = index < searchAdults ? 'adult' : 'child'
        
        const formData = new FormData()
        formData.append('passengerName', passenger.name.trim())
        formData.append('phone', phone.trim())
        formData.append('passport', passenger.passport.trim())
        formData.append('travelDate', travelDate)
        formData.append('company', company)
        formData.append('origin', origin.trim())
        formData.append('destination', destination.trim())
        formData.append('passportImage', passenger.passportImage)
        formData.append('seat', seatNum)
        formData.append('dob', passenger.dob.trim())
        formData.append('passengerType', passengerType)
        
        if (paymentRef && paymentRef.trim()) {
          formData.append('paymentRef', paymentRef.trim())
        }
        if (paymentImage) {
          formData.append('paymentImage', paymentImage)
        }

        const data = await createBooking(formData, csrfToken)
        
        const ticketPrice = passengerType === 'child'
          ? (selectedSchedule?.priceChild || selectedSchedule?.price || '35000')
          : (selectedSchedule?.priceAdult || selectedSchedule?.price || '35000')

        return {
          ticketNumber: data.ticketNumber || `T-${crypto.randomUUID().slice(0,8)}`,
          passengerName: passenger.name.trim(),
          phone: phone.trim(),
          passport: passenger.passport.trim(),
          travelDate,
          company,
          origin,
          destination,
          seat: seatNum,
          dob: passenger.dob.trim(),
          tripTime,
          arrivalTime,
          dayOfWeek: data.dayOfWeek || 'الاثنين',
          issuingOffice,
          price: ticketPrice,
          notes,
          busType: data.busType || selectedSchedule?.busType || 'VIP'
        }
      })

      const ticketsList = await Promise.all(bookingPromises)

      setStatus('success')
      setSuccessMessage(`تم حفظ الحجوزات بنجاح. عدد التذاكر: ${ticketsList.length}`)
      setLastTicket(ticketsList)
      openPrintWindow(ticketsList)

      // Reset booking details states
      setSelectedSeats([])
      setPassengersDetails([])
      setPaymentRef('')
      setPaymentImage(null)
      setPaymentPreview('')
      setTravelDate('')
      setOrigin('')
      setDestination('')
    } catch (err) {
      setError(err.message)
      setStatus('')
    }
  }

  // Handle client verification submission
  const handleVerifySubmit = async (e) => {
    e.preventDefault()
    setVerifyError('')
    setVerifySuccess('')

    if (!verifyFullname.trim()) {
      setVerifyError('الرجاء إدخال الاسم الكامل.')
      return
    }
    if (!verifyIdNumber.trim()) {
      setVerifyError('الرجاء إدخال رقم الهوية.')
      return
    }
    if (!verifyIssueDate) {
      setVerifyError('الرجاء تحديد تاريخ الإصدار.')
      return
    }
    if (!verifyIssuePlace.trim()) {
      setVerifyError('الرجاء إدخال مكان الإصدار.')
      return
    }
    if (!verifyImage) {
      setVerifyError('الرجاء رفع صورة الجهة الأمامية للهوية.')
      return
    }

    setVerifyLoading(true)
    const formData = new FormData()
    formData.append('fullname', verifyFullname.trim())
    formData.append('identityType', verifyIdType)
    formData.append('identityNumber', verifyIdNumber.trim())
    formData.append('issueDate', verifyIssueDate)
    formData.append('issuePlace', verifyIssuePlace.trim())
    formData.append('identityImage', verifyImage)

    try {
      if (!csrfToken) {
        setVerifyError('فشل الحصول على رمز حماية CSRF. يرجى تحديث الصفحة.')
        setVerifyLoading(false)
        return
      }

      const data = await submitVerification(formData, csrfToken)
      setVerifySuccess(data.message || 'تم تقديم طلب التوثيق بنجاح.')
      setVerificationStatus('pending')
      setTimeout(() => {
        setShowVerificationForm(false)
      }, 2000)
    } catch (err) {
      setVerifyError(err.message)
    } finally {
      setVerifyLoading(false)
    }
  }

  // Handle logout
  const handleClientLogout = async () => {
    try {
      await clientLogout(csrfToken)
    } catch (e) {
      // ignore
    }
    sessionStorage.removeItem('clientPhone')
    sessionStorage.removeItem('clientName')
    navigate('/')
  }

  // Handle account deletion
  const handleClientDeleteAccount = async () => {
    setDeletingAccount(true)
    setDeleteConfirmError('')
    try {
      await deleteClientAccount(csrfToken)
      sessionStorage.removeItem('clientPhone')
      sessionStorage.removeItem('clientName')
      setShowDeleteConfirmModal(false)
      setShowUserDropdown(false)
      navigate('/')
    } catch (e) {
      setDeleteConfirmError(e.message || 'حدث خطأ أثناء حذف الحساب.')
    } finally {
      setDeletingAccount(false)
    }
  }

  return (
    <main className="pt-[8ch] min-h-[calc(100vh-8ch)] bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 md:px-16 lg:px-28 py-12">
        
        {/* Header Bar */}
        <div className="flex justify-between items-center mb-8 flex-row gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-4">
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => {
                if (sessionStorage.getItem('clientPhone')) {
                  setShowUserDropdown(!showUserDropdown)
                }
              }}
              className="flex items-center gap-3 focus:outline-none hover:opacity-80 transition cursor-pointer select-none text-right"
              aria-expanded={showUserDropdown}
            >
              <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-950 flex items-center justify-center font-bold text-orange-600 text-sm shadow-sm ring-2 ring-orange-500/20">
                👤
              </div>
              <div>
                <p className="text-xs text-neutral-400">مرحباً بك،</p>
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  {sessionStorage.getItem('clientName') || (sessionStorage.getItem('clientPhone') ? `عميل (${sessionStorage.getItem('clientPhone')})` : 'زائر')}
                  {sessionStorage.getItem('clientPhone') && (
                    <svg className={`w-3 h-3 text-neutral-400 transition-transform duration-200 ${showUserDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </h2>
              </div>
            </button>

            {/* User Dropdown Menu */}
            {showUserDropdown && sessionStorage.getItem('clientPhone') && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl z-50 py-2 animate-fadeIn origin-top-right divide-y divide-neutral-100 dark:divide-neutral-800">
                <div className="px-4 py-3 text-xs text-neutral-500 dark:text-neutral-400 space-y-1">
                  <div className="font-bold text-neutral-800 dark:text-neutral-200">معلومات الحساب</div>
                  <div>الجوال: <span className="font-mono text-neutral-700 dark:text-neutral-300">{sessionStorage.getItem('clientPhone')}</span></div>
                  <div>حالة التوثيق: <span className={`font-semibold ${verificationStatus === 'verified' ? 'text-green-600 dark:text-green-400' : verificationStatus === 'pending' ? 'text-amber-500' : 'text-red-500'}`}>
                    {verificationStatus === 'verified' ? 'موثق' : verificationStatus === 'pending' ? 'قيد المراجعة' : 'غير موثق'}
                  </span></div>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserDropdown(false)
                      setShowMyBookings(true)
                      handleFetchMyBookings()
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-right text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition cursor-pointer"
                  >
                    <svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    حجوزاتي
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserDropdown(false)
                      handleClientLogout()
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-right text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition cursor-pointer"
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
                      setShowUserDropdown(false)
                      setShowDeleteConfirmModal(true)
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-right text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition cursor-pointer"
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
                  setShowMyBookings(true)
                  handleFetchMyBookings()
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-violet-600 hover:bg-violet-700 px-5 py-2.5 text-xs font-semibold text-white shadow transition cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                حجوزاتي
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-950 dark:bg-red-950/20 dark:text-red-400 font-sans">
            {error}
          </div>
        )}

        {showVerificationForm ? (
          <VerificationModal
            verifyFullname={verifyFullname}
            setVerifyFullname={setVerifyFullname}
            verifyIdType={verifyIdType}
            setVerifyIdType={setVerifyIdType}
            verifyIdNumber={verifyIdNumber}
            setVerifyIdNumber={setVerifyIdNumber}
            verifyIssueDate={verifyIssueDate}
            setVerifyIssueDate={setVerifyIssueDate}
            verifyIssuePlace={verifyIssuePlace}
            setVerifyIssuePlace={setVerifyIssuePlace}
            verifyImagePreview={verifyImagePreview}
            setVerifyImagePreview={setVerifyImagePreview}
            setVerifyImage={setVerifyImage}
            verifyError={verifyError}
            verifySuccess={verifySuccess}
            verifyLoading={verifyLoading}
            handleVerifySubmit={handleVerifySubmit}
            onClose={() => {
              setVerifyError('')
              setVerifySuccess('')
              setShowVerificationForm(false)
            }}
          />
        ) : (
          <>
            {/* STEP 1: SEARCH & SLIDER */}
            {bookingStep === STEPS.SEARCH && (
              <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
                <PromoSlider />
                <SearchForm
                  searchOrigin={searchOrigin}
                  setSearchOrigin={setSearchOrigin}
                  searchDestination={searchDestination}
                  setSearchDestination={setSearchDestination}
                  searchAdults={searchAdults}
                  setSearchAdults={setSearchAdults}
                  searchChildren={searchChildren}
                  setSearchChildren={setSearchChildren}
                  searchDate={searchDate}
                  setSearchDate={setSearchDate}
                  availableDates={availableDates}
                  searching={searching}
                  handleSearch={handleSearchSubmit}
                />
              </div>
            )}

            {/* STEP 2: SEARCH RESULTS */}
            {bookingStep === STEPS.RESULTS && (
              <SearchResults
                searchFilteredSchedules={searchFilteredSchedules}
                searchOrigin={searchOrigin}
                searchDestination={searchDestination}
                verificationStatus={verificationStatus}
                setBookingStep={setBookingStep}
                setShowVerificationForm={setShowVerificationForm}
                handleSelectSchedule={handleSelectSchedule}
              />
            )}

            {/* STEP 3: DETAILS, SEATMAP & PASSPORT FORM */}
            {bookingStep === STEPS.DETAILS && (
              <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
                {/* Header / Back Bar */}
                <div className="flex items-center gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 px-6 py-4 rounded-3xl shadow-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setLastTicket(null)
                      setSuccessMessage('')
                      setSelectedSeats([])
                      setBookingStep(STEPS.RESULTS)
                    }}
                    className="w-9 h-9 rounded-full border border-neutral-300 dark:border-neutral-700 flex items-center justify-center text-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition font-bold cursor-pointer"
                  >
                    ➔
                  </button>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">تفاصيل الرحلة وحجز المقعد</h2>
                </div>

                {lastTicket ? (
                  <BookingSuccess
                    lastTicket={lastTicket}
                    setLastTicket={setLastTicket}
                    setSuccessMessage={setSuccessMessage}
                    setBookingStep={setBookingStep}
                  />
                ) : (
                  <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
                    <section className="space-y-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 shadow-sm">
                      <div className="relative rounded-2xl overflow-hidden h-40 bg-slate-900 border border-neutral-100 dark:border-neutral-800">
                        <img src="/service-slide-2.jpg" alt="مقاعد مريحة" className="w-full h-full object-cover object-center opacity-85" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                        <div className="absolute bottom-4 right-4 text-white space-y-1">
                          <h4 className="text-base font-bold font-sans">باص شركة {company}</h4>
                          <p className="text-xs text-neutral-300 font-sans">أحدث الحافلات المجهزة لسفر مريح</p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-xs text-neutral-500 border-b border-neutral-100 dark:border-neutral-850 pb-2">
                        <span className="flex items-center gap-1 font-semibold text-violet-600 bg-violet-50 dark:bg-violet-950/20 px-2.5 py-0.5 rounded font-sans">
                          🚌 نوع الحافلة: {selectedSchedule?.busType}
                        </span>
                        <div className="flex gap-4">
                          <span>⚡ شحن USB</span>
                          <span>📶 واي فاي Wifi</span>
                        </div>
                      </div>

                      <PassengerDetailsForm
                        selectedSchedule={selectedSchedule}
                        bookedSeats={bookedSeats}
                        selectedSeats={selectedSeats}
                        handleSeatClick={handleSeatClick}
                        passengersDetails={passengersDetails}
                        setPassengersDetails={setPassengersDetails}
                        searchAdults={searchAdults}
                        totalPassengers={totalPassengers}
                        phone={phone}
                        setPhone={setPhone}
                        paymentRef={paymentRef}
                        setPaymentRef={setPaymentRef}
                        paymentPreview={paymentPreview}
                        handlePaymentImageChange={handlePaymentImageChange}
                        status={status}
                        handleSubmit={handleBookingSubmit}
                      />
                    </section>

                    {/* Sidebar Overview */}
                    <aside className="space-y-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm">
                      <div className="rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-850 p-5 space-y-3">
                        <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-200 border-b border-neutral-200 dark:border-neutral-800 pb-2 font-sans">المقاعد والأسعار</h3>
                        <div className="flex justify-between text-xs">
                          <span className="text-neutral-500">المقاعد المتوفرة:</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300 font-sans">
                            {selectedSchedule.totalSeats - (selectedSchedule.bookedCount || 0)} مقعد
                          </span>
                        </div>
                        <div className="flex justify-between text-xs pt-2 border-t border-neutral-200 dark:border-neutral-800">
                          <span className="text-neutral-500">المقاعد المحددة:</span>
                          <span className="font-bold text-violet-600 dark:text-violet-400 font-sans">
                            {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'لا يوجد'}
                          </span>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-850 p-5 space-y-4">
                        <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-200 border-b border-neutral-200 dark:border-neutral-800 pb-2 font-sans">تفاصيل الأسعار</h3>
                        
                        {searchAdults > 0 && (
                          <div className="flex justify-between items-center text-xs">
                            <div>
                              <span className="block font-bold font-sans">الكبار ({searchAdults} × Adults)</span>
                              <span className="text-neutral-400 font-sans">سياحي ({selectedSchedule.busType})</span>
                            </div>
                            <span className="font-extrabold text-green-600 dark:text-green-400 font-sans font-bold">
                              {searchAdults * (selectedSchedule.priceAdult || selectedSchedule.price || 35000)} YER
                            </span>
                          </div>
                        )}

                        {searchChildren > 0 && (
                          <div className="flex justify-between items-center text-xs border-t border-neutral-200 dark:border-neutral-800 pt-3">
                            <div>
                              <span className="block font-bold font-sans">الصغار ({searchChildren} × Children)</span>
                              <span className="text-neutral-400 font-sans">سياحي ({selectedSchedule.busType})</span>
                            </div>
                            <span className="font-extrabold text-green-600 dark:text-green-400 font-sans font-bold">
                              {searchChildren * (selectedSchedule.priceChild || selectedSchedule.price || 35000)} YER
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between items-center text-sm border-t border-neutral-200 dark:border-neutral-800 pt-3 font-bold">
                          <span className="text-slate-800 dark:text-slate-200 font-sans">إجمالي السعر ({totalPassengers} مسافرين)</span>
                          <span className="text-lg text-emerald-600 dark:text-emerald-400 font-sans font-bold">
                            {(searchAdults * (selectedSchedule.priceAdult || selectedSchedule.price || 35000) + searchChildren * (selectedSchedule.priceChild || selectedSchedule.price || 35000))} YER
                          </span>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-850 p-5 space-y-3">
                        <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-200 border-b border-neutral-200 dark:border-neutral-800 pb-2 font-sans">معلومات الرحلة</h3>
                        <div className="text-xs space-y-2 font-sans">
                          <div className="flex justify-between">
                            <span className="text-neutral-500">مسار السفر:</span>
                            <span className="font-bold">{origin} ← {destination}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-500">الشركة الناقلة:</span>
                            <span className="font-bold">{company}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-500">تاريخ السفر:</span>
                            <span className="font-bold">{travelDate}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-500">توقيت الانطلاق:</span>
                            <span className="font-bold">{tripTime}</span>
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
        showMyBookings={showMyBookings}
        setShowMyBookings={setShowMyBookings}
        myBookings={myBookings}
        loadingBookings={loadingBookings}
        bookingsError={bookingsError}
      />

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirmModal && (
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

            {deleteConfirmError && (
              <div className="text-xs text-red-600 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-950 p-3 rounded-xl font-sans">
                {deleteConfirmError}
              </div>
            )}

            <div className="flex justify-start gap-3">
              <button
                type="button"
                disabled={deletingAccount}
                onClick={handleClientDeleteAccount}
                className="inline-flex items-center justify-center rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-red-400 px-4 py-2.5 text-xs font-bold text-white shadow transition cursor-pointer font-sans"
              >
                {deletingAccount ? 'جاري الحذف...' : 'نعم، احذف حسابي'}
              </button>
              <button
                type="button"
                disabled={deletingAccount}
                onClick={() => {
                  setShowDeleteConfirmModal(false)
                  setDeleteConfirmError('')
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
