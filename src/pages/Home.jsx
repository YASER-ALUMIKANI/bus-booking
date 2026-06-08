import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const Home = () => {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [status, setStatus] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const storedName = sessionStorage.getItem('clientName') || ''
    const storedPhone = sessionStorage.getItem('clientPhone') || ''
    setName(storedName)
    setPhone(storedPhone)
  }, [])

  const handleSubmit = (event) => {
    event.preventDefault()
    sessionStorage.setItem('clientName', name)
    sessionStorage.setItem('clientPhone', phone)
    setStatus('saved')
    navigate('/bus')
  }

  return (
    <main className="pt-[8ch] min-h-[calc(100vh-8ch)] bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <div className="max-w-6xl mx-auto px-4 md:px-16 lg:px-28 py-16">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr] items-start">
          <section className="space-y-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">دخول العميل</h1>
              <p className="text-lg leading-8 text-neutral-600 dark:text-neutral-300">
                أدخل اسم العميل ورقم الجوال هنا، وسيتم استخدام هذه البيانات تلقائياً في نموذج الحجز.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 shadow-sm">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">اسم العميل</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="أدخل اسم العميل"
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

              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-violet-600 px-8 py-3 text-white font-semibold shadow-lg shadow-violet-200/30 hover:bg-violet-700 transition"
              >
                اذهب إلى نموذج الحجز
              </button>

              {status === 'saved' && (
                <p className="text-sm text-green-700 dark:text-green-300">تم حفظ بيانات العميل بنجاح. الانتقال إلى نموذج الحجز...</p>
              )}
            </form>
          </section>

          <aside className="space-y-6 bg-violet-50 dark:bg-neutral-900/80 border border-violet-200 dark:border-neutral-800 rounded-3xl p-8">
            <h2 className="text-2xl font-semibold">معلومات مهمة</h2>
            <p className="text-neutral-600 dark:text-neutral-300 leading-7">
              عند حفظ بيانات العميل هنا، ستظهر تلقائياً في صفحة الحجز لتسريع العملية وتقليل الأخطاء.
            </p>
          </aside>
        </div>
      </div>
    </main>
  )
}

export default Home
