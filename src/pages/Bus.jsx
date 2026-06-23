import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import DatePicker from '../components/DatePicker/DatePicker'
import { getCsrfToken } from '../utils/csrf'
import { openPrintWindow } from '../utils/printTicket'

const cityOptions = [
  'البيضاء',
  'صنعاء',
  'عدن',
  'تعز',
  'الحديدة',
  'ذمار',
  'الرياض',
  'جدة',
  'الدمام',
  'أبها',
  'مكة',
  'إب',
  'نجران',
]

const companyOptions = ['البركة', 'المتصدر', 'البراق', 'إكسبرس']

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
  
  // Passenger Form States
  const [passengerName, setPassengerName] = useState('')
  const [phone, setPhone] = useState('')
  const [passport, setPassport] = useState('')
  const [passportImage, setPassportImage] = useState(null)
  const [passportPreview, setPassportPreview] = useState('')
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
  const [dob, setDob] = useState('1985')
  const [tripTime, setTripTime] = useState('06:30:00 PM')
  const [arrivalTime, setArrivalTime] = useState('05:30:00 PM')
  const [issuingOffice, setIssuingOffice] = useState('وكيل اب مساعد كامل')
  const [notes, setNotes] = useState('الصعود من عفار')
  const [bookedSeats, setBookedSeats] = useState([])
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [csrfToken, setCsrfToken] = useState('')
  const [lastTicket, setLastTicket] = useState(null)

  // Multi-step Booking States
  const [bookingStep, setBookingStep] = useState(1)
  const [searchOrigin, setSearchOrigin] = useState('')
  const [searchDestination, setSearchDestination] = useState('')
  const [searchDate, setSearchDate] = useState('')
  const [searchAdults, setSearchAdults] = useState(1)
  const [searchChildren, setSearchChildren] = useState(0)
  const [searchFilteredSchedules, setSearchFilteredSchedules] = useState([])
  const [selectedSchedule, setSelectedSchedule] = useState(null)
  const [searching, setSearching] = useState(false)
  const [currentPromoSlide, setCurrentPromoSlide] = useState(0)

  // Profile dropdown and account deletion modal states
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [deleteConfirmError, setDeleteConfirmError] = useState('')
  const dropdownRef = useRef(null)

  const totalPassengers = searchAdults + searchChildren

  useEffect(() => {
    if (bookingStep !== 3) return
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

  // Account Verification States
  const [showVerificationForm, setShowVerificationForm] = useState(false)
  const [verifyFullname, setVerifyFullname] = useState('')
  const [verifyIdType, setVerifyIdType] = useState('جواز سفر')
  const [verifyIdNumber, setVerifyIdNumber] = useState('')
  const [verifyIssueDate, setVerifyIssueDate] = useState('')
  const [verifyIssuePlace, setVerifyIssuePlace] = useState('')
  const [verifyImage, setVerifyImage] = useState(null)
  const [verifyImagePreview, setVerifyImagePreview] = useState('')
  const [verificationStatus, setVerificationStatus] = useState('unverified')
  const [verifyError, setVerifyError] = useState('')
  const [verifySuccess, setVerifySuccess] = useState('')
  const [verifyLoading, setVerifyLoading] = useState(false)

  // Past Bookings Modal States
  const [showMyBookings, setShowMyBookings] = useState(false)
  const [myBookings, setMyBookings] = useState([])
  const [loadingBookings, setLoadingBookings] = useState(false)
  const [bookingsError, setBookingsError] = useState('')

  const promoSlides = [
    { image: '/service-slide-1.jpg', text: 'يمن باص - لخدمات السفر والخدمات العامة' },
    { image: '/service-slide-2.jpg', text: 'سفر مريح بلا متاعب - وكلاء شركة ترحيب بالبيضاء' },
    { image: '/service-slide-3.jpg', text: 'استخراج تأشيرات الزيارة العائلية للسعودية' },
    { image: '/service-slide-4.jpg', text: 'استخراج فيز عمل وتسهيل معاملات المغتربين' },
    { image: '/service-slide-5.jpg', text: 'يمن باص - متخصصون في خدمات السفر البري' }
  ]

  const fetchMyBookings = async () => {
    setLoadingBookings(true)
    setBookingsError('')
    try {
      const res = await fetch('/api/client/bookings')
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'فشل جلب الحجوزات.')
      }
      const data = await res.json()
      setMyBookings(data.bookings || [])
    } catch (err) {
      setBookingsError(err.message)
    } finally {
      setLoadingBookings(false)
    }
  }

  const handleValChange = (setter, val) => {
    setter(val)
    setLastTicket(null)
  }

  const fetchClientStatus = async () => {
    try {
      const res = await fetch('/api/client/status')
      if (res.ok) {
        const data = await res.json()
        if (data.isLoggedIn) {
          setVerificationStatus(data.verificationStatus)
          if (data.fullname) {
            setPassengerName(data.fullname)
            sessionStorage.setItem('clientName', data.fullname)
          }
        }
      }
    } catch (e) {
      // ignore
    }
  }

  useEffect(() => {
    const storedName = sessionStorage.getItem('clientName')
    const storedPhone = sessionStorage.getItem('clientPhone')
    if (storedName) setPassengerName(storedName)
    if (storedPhone) setPhone(storedPhone)
    fetchClientStatus()
  }, [])

  // Handle click outside user dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const res = await fetch('/api/schedules')
        if (!res.ok) return
        const data = await res.json()
        setAvailableDates(data.dates || [])
      } catch (e) {
        // ignore
      }
    }
    fetchSchedules()
  }, [])

  useEffect(() => {
    const loadToken = async () => {
      const token = await getCsrfToken()
      setCsrfToken(token)
    }
    loadToken()
  }, [])

  // Auto-play promo slideshow in Step 1
  useEffect(() => {
    if (bookingStep !== 1) return
    const timer = setInterval(() => {
      setCurrentPromoSlide((prev) => (prev === promoSlides.length - 1 ? 0 : prev + 1))
    }, 4500)
    return () => clearInterval(timer)
  }, [bookingStep, promoSlides.length])

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
    const fetchBookedSeats = async () => {
      if (selectedSchedule) {
        try {
          const res = await fetch(`/api/schedules/${selectedSchedule.id}/booked-seats`)
          if (res.ok) {
            const data = await res.json()
            setBookedSeats(data.bookedSeats || [])
          }
        } catch (e) {
          // ignore
        }
      } else {
        setBookedSeats([])
      }
    }
    fetchBookedSeats()
  }, [selectedSchedule])

  useEffect(() => {
    setSelectedSeats(prev => prev.filter(s => !bookedSeats.includes(s)))
  }, [bookedSeats])

  const getTripDuration = (from, to) => {
    const isKsa = (city) => ['الرياض', 'جدة', 'الدمام', 'أبها', 'مكة', 'نجران'].includes(city)
    const isYem = (city) => ['البيضاء', 'صنعاء', 'عدن', 'تعز', 'الحديدة', 'ذمار', 'إب'].includes(city)
    if (isYem(from) && isKsa(to)) return '32 ساعة'
    if (isKsa(from) && isYem(to)) return '32 ساعة'
    if (isKsa(from) && isKsa(to)) return '12 ساعة'
    return '8 ساعات'
  }

  const handleSearch = async (e) => {
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
            const res = await fetch(`/api/schedules/${s.id}/booked-seats`)
            if (res.ok) {
              const data = await res.json()
              return { ...s, bookedCount: (data.bookedSeats || []).length }
            }
          } catch (err) {
            // ignore
          }
          return { ...s, bookedCount: 0 }
        })
      )
      setSearchFilteredSchedules(updatedMatches)
      setBookingStep(2)
    } catch (err) {
      setError('حدث خطأ أثناء البحث عن الرحلات. حاول مرة أخرى.')
    } finally {
      setSearching(false)
    }
  }

  const handleSelectSchedule = (s) => {
    setSelectedSchedule(s)
    setCompany(s.company)
    setTravelDate(s.travelDate)
    setOrigin(searchOrigin)
    setDestination(searchDestination)
    setSelectedSeats([])
    setBookingStep(3)
  }

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

  const renderSeatButton = (seatNum) => {
    const isBooked = bookedSeats.includes(seatNum)
    const isSelected = selectedSeats.includes(seatNum)
    
    let btnClasses = "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all "
    if (isBooked) {
      btnClasses += "bg-red-100 dark:bg-red-950 border border-red-200 dark:border-red-900 text-red-400 cursor-not-allowed"
    } else if (isSelected) {
      btnClasses += "bg-violet-600 text-white shadow-lg shadow-violet-200/50 dark:shadow-violet-900/50 ring-2 ring-violet-400 scale-105"
    } else {
      btnClasses += "bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-violet-500 dark:hover:border-violet-500 hover:text-violet-600 dark:hover:text-violet-400"
    }
    
    return (
      <button
        key={seatNum}
        type="button"
        disabled={isBooked}
        onClick={() => handleSeatClick(seatNum)}
        className={btnClasses}
        title={isBooked ? `المقعد ${seatNum} محجوز` : `المقعد ${seatNum}`}
      >
        {seatNum}
      </button>
    )
  }

  const renderSeatGrid = () => {
    if (!selectedSchedule) return null
    const total = selectedSchedule.totalSeats || 40
    const isVip = selectedSchedule.busType === 'VIP'
    const seats = []
    
    if (isVip) {
      for (let i = 1; i <= total; i += 3) {
        const rowSeats = []
        for (let j = 0; j < 3; j++) {
          if (i + j <= total) {
            rowSeats.push(i + j)
          } else {
            rowSeats.push(null)
          }
        }
        seats.push(rowSeats)
      }
    } else {
      for (let i = 1; i <= total; i += 4) {
        const rowSeats = []
        for (let j = 0; j < 4; j++) {
          if (i + j <= total) {
            rowSeats.push(i + j)
          } else {
            rowSeats.push(null)
          }
        }
        seats.push(rowSeats)
      }
    }
    
    return (
      <div className="border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 bg-neutral-50 dark:bg-neutral-950 mt-4 md:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
            اختر رقم المقعد ({isVip ? 'حافلة VIP' : 'حافلة عادية'})
          </h4>
          <div className="flex gap-4 text-xs">
            <span className="flex items-center gap-1"><span className="w-3.5 h-3.5 rounded bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 inline-block"></span> متاح</span>
            <span className="flex items-center gap-1"><span className="w-3.5 h-3.5 rounded bg-violet-600 inline-block"></span> محدد</span>
            <span className="flex items-center gap-1"><span className="w-3.5 h-3.5 rounded bg-red-100 dark:bg-red-950 border border-red-200 dark:border-red-900 inline-block"></span> محجوز</span>
          </div>
        </div>
        
        {/* Bus Front Indicator */}
        <div className="w-full flex justify-center mb-6">
          <div className="w-24 py-1 text-center bg-neutral-200 dark:bg-neutral-800 text-xs font-bold text-neutral-500 rounded-t-xl border-t border-x border-neutral-300 dark:border-neutral-700 relative">
            مقدمة الحافلة (السائق)
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-2.5 h-1 bg-neutral-400 dark:bg-neutral-600 rounded-t-sm"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-5 gap-3 max-w-sm mx-auto">
          {seats.map((row, rIdx) => {
            if (isVip) {
              return (
                <React.Fragment key={rIdx}>
                  {/* Column 1: Right Seat */}
                  {row[0] !== null ? renderSeatButton(row[0]) : <div />}
                  
                  {/* Column 2: Empty Spacer */}
                  <div />
                  
                  {/* Column 3: The Aisle Spacer */}
                  <div className="flex items-center justify-center text-[10px] text-neutral-400 dark:text-neutral-600 font-bold select-none">
                    ممر
                  </div>
                  
                  {/* Column 4: Left Aisle Seat */}
                  {row[1] !== null ? renderSeatButton(row[1]) : <div />}
                  
                  {/* Column 5: Left Window Seat */}
                  {row[2] !== null ? renderSeatButton(row[2]) : <div />}
                </React.Fragment>
              )
            } else {
              return (
                <React.Fragment key={rIdx}>
                  {/* Column 1: Window Right */}
                  {row[0] !== null ? renderSeatButton(row[0]) : <div />}
                  
                  {/* Column 2: Aisle Right */}
                  {row[1] !== null ? renderSeatButton(row[1]) : <div />}
                  
                  {/* Column 3: The Aisle Spacer */}
                  <div className="flex items-center justify-center text-[10px] text-neutral-400 dark:text-neutral-600 font-bold select-none">
                    ممر
                  </div>
                  
                  {/* Column 4: Aisle Left */}
                  {row[2] !== null ? renderSeatButton(row[2]) : <div />}
                  
                  {/* Column 5: Window Left */}
                  {row[3] !== null ? renderSeatButton(row[3]) : <div />}
                </React.Fragment>
              )
            }
          })}
        </div>
      </div>
    )
  }

  const handlePassportImageChange = (event) => {
    setLastTicket(null)
    const file = event.target.files?.[0]
    if (!file) {
      setPassportImage(null)
      setPassportPreview('')
      return
    }
    setPassportImage(file)
    setPassportPreview(URL.createObjectURL(file))
  }

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

  const handleSubmit = async (event) => {
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

    // Validate each passenger details
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

      // Submit in parallel
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

        const response = await fetch('/api/bookings', {
          method: 'POST',
          headers: {
            'X-CSRF-Token': csrfToken,
          },
          body: formData,
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.message || `فشل إرسال حجز المقعد ${seatNum}.`)
        }

        const data = await response.json()
        
        // Determine the display price for this ticket
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

      // Clear states
      setSelectedSeats([])
      setPassengersDetails([])
      setPaymentRef('')
      setPaymentImage(null)
      setPaymentPreview('')
      setTravelDate('')
      setOrigin('')
      setDestination('')
      setDob('1985')
    } catch (err) {
      setError(err.message)
      setStatus('')
    }
  }

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

      const res = await fetch('/api/client/verify', {
        method: 'POST',
        headers: {
          'X-CSRF-Token': csrfToken,
        },
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'فشل إرسال طلب التوثيق.')
      }

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

  const renderVerificationForm = () => {
    return (
      <div className="space-y-6 animate-fadeIn max-w-lg mx-auto bg-neutral-50 dark:bg-neutral-950 p-4 rounded-3xl" dir="rtl">
        {/* Header Bar */}
        <div className="flex items-center justify-between bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 px-6 py-4 rounded-3xl shadow-sm">
          <button
            type="button"
            onClick={() => {
              setVerifyError('')
              setVerifySuccess('')
              setShowVerificationForm(false)
            }}
            className="w-10 h-10 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-center text-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 shadow-sm transition font-bold"
            title="رجوع"
          >
            ➔
          </button>
          <h2 className="text-xl font-black text-slate-800 dark:text-slate-200">تأكيد الحساب</h2>
          <div className="w-10" /> {/* Spacer to align title */}
        </div>

        {verifyError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-950 dark:bg-red-950/20 dark:text-red-400 font-sans">
            {verifyError}
          </div>
        )}

        {verifySuccess && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-950 dark:bg-green-950/20 dark:text-green-400 font-sans">
            {verifySuccess}
          </div>
        )}

        <form onSubmit={handleVerifySubmit} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-md space-y-6">
          
          {/* Full Name */}
          <div className="relative border border-neutral-200 dark:border-neutral-800 rounded-2xl px-4 py-2 bg-neutral-50 dark:bg-neutral-950/30">
            <label className="absolute -top-2.5 right-3 bg-white dark:bg-neutral-900 px-2 text-[11px] font-bold text-neutral-400 dark:text-neutral-500">
              الاسم الكامل <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={verifyFullname}
              onChange={(e) => setVerifyFullname(e.target.value)}
              required
              placeholder="ياسر الحميّقاني"
              className="w-full bg-transparent px-1 py-2 text-sm text-neutral-900 dark:text-neutral-100 outline-none font-semibold"
            />
          </div>

          {/* Identity details (Grid) */}
          <div className="grid gap-5 grid-cols-2">
            
            {/* Identity Number */}
            <div className="relative border border-neutral-200 dark:border-neutral-800 rounded-2xl px-4 py-2 bg-neutral-50 dark:bg-neutral-950/30 order-2">
              <label className="absolute -top-2.5 right-3 bg-white dark:bg-neutral-900 px-2 text-[11px] font-bold text-neutral-400 dark:text-neutral-500">
                رقم الهوية <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={verifyIdNumber}
                onChange={(e) => setVerifyIdNumber(e.target.value)}
                required
                placeholder="12356323"
                className="w-full bg-transparent px-1 py-2 text-sm text-neutral-900 dark:text-neutral-100 outline-none font-semibold"
              />
            </div>

            {/* Identity Type */}
            <div className="relative border border-neutral-200 dark:border-neutral-800 rounded-2xl px-4 py-2 bg-neutral-50 dark:bg-neutral-950/30 order-1">
              <label className="absolute -top-2.5 right-3 bg-white dark:bg-neutral-900 px-2 text-[11px] font-bold text-neutral-450 dark:text-neutral-500 font-sans">
                الهوية
              </label>
              <select
                value={verifyIdType}
                onChange={(e) => setVerifyIdType(e.target.value)}
                className="w-full bg-transparent px-1 py-2 text-sm text-neutral-900 dark:text-neutral-100 outline-none font-semibold appearance-none"
              >
                <option value="جواز سفر">جواز سفر</option>
                <option value="بطاقة شخصية">بطاقة شخصية</option>
              </select>
            </div>
            
          </div>

          {/* Issue place and date (Grid) */}
          <div className="grid gap-5 grid-cols-2">
            
            {/* Date of Issue */}
            <div className="relative border border-neutral-200 dark:border-neutral-800 rounded-2xl px-4 py-2 bg-neutral-50 dark:bg-neutral-950/30 order-2">
              <label className="absolute -top-2.5 right-3 bg-white dark:bg-neutral-900 px-2 text-[11px] font-bold text-neutral-400 dark:text-neutral-500">
                تاريخ الإصدار <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={verifyIssueDate}
                onChange={(e) => setVerifyIssueDate(e.target.value)}
                required
                placeholder="23/06/2026"
                className="w-full bg-transparent px-1 py-2 text-sm text-neutral-900 dark:text-neutral-100 outline-none font-semibold"
              />
            </div>

            {/* Place of Issue */}
            <div className="relative border border-neutral-200 dark:border-neutral-800 rounded-2xl px-4 py-2 bg-neutral-50 dark:bg-neutral-950/30 order-1">
              <label className="absolute -top-2.5 right-3 bg-white dark:bg-neutral-900 px-2 text-[11px] font-bold text-neutral-450 dark:text-neutral-500 font-sans">
                مكان الإصدار <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={verifyIssuePlace}
                onChange={(e) => setVerifyIssuePlace(e.target.value)}
                required
                placeholder="عدن"
                className="w-full bg-transparent px-1 py-2 text-sm text-neutral-900 dark:text-neutral-100 outline-none font-semibold"
              />
            </div>

          </div>

          {/* Front Side Image Upload */}
          <div className="relative border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 bg-neutral-50 dark:bg-neutral-950/30">
            <label className="absolute -top-2.5 right-3 bg-white dark:bg-neutral-900 px-2 text-[11px] font-bold text-neutral-400 dark:text-neutral-500">
              صورة الجهة الأمامية للهوية
            </label>
            <div className="flex flex-col items-center justify-center border border-neutral-300 dark:border-neutral-700 rounded-2xl p-6 bg-[#eaeaea] dark:bg-neutral-900/60 hover:border-violet-500 transition cursor-pointer relative min-h-[160px]">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setVerifyImage(file)
                    setVerifyImagePreview(URL.createObjectURL(file))
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              {verifyImagePreview ? (
                <img
                  src={verifyImagePreview}
                  alt="معاينة الهوية"
                  className="max-h-36 w-full object-contain rounded-xl"
                />
              ) : (
                <div className="flex flex-col items-center text-center space-y-2 text-neutral-400">
                  <svg className="w-12 h-12 text-[#c39c40]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs font-semibold text-neutral-500">اضغط لرفع الصورة من المعرض أو الكاميرا</span>
                </div>
              )}
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={verifyLoading}
            className="w-full rounded-2xl bg-[#c39c40] hover:bg-[#b08c35] text-white py-4 text-base font-bold shadow-lg transition disabled:opacity-50"
          >
            {verifyLoading ? 'جاري الإرسال...' : 'Confirm Account'}
          </button>

        </form>
      </div>
    )
  }

  // ponytail: Clear frontend and backend passenger sessions on logout
  const handleClientLogout = async () => {
    try {
      await fetch('/api/client/logout', {
        method: 'POST',
        headers: {
          'X-CSRF-Token': csrfToken,
        }
      })
    } catch (e) {
      // ignore
    }
    sessionStorage.removeItem('clientPhone')
    sessionStorage.removeItem('clientName')
    navigate('/')
  }

  const handleClientDeleteAccount = async () => {
    setDeletingAccount(true)
    setDeleteConfirmError('')
    try {
      const res = await fetch('/api/client/delete-account', {
        method: 'POST',
        headers: {
          'X-CSRF-Token': csrfToken,
        }
      })
      const data = await res.json()
      if (res.ok) {
        sessionStorage.removeItem('clientPhone')
        sessionStorage.removeItem('clientName')
        setShowDeleteConfirmModal(false)
        setShowUserDropdown(false)
        navigate('/')
      } else {
        setDeleteConfirmError(data.message || 'حدث خطأ أثناء حذف الحساب.')
      }
    } catch (e) {
      setDeleteConfirmError('حدث خطأ في الاتصال بالخادم.')
    } finally {
      setDeletingAccount(false)
    }
  }

  return (
    <main className="pt-[8ch] min-h-[calc(100vh-8ch)] bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 md:px-16 lg:px-28 py-12">
        
        {/* Top Header: Greeting, past bookings and user profile dropdown */}
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

            {/* Dropdown Menu */}
            {showUserDropdown && sessionStorage.getItem('clientPhone') && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl z-50 py-2 animate-fadeIn origin-top-right divide-y divide-neutral-100 dark:divide-neutral-800">
                {/* Account Details / Stats */}
                <div className="px-4 py-3 text-xs text-neutral-500 dark:text-neutral-400 space-y-1">
                  <div className="font-bold text-neutral-800 dark:text-neutral-200">معلومات الحساب</div>
                  <div>الجوال: <span className="font-mono text-neutral-700 dark:text-neutral-300">{sessionStorage.getItem('clientPhone')}</span></div>
                  <div>حالة التوثيق: <span className={`font-semibold ${verificationStatus === 'verified' ? 'text-green-600 dark:text-green-400' : verificationStatus === 'pending' ? 'text-amber-500' : 'text-red-500'}`}>
                    {verificationStatus === 'verified' ? 'موثق' : verificationStatus === 'pending' ? 'قيد المراجعة' : 'غير موثق'}
                  </span></div>
                </div>

                <div className="py-1">
                  {/* My Bookings */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserDropdown(false)
                      setShowMyBookings(true)
                      fetchMyBookings()
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-right text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition"
                  >
                    <svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    حجوزاتي
                  </button>
                  
                  {/* Logout */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserDropdown(false)
                      handleClientLogout()
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-right text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition"
                  >
                    <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    تسجيل الخروج
                  </button>
                </div>

                <div className="py-1">
                  {/* Delete Account */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserDropdown(false)
                      setShowDeleteConfirmModal(true)
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-right text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition"
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
                  fetchMyBookings()
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-violet-600 hover:bg-violet-700 px-5 py-2.5 text-xs font-semibold text-white shadow transition"
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
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-950 dark:bg-red-950/20 dark:text-red-400">
            {error}
          </div>
        )}

        {showVerificationForm ? (
          renderVerificationForm()
        ) : (
          <>
        {/* ==================== STEP 1: SEARCH FILTER FORM ==================== */}
        {bookingStep === 1 && (
          <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
            {/* Promo Image Slider */}
            <div className="relative rounded-3xl overflow-hidden h-44 sm:h-60 bg-slate-950 shadow-md">
              {promoSlides.map((slide, idx) => (
                <div
                  key={idx}
                  className={`absolute inset-0 transition-opacity duration-1000 ${
                    idx === currentPromoSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent z-10"></div>
                  <img src={slide.image} alt={slide.text} className="w-full h-full object-cover" />
                  <div className="absolute bottom-6 right-6 z-20 text-white font-extrabold text-sm sm:text-lg drop-shadow-md">
                    {slide.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Search Box Form */}
            <form onSubmit={handleSearch} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 shadow-md space-y-6">
              <h3 className="text-2xl font-black text-slate-800 dark:text-slate-200 border-b border-neutral-100 dark:border-neutral-800 pb-3">البحث عن رحلة</h3>
              
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-neutral-600 dark:text-neutral-400 mb-2">من (مدينة المغادرة)</label>
                  <select
                    value={searchOrigin}
                    onChange={(e) => setSearchOrigin(e.target.value)}
                    required
                    className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 px-4 py-3 text-neutral-900 dark:text-neutral-100 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900 font-semibold"
                  >
                    <option value="">اختر مدينة المغادرة</option>
                    {cityOptions.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-600 dark:text-neutral-400 mb-2">إلى (مدينة الوصول)</label>
                  <select
                    value={searchDestination}
                    onChange={(e) => setSearchDestination(e.target.value)}
                    required
                    className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 px-4 py-3 text-neutral-900 dark:text-neutral-100 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900 font-semibold"
                  >
                    <option value="">اختر مدينة الوصول</option>
                    {cityOptions.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Passengers Selection Box */}
              <div className="border border-neutral-200 dark:border-neutral-850 rounded-2xl p-4 bg-neutral-50 dark:bg-neutral-950/40 space-y-4">
                <span className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">عدد الركاب (Passengers)</span>
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex items-center justify-between flex-1 border-l sm:border-l border-neutral-200 dark:border-neutral-800 pl-4">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">البالغين (Adults)</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setSearchAdults(Math.max(1, searchAdults - 1))}
                        className="w-9 h-9 rounded-full border border-neutral-300 dark:border-neutral-700 flex items-center justify-center font-bold hover:bg-neutral-200 dark:hover:bg-neutral-800 transition"
                      >-</button>
                      <span className="font-extrabold text-base w-5 text-center">{searchAdults}</span>
                      <button
                        type="button"
                        onClick={() => setSearchAdults(searchAdults + 1)}
                        className="w-9 h-9 rounded-full border border-neutral-300 dark:border-neutral-700 flex items-center justify-center font-bold hover:bg-neutral-200 dark:hover:bg-neutral-800 transition"
                      >+</button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between flex-1 pr-0 sm:pr-4">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">الأطفال (Children)</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setSearchChildren(Math.max(0, searchChildren - 1))}
                        className="w-9 h-9 rounded-full border border-neutral-300 dark:border-neutral-700 flex items-center justify-center font-bold hover:bg-neutral-200 dark:hover:bg-neutral-800 transition"
                      >-</button>
                      <span className="font-extrabold text-base w-5 text-center">{searchChildren}</span>
                      <button
                        type="button"
                        onClick={() => setSearchChildren(searchChildren + 1)}
                        className="w-9 h-9 rounded-full border border-neutral-300 dark:border-neutral-700 flex items-center justify-center font-bold hover:bg-neutral-200 dark:hover:bg-neutral-800 transition"
                      >+</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Date Selection Box using DatePicker */}
              <div>
                <label className="block text-sm font-semibold text-neutral-600 dark:text-neutral-400 mb-2">تاريخ الرحلة</label>
                {availableDates.length === 0 ? (
                  <div className="text-sm text-neutral-500">لا توجد رحلات مُجدولة حالياً.</div>
                ) : (
                  <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 p-3">
                    <DatePicker 
                      availableDates={availableDates} 
                      value={searchDate} 
                      onChange={(date) => setSearchDate(date)} 
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={searching}
                className="w-full rounded-2xl bg-[#c39c40] hover:bg-[#b08c35] text-white py-4 text-base font-bold shadow-lg transition disabled:opacity-50"
              >
                {searching ? 'جاري البحث...' : 'بحث عن الرحلات'}
              </button>
            </form>
          </div>
        )}

        {/* ==================== STEP 2: SEARCH RESULTS ==================== */}
        {bookingStep === 2 && (
          <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
            {/* Header / Back Bar */}
            <div className="flex items-center gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 px-6 py-4 rounded-3xl shadow-sm">
              <button
                type="button"
                onClick={() => setBookingStep(1)}
                className="w-9 h-9 rounded-full border border-neutral-300 dark:border-neutral-700 flex items-center justify-center text-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition font-bold"
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
                  className="bg-[#c39c40] hover:bg-[#b08c35] text-white px-5 py-2 text-xs font-bold rounded-xl transition"
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
                  className="bg-[#c39c40] hover:bg-[#b08c35] text-white px-5 py-2 text-xs font-bold rounded-xl transition"
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
                            className="bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 hover:border-slate-400 text-slate-700 dark:text-slate-300 px-4 py-2 text-xs font-bold rounded-xl transition"
                          >
                            تفاصيل الرحلة
                          </button>
                          {verificationStatus === 'verified' ? (
                            <button
                              type="button"
                              onClick={() => handleSelectSchedule(s)}
                              className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 text-xs font-bold rounded-xl transition"
                            >
                              حجز
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setShowVerificationForm(true)}
                              className="bg-[#c39c40] hover:bg-[#b08c35] text-white px-5 py-2 text-xs font-bold rounded-xl transition"
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
        )}

        {/* ==================== STEP 3: TRIP DETAILS, SEATS MAP & PASSPORT FORM ==================== */}
        {bookingStep === 3 && (
          <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
            
            {/* Header / Back Bar */}
            <div className="flex items-center gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 px-6 py-4 rounded-3xl shadow-sm">
              <button
                type="button"
                onClick={() => {
                  setLastTicket(null)
                  setSuccessMessage('')
                  setSelectedSeats([])
                  setBookingStep(2)
                }}
                className="w-9 h-9 rounded-full border border-neutral-300 dark:border-neutral-700 flex items-center justify-center text-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition font-bold"
              >
                ➔
              </button>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">تفاصيل الرحلة وحجز المقعد</h2>
            </div>

            {/* Ticket Success Confirmation Block */}
            {lastTicket ? (
              <div className="bg-white dark:bg-neutral-900 border border-green-200 dark:border-green-950 p-8 rounded-3xl space-y-5 shadow-lg text-center max-w-xl mx-auto">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-950 text-green-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">✓</div>
                <h3 className="text-2xl font-black text-green-600">تم حجز تذكرتكم بنجاح!</h3>
                <div className="space-y-2">
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">أرقام التذاكر الخاصة بكم هي:</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {(Array.isArray(lastTicket) ? lastTicket : [lastTicket]).map((t, idx) => (
                      <span key={idx} className="font-mono font-black text-sm text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded border border-neutral-200 dark:border-neutral-750">
                        {t.ticketNumber} ({t.passengerName} - مقعد {t.seat})
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-neutral-500 leading-5">تم تفعيل التذاكر وربطها ببيانات السفر المحددة. يمكنك طباعة الفواتير أو التذاكر الآن.</p>
                
                <div className="flex gap-3 justify-center pt-4">
                  <button
                    type="button"
                    onClick={() => openPrintWindow(lastTicket)}
                    className="inline-flex items-center gap-2 rounded-full bg-green-600 hover:bg-green-700 px-8 py-3 text-sm font-bold text-white shadow-lg transition"
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
                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-8 py-3 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800 transition"
                  >
                    الرجوع للرئيسية
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
                {/* Seat Selector & Passenger Form */}
                <section className="space-y-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 shadow-sm">
                  
                  {/* Top seats visual image */}
                  <div className="relative rounded-2xl overflow-hidden h-40 bg-slate-900 border border-neutral-100 dark:border-neutral-800">
                    <img src="/service-slide-2.jpg" alt="مقاعد مريحة" className="w-full h-full object-cover object-center opacity-85" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                    <div className="absolute bottom-4 right-4 text-white space-y-1">
                      <h4 className="text-base font-bold">باص شركة {company}</h4>
                      <p className="text-xs text-neutral-300">أحدث الحافلات المجهزة لسفر مريح</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs text-neutral-500 border-b border-neutral-100 dark:border-neutral-850 pb-2">
                    <span className="flex items-center gap-1 font-semibold text-violet-600 bg-violet-50 dark:bg-violet-950/20 px-2.5 py-0.5 rounded">
                      🚌 نوع الحافلة: {selectedSchedule?.busType}
                    </span>
                    <div className="flex gap-4">
                      <span>⚡ شحن USB</span>
                      <span>📶 واي فاي Wifi</span>
                    </div>
                  </div>

                  {/* Booking Details Form */}
                  <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* Seating Map */}
                    {renderSeatGrid()}

                    {selectedSeats.length > 0 && (
                      <p className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-bold text-violet-700 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-300 text-center">
                        المقاعد المحددة حالياً ({selectedSeats.length} من {totalPassengers}): {selectedSeats.join(', ')}
                      </p>
                    )}

                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 border-b border-neutral-100 dark:border-neutral-850 pb-2">معلومات المسافرين</h3>

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
                              <h4 className="text-sm font-bold text-violet-600 dark:text-violet-400">
                                المسافر {index + 1} ({passengerType === 'child' ? 'طفل' : 'بالغ'}) - {seatNum ? `المقعد: ${seatNum}` : 'يرجى اختيار المقعد من الخريطة'}
                              </h4>
                              <span className="text-xs font-bold text-green-600 dark:text-green-400 font-sans">
                                السعر: {price} YER
                              </span>
                            </div>
                            
                            <div>
                              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">اسم المسافر (ثلاثي أو رباعي) <span className="text-red-500">*</span></label>
                              <input
                                type="text"
                                value={passenger.name}
                                onChange={(e) => {
                                  const val = e.target.value
                                  setPassengersDetails(prev => prev.map((p, idx) => idx === index ? { ...p, name: val } : p))
                                }}
                                required
                                minLength={3}
                                maxLength={100}
                                pattern="[\u0600-\u06FF\u0621-\u064A\u0660-\u0669A-Za-z ]+"
                                title="الاسم يجب أن يحتوي على حروف ومسافات فقط ويكون بين 3 و100 حرف."
                                placeholder={`اكتب اسم المسافر ${index + 1}`}
                                className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 py-2.5 text-neutral-900 dark:text-neutral-100 outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-100 font-semibold text-sm"
                              />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                              <div>
                                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">رقم الجواز <span className="text-red-500">*</span></label>
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
                                  className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 py-2.5 text-neutral-900 dark:text-neutral-100 outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-100 font-semibold text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">العمر / سنة الميلاد <span className="text-red-500">*</span></label>
                                <input
                                  type="text"
                                  value={passenger.dob}
                                  onChange={(e) => {
                                    const val = e.target.value
                                    setPassengersDetails(prev => prev.map((p, idx) => idx === index ? { ...p, dob: val } : p))
                                  }}
                                  required
                                  placeholder="مثال: 1995"
                                  className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 py-2.5 text-neutral-900 dark:text-neutral-100 outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-100 font-semibold text-sm"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">صورة جواز السفر <span className="text-red-500">*</span></label>
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
                                <span className="text-xs text-neutral-500">JPG أو PNG أو WEBP أقل من 5 ميجابايت.</span>
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

                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 border-b border-neutral-100 dark:border-neutral-850 pb-2">بيانات الاتصال والدفع</h3>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">رقم الجوال</label>
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
                        className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 px-4 py-3 text-neutral-900 dark:text-neutral-100 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">رقم الحوالة المالية / إشعار الدفع (اختياري)</label>
                      <input
                        type="text"
                        value={paymentRef}
                        onChange={(e) => setPaymentRef(e.target.value)}
                        placeholder="أدخل رقم الحوالة أو المرجع المالي"
                        className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 px-4 py-3 text-neutral-900 dark:text-neutral-100 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">صورة إشعار الدفع / الحوالة (اختياري)</label>
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
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">ارفع صورة إيصال الدفع أو التحويل المالي لتأكيد الحجز.</p>
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
                        className="inline-flex items-center justify-center rounded-full bg-violet-600 px-8 py-3 text-white font-semibold shadow-lg shadow-violet-200/30 hover:bg-violet-700 transition"
                        disabled={status === 'sending'}
                      >
                        {status === 'sending' ? 'جاري الإرسال...' : 'تأكيد وإرسال الحجز'}
                      </button>
                    </div>
                  </form>
                </section>

                {/* Right info Sidebar matching Screen 3 */}
                <aside className="space-y-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm">
                  
                  {/* Seats availability */}
                  <div className="rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-850 p-5 space-y-3">
                    <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-200 border-b border-neutral-200 dark:border-neutral-800 pb-2">المقاعد والأسعار</h3>
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

                  {/* Pricing Info */}
                  <div className="rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-850 p-5 space-y-4">
                    <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-200 border-b border-neutral-200 dark:border-neutral-800 pb-2">تفاصيل الأسعار</h3>
                    
                    {searchAdults > 0 && (
                      <div className="flex justify-between items-center text-xs">
                        <div>
                          <span className="block font-bold">الكبار ({searchAdults} × Adults)</span>
                          <span className="text-neutral-400">سياحي ({selectedSchedule.busType})</span>
                        </div>
                        <span className="font-extrabold text-green-600 dark:text-green-400 font-sans">
                          {searchAdults * (selectedSchedule.priceAdult || selectedSchedule.price || 35000)} YER
                        </span>
                      </div>
                    )}

                    {searchChildren > 0 && (
                      <div className="flex justify-between items-center text-xs border-t border-neutral-200 dark:border-neutral-800 pt-3">
                        <div>
                          <span className="block font-bold">الصغار ({searchChildren} × Children)</span>
                          <span className="text-neutral-400">سياحي ({selectedSchedule.busType})</span>
                        </div>
                        <span className="font-extrabold text-green-600 dark:text-green-400 font-sans">
                          {searchChildren * (selectedSchedule.priceChild || selectedSchedule.price || 35000)} YER
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-sm border-t border-neutral-200 dark:border-neutral-800 pt-3 font-bold">
                      <span className="text-slate-800 dark:text-slate-200">إجمالي السعر ({totalPassengers} مسافرين)</span>
                      <span className="text-lg text-emerald-600 dark:text-emerald-400 font-sans">
                        {(searchAdults * (selectedSchedule.priceAdult || selectedSchedule.price || 35000) + searchChildren * (selectedSchedule.priceChild || selectedSchedule.price || 35000))} YER
                      </span>
                    </div>
                  </div>

                  {/* Route Overview */}
                  <div className="rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-850 p-5 space-y-3">
                    <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-200 border-b border-neutral-200 dark:border-neutral-800 pb-2">معلومات الرحلة</h3>
                    <div className="text-xs space-y-2">
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
      {showMyBookings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">حجوزاتي السابقة</h3>
              <button
                type="button"
                onClick={() => setShowMyBookings(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
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
                  <span className="mt-4 text-sm text-neutral-500">جاري تحميل الحجوزات...</span>
                </div>
              ) : bookingsError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-red-600 text-sm">
                  {bookingsError}
                </div>
              ) : myBookings.length === 0 ? (
                <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
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
                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${statusBadge}`}>
                              {isConfirmed ? 'مؤكد' : isPending ? 'معلق' : 'ملغي'}
                            </span>
                          </div>
                          
                          <div className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                            {b.origin} ← {b.destination}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-neutral-600 dark:text-neutral-400">
                            <div>التاريخ: <span className="font-medium">{b.travel_date}</span></div>
                            <div>الشركة: <span className="font-medium">{b.company}</span></div>
                            <div>المقعد: <span className="font-semibold text-violet-600 dark:text-violet-400">{b.seat}</span></div>
                            <div>الباص: <span className="font-medium">{b.bus_type}</span></div>
                            <div className="col-span-2">الاسم: <span className="font-medium">{b.passenger_name}</span></div>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
                          <span className="text-sm font-bold text-green-600 dark:text-green-400">
                            {b.price} ريال
                          </span>
                          
                          <button
                            type="button"
                            onClick={() => openPrintWindow(ticketData)}
                            className="inline-flex items-center gap-1 rounded-xl bg-violet-600 px-3.5 py-1.5 text-xs text-white font-semibold hover:bg-violet-700 transition"
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
                className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-5 py-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-6 text-right" dir="rtl">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center font-bold text-lg">
                ⚠️
              </div>
              <div>
                <h3 className="text-base font-bold">حذف الحساب نهائياً</h3>
                <p className="text-xs text-red-500 font-semibold">تحذير: هذا الإجراء لا يمكن التراجع عنه!</p>
              </div>
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              هل أنت متأكد من رغبتك في حذف حسابك؟ سيؤدي هذا الإجراء إلى حذف جميع بياناتك الشخصية، طلبات توثيق الحساب، وحجوزات الرحلات المرتبطة برقم جوالك بشكل كامل ونهائي من النظام.
            </p>

            {deleteConfirmError && (
              <div className="text-xs text-red-600 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-950 p-3 rounded-xl">
                {deleteConfirmError}
              </div>
            )}

            <div className="flex justify-start gap-3">
              <button
                type="button"
                disabled={deletingAccount}
                onClick={handleClientDeleteAccount}
                className="inline-flex items-center justify-center rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-red-400 px-4 py-2.5 text-xs font-bold text-white shadow transition"
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
                className="inline-flex items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-50 px-4 py-2.5 text-xs font-bold text-neutral-700 dark:text-neutral-300 transition"
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
