import React, { useEffect, useState } from 'react'

const cityOptions = [
 'البيضاء ',
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

const Bus = () => {
  const [passengerName, setPassengerName] = useState('')
  const [phone, setPhone] = useState('')
  const [passport, setPassport] = useState('')
  const [travelDate, setTravelDate] = useState('')
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const storedName = localStorage.getItem('clientName')
    const storedPhone = localStorage.getItem('clientPhone')
    if (storedName) setPassengerName(storedName)
    if (storedPhone) setPhone(storedPhone)
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (origin === destination) {
      setError('يجب أن تكون الوجهة مختلفة عن نقطة الانطلاق.')
      return
    }
    setStatus('sending')
    setError('')

    const payload = {
      passengerName,
      phone,
      passport,
      travelDate,
      origin,
      destination,
      guest: true,
    }

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'فشل إرسال الطلب. حاول مرة أخرى.')
      }

      setStatus('success')
      setPassport('')
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
          الرجاء تعبئة النموذج التالي كمستخدم ضيف. سيتم استخدام بيانات العميل المحفوظة من صفحة الدخول تلقائياً.
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
                  placeholder="اكتب رقم الجواز"
                  className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 px-4 py-3 text-neutral-900 dark:text-neutral-100 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">تاريخ الحجز</label>
                <input
                  type="date"
                  value={travelDate}
                  onChange={(e) => setTravelDate(e.target.value)}
                  required
                  className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 px-4 py-3 text-neutral-900 dark:text-neutral-100 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900"
                />
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

              {status === 'success' && (
                <p className="text-sm text-green-700 dark:text-green-300">تم إرسال الطلب بنجاح. سيصل إشعار إلى المسؤول.</p>
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
            <h2 className="text-2xl font-semibold">معلومات الضيف</h2>
            <p className="text-neutral-600 dark:text-neutral-300 leading-7">
              بيانات العميل ستظهر تلقائياً هنا بعد تسجيل الدخول من الصفحة الرئيسية. إذا لم يتم إدخالها بعد، يمكنك تعبئتها يدوياً.
            </p>
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
