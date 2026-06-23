import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClientStatus } from './useClientStatus'
import { STEPS } from '../constants/bookingSteps'
import { cityOptions, companyOptions } from '../constants/cities'
import { clientLogout, deleteClientAccount } from '../services/authApi'
import { fetchClientBookings, createBooking } from '../services/bookingApi'
import { fetchSchedules, fetchBookedSeats } from '../services/scheduleApi'
import { submitVerification } from '../services/verificationApi'
import { openPrintWindow } from '../utils/printTicket'

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

export function useBooking() {
  const navigate = useNavigate()

  // Client session status
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

  // Form & Travel States
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
  
  const [tripTime, setTripTime] = useState('06:30:00 PM')
  const [arrivalTime, setArrivalTime] = useState('05:30:00 PM')
  const [issuingOffice, setIssuingOffice] = useState('وكيل اب مساعد كامل')
  const [notes, setNotes] = useState('الصعود من عفار')
  const [bookedSeats, setBookedSeats] = useState([])
  
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [lastTicket, setLastTicket] = useState(null)

  // Booking Flow Steps & Search
  const [bookingStep, setBookingStep] = useState(STEPS.SEARCH)
  const [searchOrigin, setSearchOrigin] = useState('')
  const [searchDestination, setSearchDestination] = useState('')
  const [searchDate, setSearchDate] = useState('')
  const [searchAdults, setSearchAdults] = useState(1)
  const [searchChildren, setSearchChildren] = useState(0)
  const [searchFilteredSchedules, setSearchFilteredSchedules] = useState([])
  const [selectedSchedule, setSelectedSchedule] = useState(null)
  const [searching, setSearching] = useState(false)

  // User Dropdown & deletion confirmations
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [deleteConfirmError, setDeleteConfirmError] = useState('')

  // Client Account Verification Modal States
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

  // My Bookings Modal States
  const [showMyBookings, setShowMyBookings] = useState(false)
  const [myBookings, setMyBookings] = useState([])
  const [loadingBookings, setLoadingBookings] = useState(false)
  const [bookingsError, setBookingsError] = useState('')

  const totalPassengers = searchAdults + searchChildren

  // Synchronize passengers array size
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

  // Load available schedules
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

  // Auto-align default transport company
  useEffect(() => {
    if (availableDates.length > 0) {
      const companies = [...new Set(availableDates.map(d => d.company))].filter(Boolean)
      if (companies.length > 0 && !companies.includes(company)) {
        setCompany(companies[0])
      }
    }
  }, [availableDates, company])

  // Sync scheduled times and arrival predictions
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

  // Reset travel date if invalid for company
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

  // Load booked seats for selected schedule
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

  // Filter out any newly occupied selected seats
  useEffect(() => {
    setSelectedSeats(prev => prev.filter(s => !bookedSeats.includes(s)))
  }, [bookedSeats])

  // Fetch client bookings
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

  // Handle travel search matching
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

  // Toggle seat visual state
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

  // Handle payment visual changes
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

    const uniqueCompanies = [...new Set(availableDates.map(d => d.company))].filter(Boolean)
    const activeCompanies = uniqueCompanies.length > 0 ? uniqueCompanies : companyOptions
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
    
    const filteredDates = availableDates.filter((d) => d.company === company)
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

  return {
    passengerName,
    setPassengerName,
    phone,
    setPhone,
    verificationStatus,
    setVerificationStatus,
    csrfToken,
    fetchClientStatus,
    paymentRef,
    setPaymentRef,
    paymentImage,
    setPaymentImage,
    paymentPreview,
    setPaymentPreview,
    travelDate,
    setTravelDate,
    availableDates,
    setAvailableDates,
    company,
    setCompany,
    origin,
    setOrigin,
    destination,
    setDestination,
    selectedSeats,
    setSelectedSeats,
    passengersDetails,
    setPassengersDetails,
    tripTime,
    setTripTime,
    arrivalTime,
    setArrivalTime,
    issuingOffice,
    setIssuingOffice,
    notes,
    setNotes,
    bookedSeats,
    setBookedSeats,
    status,
    setStatus,
    error,
    setError,
    successMessage,
    setSuccessMessage,
    lastTicket,
    setLastTicket,
    bookingStep,
    setBookingStep,
    searchOrigin,
    setSearchOrigin,
    searchDestination,
    setSearchDestination,
    searchDate,
    setSearchDate,
    searchAdults,
    setSearchAdults,
    searchChildren,
    setSearchChildren,
    searchFilteredSchedules,
    setSearchFilteredSchedules,
    selectedSchedule,
    setSelectedSchedule,
    searching,
    setSearching,
    showUserDropdown,
    setShowUserDropdown,
    showDeleteConfirmModal,
    setShowDeleteConfirmModal,
    deletingAccount,
    setDeletingAccount,
    deleteConfirmError,
    setDeleteConfirmError,
    showVerificationForm,
    setShowVerificationForm,
    verifyFullname,
    setVerifyFullname,
    verifyIdType,
    setVerifyIdType,
    verifyIdNumber,
    setVerifyIdNumber,
    verifyIssueDate,
    setVerifyIssueDate,
    verifyIssuePlace,
    setVerifyIssuePlace,
    verifyImage,
    setVerifyImage,
    verifyImagePreview,
    setVerifyImagePreview,
    verifyError,
    setVerifyError,
    verifySuccess,
    setVerifySuccess,
    verifyLoading,
    setVerifyLoading,
    showMyBookings,
    setShowMyBookings,
    myBookings,
    setMyBookings,
    loadingBookings,
    setLoadingBookings,
    bookingsError,
    setBookingsError,
    totalPassengers,
    handleFetchMyBookings,
    handleSearchSubmit,
    handleSelectSchedule,
    handleSeatClick,
    handlePaymentImageChange,
    handleBookingSubmit,
    handleVerifySubmit,
    handleClientLogout,
    handleClientDeleteAccount
  }
}

export default useBooking
