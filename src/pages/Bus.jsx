import React, { useEffect, useState } from 'react'
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
  const [passengerName, setPassengerName] = useState('')
  const [phone, setPhone] = useState('')
  const [passport, setPassport] = useState('')
  const [passportImage, setPassportImage] = useState(null)
  const [passportPreview, setPassportPreview] = useState('')
  const [travelDate, setTravelDate] = useState('')
  const [availableDates, setAvailableDates] = useState([])
  const [company, setCompany] = useState('البركة')
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [seat, setSeat] = useState(null)
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

  useEffect(() => {
    const storedName = sessionStorage.getItem('clientName')
    const storedPhone = sessionStorage.getItem('clientPhone')
    if (storedName) setPassengerName(storedName)
    if (storedPhone) setPhone(storedPhone)
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

  const uniqueCompanies = [...new Set(availableDates.map(d => d.company))].filter(Boolean)
  const activeCompanies = uniqueCompanies.length > 0 ? uniqueCompanies : companyOptions
  const filteredDates = availableDates.filter((d) => d.company === company)

  const selectedSchedule = availableDates.find(
    (d) => d.company === company && d.travelDate === travelDate
  )

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
  }, [travelDate, company, availableDates])

  useEffect(() => {
    if (seat && bookedSeats.includes(seat)) {
      setSeat(null)
    }
  }, [bookedSeats, seat])

  const renderSeatButton = (seatNum) => {
    const isBooked = bookedSeats.includes(seatNum)
    const isSelected = seat === seatNum
    
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
        onClick={() => setSeat(seatNum)}
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
                  {/* Column 1: Right Seat (rendered rightmost in RTL) */}
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
                  {/* Column 1: Window Right (rendered rightmost in RTL) */}
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
    const file = event.target.files?.[0]
    if (!file) {
      setPassportImage(null)
      setPassportPreview('')
      return
    }
    setPassportImage(file)
    setPassportPreview(URL.createObjectURL(file))
  }


  const handleSubmit = async (event) => {
    event.preventDefault()
    setSuccessMessage('')
    const namePattern = /^[\u0600-\u06FF\u0621-\u064A\u0660-\u0669A-Za-z ]{3,100}$/
    const phonePattern = /^[0-9]{7,15}$/
    const passportPattern = /^[A-Za-z0-9-]{5,20}$/

    const availableDateStrings = availableDates.map((d) => {
      const value = d && (d.travelDate || d)
      return typeof value === 'string' ? value.trim() : ''
    }).filter(Boolean)

    if (!namePattern.test(passengerName.trim())) {
      setError('اسم المسافر غير صالح. استخدم حروفاً ومسافات فقط، بين 3 و100 حرف.')
      return
    }
    if (!phonePattern.test(phone.trim())) {
      setError('رقم الجوال غير صالح. يجب أن يحتوي على 7 إلى 15 رقماً.')
      return
    }
    if (!passportPattern.test(passport.trim())) {
      setError('رقم الجواز غير صالح. استخدم أحرفاً وأرقاماً فقط، بين 5 و20 حرفاً.')
      return
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
    if (!passportImage) {
      setError('يرجى رفع صورة جواز السفر.')
      return
    }
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedImageTypes.includes(passportImage.type)) {
      setError('يُسمح فقط بصور الجواز بصيغة JPG أو PNG أو WEBP.')
      return
    }
    if (passportImage.size > 5 * 1024 * 1024) {
      setError('حجم الصورة كبير جدًا. الرجاء اختيار صورة أقل من 5 ميجابايت.')
      return
    }
    if (!seat) {
      setError('يرجى اختيار رقم المقعد من حافلة المقاعد.')
      return
    }
    if (!dob || !dob.trim()) {
      setError('يرجى إدخال العمر / سنة الميلاد.')
      return
    }

    setStatus('sending')
    setError('')

    const formData = new FormData()
    formData.append('passengerName', passengerName.trim())
    formData.append('phone', phone.trim())
    formData.append('passport', passport.trim())
    formData.append('travelDate', travelDate)
    formData.append('company', company)
    formData.append('origin', origin.trim())
    formData.append('destination', destination.trim())
    formData.append('passportImage', passportImage)
    formData.append('seat', seat)
    formData.append('dob', dob.trim())

    try {
      if (!csrfToken) {
        setError('فشل الحصول على رمز CSRF. حاول إعادة تحميل الصفحة.')
        setStatus('')
        return
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
        throw new Error(data.message || 'فشل إرسال الطلب. حاول مرة أخرى.')
      }

      const data = await response.json()
      const ticket = {
        ticketNumber: data.ticketNumber || `T-${crypto.randomUUID().slice(0,8)}`,
        passengerName,
        phone,
        passport,
        travelDate,
        company,
        origin,
        destination,
        seat,
        dob: dob.trim(),
        tripTime,
        arrivalTime,
        dayOfWeek: data.dayOfWeek || 'الاثنين',
        issuingOffice,
        price: data.price || selectedSchedule?.price || '35000',
        notes,
        busType: data.busType || selectedSchedule?.busType || 'VIP'
      }
      setStatus('success')
      setSuccessMessage(`تم حفظ الحجز بنجاح. رقم التذكرة: ${ticket.ticketNumber}`)
      openPrintWindow(ticket)
      setPassport('')
      setPassportImage(null)
      setPassportPreview('')
      setTravelDate('')
      setOrigin('')
      setDestination('')
      setSeat(null)
      setDob('1985')
    } catch (err) {
      setError(err.message)
      setStatus('')
    }
  }

  return (
    <main className="pt-[8ch] min-h-[calc(100vh-8ch)] bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <div className="max-w-6xl mx-auto px-4 md:px-16 lg:px-28 py-16">
        <h1 className="text-4xl font-bold mb-4">حجز تذكرة حافلة</h1>
        <p className="text-lg leading-8 text-neutral-600 dark:text-neutral-300 mb-8">
          الرجاء تعبئة النموذج التالي لحجز تذكرة الحافلة. سيتم حفظ التاريخ تلقائياً عند تأكيد الحجز.
        </p>

        <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          <section className="space-y-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 shadow-sm">
            <h2 className="text-2xl font-semibold">نموذج الحجز</h2>
            <form onSubmit={handleSubmit} className="space-y-5">

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">اسم المسافر</label>
                <input
                  type="text"
                  value={passengerName}
                  onChange={(e) => setPassengerName(e.target.value)}
                  required
                  minLength={3}
                  maxLength={100}
                  pattern="[\u0600-\u06FF\u0621-\u064A\u0660-\u0669A-Za-z ]+"
                  title="الاسم يجب أن يحتوي على حروف ومسافات فقط ويكون بين 3 و100 حرف."
                  placeholder="اكتب اسم المسافر"
                  className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 px-4 py-3 text-neutral-900 dark:text-neutral-100 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900"
                />
              </div>

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

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">رقم الجواز</label>
                  <input
                    type="text"
                    value={passport}
                    onChange={(e) => setPassport(e.target.value)}
                    required
                    minLength={5}
                    maxLength={20}
                    pattern="^[A-Za-z0-9-]{5,20}$"
                    title="رقم الجواز يجب أن يحتوي على أحرف أو أرقام أو شرطات فقط، وطوله بين 5 و20 حرفاً."
                    placeholder="اكتب رقم الجواز"
                    className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 px-4 py-3 text-neutral-900 dark:text-neutral-100 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">العمر / سنة الميلاد</label>
                  <input
                    type="text"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    required
                    placeholder="مثال: 1995"
                    className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 px-4 py-3 text-neutral-900 dark:text-neutral-100 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">صورة جواز السفر</label>
                <div className="space-y-3">
                  <label htmlFor="passportImage" className="inline-flex items-center justify-center rounded-full bg-violet-600 px-4 py-3 text-white font-semibold shadow-sm hover:bg-violet-700 transition cursor-pointer">
                    اختر صورة جواز السفر
                  </label>
                  <input
                    id="passportImage"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePassportImageChange}
                    className="sr-only"
                  />
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">يمكنك رفع صورة من المعرض أو التقاطها مباشرة من الكاميرا.</p>
                  {passportPreview && (
                    <img
                      src={passportPreview}
                      alt="معاينة جواز السفر"
                      className="mt-3 h-40 w-full max-w-xs rounded-2xl object-cover border border-neutral-200 dark:border-neutral-800"
                    />
                  )}
                </div>
              </div>
