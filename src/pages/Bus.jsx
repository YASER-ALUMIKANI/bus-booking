import React, { useEffect, useState } from 'react'
import DatePicker from '../components/DatePicker/DatePicker'
import { getCsrfToken } from '../utils/csrf'

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
]

const companyOptions = ['البركة', 'المتصدر', 'البراق']


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

  const openPrintWindow = (ticket) => {
    if (typeof window === 'undefined') return
    const printWindow = window.open('', '_blank', 'width=900,height=700')
    if (!printWindow) return

    const escapeHtml = (str) =>
      String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')

    const safeTicketNumber = escapeHtml(ticket.ticketNumber)
    const safeCompany = escapeHtml(ticket.company)
    const safePassengerName = escapeHtml(ticket.passengerName)
    const safePhone = escapeHtml(ticket.phone)
    const safeTravelDate = escapeHtml(ticket.travelDate)
    const safeOrigin = escapeHtml(ticket.origin)
    const safeDestination = escapeHtml(ticket.destination)

    const html = `
      <html lang="ar">
      <head>
        <meta charset="UTF-8" />
        <title>تذكرة مبدئية</title>
        <style>
          body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; direction: rtl; background: #f3f2ff; color: #111827; }
          .page { padding: 2rem; max-width: 840px; margin: auto; }
          .card { background: #ffffff; border-radius: 1.5rem; padding: 2rem; box-shadow: 0 20px 45px rgba(15, 23, 42, 0.1); }
          .title { font-size: 1.9rem; margin-bottom: 1.5rem; font-weight: 700; }
          .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
          .item { padding: 1.2rem; border: 1px solid #e5e7eb; border-radius: 1rem; background: #fafafa; }
          .label { display: block; margin-bottom: 0.5rem; color: #6b7280; font-size: 0.9rem; }
          .value { font-size: 1.15rem; font-weight: 700; word-break: break-word; }
          .footer { margin-top: 1.75rem; text-align: center; }
          .print-button { padding: 0.95rem 1.4rem; background: #7c3aed; border: none; border-radius: 9999px; color: white; font-size: 1rem; font-weight: 700; cursor: pointer; }
          @media print { .print-button { display: none; } body { background: #fff; } }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="card">
            <div class="title">تذكرة مبدئية</div>
            <div class="grid">
              <div class="item"><span class="label">رقم التذكرة</span><span class="value">${safeTicketNumber}</span></div>
              <div class="item"><span class="label">شركة النقل</span><span class="value">${safeCompany}</span></div>
              <div class="item"><span class="label">اسم المسافر</span><span class="value">${safePassengerName}</span></div>
              <div class="item"><span class="label">رقم الجوال</span><span class="value">${safePhone}</span></div>
              <div class="item"><span class="label">تاريخ المغادرة</span><span class="value">${safeTravelDate}</span></div>
              <div class="item" style="grid-column: span 2;"><span class="label">الرحلة</span><span class="value">من ${safeOrigin} إلى ${safeDestination}</span></div>
            </div>
            <div class="footer">
              <button class="print-button" onclick="window.print()">طباعة هذه الصفحة</button>
            </div>
          </div>
        </div>
      </body>
      </html>
    `

    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
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
    if (!companyOptions.includes(company)) {
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
    if (!availableDateStrings.includes(travelDate)) {
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
                        <DatePicker availableDates={availableDates} value={travelDate} onChange={setTravelDate} />
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

                    <label className="inline-flex items-center space-x-3 rtl:space-x-reverse">
                      <input
                        type="radio"
                        name="company"
                        value="البركة"
                        checked={company === 'البركة'}
                        onChange={() => setCompany('البركة')}
                        className="form-radio text-violet-600"
                      />
                      <span className="text-neutral-700 dark:text-neutral-300">
                        البركة
                      </span>
                    </label>

                    <label className="inline-flex items-center space-x-3 rtl:space-x-reverse">
                      <input
                        type="radio"
                        name="company"
                        value="المتصدر"
                        checked={company === 'المتصدر'}
                        onChange={() => setCompany('المتصدر')}
                        className="form-radio text-violet-600"
                      />
                      <span className="text-neutral-700 dark:text-neutral-300">
                        المتصدر
                      </span>
                    </label>

                    <label className="inline-flex items-center space-x-3 rtl:space-x-reverse">
                      <input
                        type="radio"
                        name="company"
                        value="البراق"
                        checked={company === 'البراق'}
                        onChange={() => setCompany('البراق')}
                        className="form-radio text-violet-600"
                      />
                      <span className="text-neutral-700 dark:text-neutral-300">
                        البراق
                      </span>
                    </label>

                  </div>
                </div>

              </div>
          

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
