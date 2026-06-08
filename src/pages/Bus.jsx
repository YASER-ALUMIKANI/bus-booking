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
  const [company, setCompany] = useState('البركة')
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [ticketData, setTicketData] = useState(null)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const storedName = localStorage.getItem('clientName')
    const storedPhone = localStorage.getItem('clientPhone')
    if (storedName) setPassengerName(storedName)
    if (storedPhone) setPhone(storedPhone)
  }, [])

  const openPrintWindow = (ticket) => {
    if (typeof window === 'undefined') return
    const printWindow = window.open('', '_blank', 'width=900,height=700')
    if (!printWindow) return

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
              <div class="item"><span class="label">رقم التذكرة</span><span class="value">${ticket.ticketNumber}</span></div>
              <div class="item"><span class="label">شركة النقل</span><span class="value">${ticket.company}</span></div>
              <div class="item"><span class="label">اسم المسافر</span><span class="value">${ticket.passengerName}</span></div>
              <div class="item"><span class="label">رقم الجوال</span><span class="value">${ticket.phone}</span></div>
              <div class="item"><span class="label">تاريخ المغادرة</span><span class="value">${ticket.travelDate}</span></div>
              <div class="item" style="grid-column: span 2;"><span class="label">الرحلة</span><span class="value">من ${ticket.origin} إلى ${ticket.destination}</span></div>
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
      company,
      origin,
      destination,
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

      const ticket = {
        ticketNumber: `T-${Date.now().toString().slice(-6)}`,
        passengerName,
        phone,
        passport,
        travelDate,
        company,
        origin,
        destination,
      }
      setStatus('success')
      setTicketData(ticket)
      openPrintWindow(ticket)
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
<div className="grid gap-5 md:grid-cols-[1fr_200px] items-start">

  <div>
    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
      تاريخ المغادرة
    </label>

    <input
      type="date"
      value={travelDate}
      onChange={(e) => setTravelDate(e.target.value)}
      required
      className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 px-4 py-3 text-neutral-900 dark:text-neutral-100 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900"
    />
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

              {ticketData && (
                <>
                  <style>{`@media print { body * { visibility: hidden; } .print-area, .print-area * { visibility: visible; } .print-area { position: absolute; top: 0; left: 0; width: 100%; background: white; } .no-print { display: none !important; } }`}</style>
                  <div className="print-area rounded-3xl border border-violet-200 dark:border-neutral-800 bg-violet-50 dark:bg-neutral-950 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-semibold">تذكرة مبدئية</h3>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">احفظ أو اطبع هذه التذكرة بعد تأكيد الحجز.</p>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 p-4">
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">رقم التذكرة</p>
                        <p className="text-lg font-semibold">{ticketData.ticketNumber}</p>
                      </div>
                      <div className="rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 p-4">
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">شركة النقل</p>
                        <p className="text-lg font-semibold">{ticketData.company}</p>
                      </div>
                      <div className="rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 p-4">
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">اسم المسافر</p>
                        <p className="text-lg font-semibold">{ticketData.passengerName}</p>
                      </div>
                      <div className="rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 p-4">
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">رقم الجوال</p>
                        <p className="text-lg font-semibold">{ticketData.phone}</p>
                      </div>
                      <div className="rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 p-4">
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">تاريخ المغادرة</p>
                        <p className="text-lg font-semibold">{ticketData.travelDate}</p>
                      </div>
                      <div className="rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 p-4 sm:col-span-2">
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">الرحلة</p>
                        <p className="text-lg font-semibold">من {ticketData.origin} إلى {ticketData.destination}</p>
                      </div>
                    </div>
                  </div>
                </>
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