<div className="grid gap-5 md:grid-cols-[1fr_200px] items-start">

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">تاريخ المغادرة</label>
                  {availableDates.length === 0 ? (
                    <div className="text-sm text-neutral-500">لا توجد رحلات مُجدولة حالياً.</div>
                  ) : (
                    <>
                      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 p-3">
                        <DatePicker availableDates={filteredDates} value={travelDate} onChange={setTravelDate} />
                      </div>
                      {travelDate ? (
                        <p className="mt-3 text-sm text-neutral-700 dark:text-neutral-300">
                          التاريخ المحدد: <span className="font-semibold">{new Date(travelDate).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        </p>
                      ) : (
                        <p className="mt-3 text-sm text-neutral-500">انقر على أي تاريخ مفعّل لتحديده.</p>
                      )}
                    </>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    شركة النقل
                  </label>

                  <div className="flex flex-col space-y-2 bg-white dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800 p-3">
                    {activeCompanies.map((c) => (
                      <label key={c} className="inline-flex items-center space-x-3 rtl:space-x-reverse cursor-pointer">
                        <input
                          type="radio"
                          name="company"
                          value={c}
                          checked={company === c}
                          onChange={() => setCompany(c)}
                          className="form-radio text-violet-600"
                        />
                        <span className="text-neutral-700 dark:text-neutral-300">
                          {c}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

              </div>

              {selectedSchedule && (
                <div className="grid gap-4 grid-cols-2 md:grid-cols-5 p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                  <div>
                    <span className="block text-xs text-neutral-500 dark:text-neutral-400">وقت الرحلة</span>
                    <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">{tripTime}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-neutral-500 dark:text-neutral-400">وقت الحضور</span>
                    <span className="text-sm font-semibold text-red-600 dark:text-red-400">{arrivalTime}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-neutral-500 dark:text-neutral-400">مكتب الإصدار</span>
                    <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">{issuingOffice}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-neutral-500 dark:text-neutral-400">السعر</span>
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">{selectedSchedule.price} ريال</span>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <span className="block text-xs text-neutral-500 dark:text-neutral-400">نقطة الركوب</span>
                    <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">{notes}</span>
                  </div>
                </div>
              )}

              {renderSeatGrid()}
          

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">من</label>
                  <select
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    required
                    className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 px-4 py-3 text-neutral-900 dark:text-neutral-100 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900"
                  >
                    <option value="">اختر المدينة</option>
                    {cityOptions.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">إلى</label>
                  <select
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    required
                    className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 px-4 py-3 text-neutral-900 dark:text-neutral-100 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900"
                  >
                    <option value="">اختر المدينة</option>
                    {cityOptions.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}

              {successMessage && (
                <p className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-200">
                  {successMessage}
                </p>
              )}


              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-violet-600 px-8 py-3 text-white font-semibold shadow-lg shadow-violet-200/30 hover:bg-violet-700 transition"
                disabled={status === 'sending'}
              >
                {status === 'sending' ? 'جاري الإرسال...' : 'إرسال الحجز'}
              </button>
            </form>
          </section>

          <aside className="space-y-4 bg-violet-50 dark:bg-neutral-900/80 border border-violet-200 dark:border-neutral-800 rounded-3xl p-8">
            <div className="rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 p-5">
              <h3 className="text-lg font-semibold mb-3">مدن متاحة</h3>
              <ul className="space-y-2 text-neutral-600 dark:text-neutral-400 list-disc list-inside">
                <li>صنعاء</li>
                <li>عدن</li>
                <li>تعز</li>
                <li>الحديدة</li>
                <li>الرياض</li>
                <li>جدة</li>
                <li>الدمام</li>
                <li>أبها</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}

export default Bus
