import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCsrfToken } from '../../utils/csrf'

const AdminSchedules = () => {
  const [dates, setDates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newDate, setNewDate] = useState('')
  const [company, setCompany] = useState('البركة')
  const [priceAdult, setPriceAdult] = useState(35000)
  const [priceChild, setPriceChild] = useState(35050)
  const [busType, setBusType] = useState('VIP')
  const [totalSeats, setTotalSeats] = useState(40)
  const [tripTime, setTripTime] = useState('06:30:00 PM')
  const [notes, setNotes] = useState('الصعود من عفار')
  const [issuingOffice, setIssuingOffice] = useState('وكيل اب مساعد كامل')
  const [saving, setSaving] = useState(false)
  const [csrfToken, setCsrfToken] = useState('')
  const navigate = useNavigate()

  const getToken = () => localStorage.getItem('adminToken')

  const fetchSchedules = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/schedules')
      if (!res.ok) throw new Error('فشل تحميل التواريخ')
      const data = await res.json()
      setDates(data.dates || [])
    } catch (err) {
      setError(err.message || 'فشل تحميل التواريخ')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSchedules()
  }, [])

  useEffect(() => {
    const loadToken = async () => {
      const token = await getCsrfToken()
      setCsrfToken(token)
    }
    loadToken()
  }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    setError('')
    if (!newDate) {
      setError('اختر تاريخاً صالِحًا')
      return
    }
    setSaving(true)
    try {
      const token = getToken()
      if (!token) {
        navigate('/admin/login')
        return
      }
      if (!csrfToken) {
        throw new Error('فشل الحصول على رمز CSRF. حاول إعادة تحميل الصفحة.')
      }
      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          travelDate: newDate,
          company: company,
          priceAdult: priceAdult,
          priceChild: priceChild,
          busType: busType,
          totalSeats: totalSeats,
          tripTime: tripTime,
          notes: notes,
          issuingOffice: issuingOffice
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'فشل إضافة التاريخ')
      setNewDate('')
      fetchSchedules()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('هل تريد حذف هذا التاريخ؟')) return
    try {
      const token = getToken()
      if (!token) { navigate('/admin/login'); return }
      if (!csrfToken) {
        throw new Error('فشل الحصول على رمز CSRF. حاول إعادة تحميل الصفحة.')
      }
      const res = await fetch(`/api/schedules/${id}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-Token': csrfToken,
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'فشل الحذف')
      fetchSchedules()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <main className="pt-[8ch] min-h-[calc(100vh-8ch)] bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <div className="max-w-4xl mx-auto px-4 md:px-16 lg:px-28 py-16">
        <h1 className="text-3xl font-bold mb-6">إدارة جداول الرحلات</h1>

        <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 mb-8">
          <form onSubmit={handleAdd} className="flex gap-4 items-center flex-wrap">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-neutral-500">تاريخ الرحلة</label>
              <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="rounded-xl border px-4 py-2 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border-neutral-300 dark:border-neutral-700" />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-neutral-500">شركة النقل</label>
              <select value={company} onChange={(e) => setCompany(e.target.value)} className="rounded-xl border px-4 py-2 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border-neutral-300 dark:border-neutral-700">
                <option value="البركة">البركة</option>
                <option value="المتصدر">المتصدر</option>
                <option value="البراق">البراق</option>
                <option value="إكسبرس">إكسبرس</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-neutral-500">نوع الباص</label>
              <select value={busType} onChange={(e) => setBusType(e.target.value)} className="rounded-xl border px-4 py-2 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border-neutral-300 dark:border-neutral-700">
                <option value="VIP">VIP</option>
                <option value="عادي">عادي</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-neutral-500 font-sans">سعر البالغين</label>
              <input type="number" min="0" value={priceAdult} onChange={(e) => setPriceAdult(Number(e.target.value))} className="rounded-xl border px-4 py-2 w-28 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border-neutral-300 dark:border-neutral-700 font-sans font-bold" />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-neutral-500 font-sans">سعر الأطفال</label>
              <input type="number" min="0" value={priceChild} onChange={(e) => setPriceChild(Number(e.target.value))} className="rounded-xl border px-4 py-2 w-28 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border-neutral-300 dark:border-neutral-700 font-sans font-bold" />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-neutral-500">عدد المقاعد</label>
              <input type="number" min="1" value={totalSeats} onChange={(e) => setTotalSeats(e.target.value)} className="rounded-xl border px-4 py-2 w-24 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border-neutral-300 dark:border-neutral-700" />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-neutral-500">وقت الرحلة</label>
              <input type="text" value={tripTime} onChange={(e) => setTripTime(e.target.value)} placeholder="مثال: 06:30:00 PM" className="rounded-xl border px-4 py-2 w-36 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border-neutral-300 dark:border-neutral-700" />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-neutral-500">مكتب الإصدار</label>
              <input type="text" value={issuingOffice} onChange={(e) => setIssuingOffice(e.target.value)} placeholder="مثال: وكيل اب مساعد كامل" className="rounded-xl border px-4 py-2 w-48 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border-neutral-300 dark:border-neutral-700" />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-neutral-500">ملاحظات / نقطة الركوب</label>
              <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="مثال: الصعود من عفار" className="rounded-xl border px-4 py-2 w-48 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border-neutral-300 dark:border-neutral-700" />
            </div>

            <div className="flex flex-col gap-1 pt-5">
              <button className="rounded-full bg-violet-600 text-white px-5 py-2 font-semibold hover:bg-violet-700 transition" disabled={saving}>{saving ? 'جاري الحفظ...' : 'أضف رحلة'}</button>
            </div>

            {error && <p className="text-sm text-red-600 w-full mt-2">{error}</p>}
          </form>
        </div>

        <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6">
          <h2 className="text-xl font-semibold mb-4">التواريخ الحالية</h2>
          {loading ? (
            <p className="text-neutral-500">جارٍ التحميل...</p>
          ) : dates.length === 0 ? (
            <p className="text-neutral-500">لا توجد تواريخ.</p>
          ) : (
            <ul className="space-y-3">
              {dates.map((d) => (
                <li key={d.id} className="flex items-center justify-between border border-neutral-200 dark:border-neutral-800 rounded-lg p-3">
                  <div>
                    <span className="font-semibold">{new Date(d.travelDate).toLocaleDateString('ar-EG')}</span>
                    <span className="mx-2 text-neutral-400">|</span>
                    <span className="text-xs font-bold text-red-600 dark:text-red-400">{d.tripTime}</span>
                    <span className="mx-2 text-neutral-400">|</span>
                    <span className="bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 px-3 py-1 rounded-full text-sm font-bold">{d.company}</span>
                    <span className="mx-2 text-neutral-400">|</span>
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">{d.busType}</span>
                    <span className="mx-2 text-neutral-400">|</span>
                    <span className="text-xs text-neutral-500 font-sans">بالغين:</span> <span className="text-sm font-bold text-green-600 dark:text-green-400 font-sans">{d.priceAdult || d.price} YER</span>
                    <span className="mx-2 text-neutral-400">|</span>
                    <span className="text-xs text-neutral-500 font-sans">أطفال:</span> <span className="text-sm font-bold text-green-600 dark:text-green-400 font-sans">{d.priceChild || d.price} YER</span>
                    <span className="mx-2 text-neutral-400">|</span>
                    <span className="text-xs text-neutral-500">{d.totalSeats} مقعد</span>
                    <span className="mx-2 text-neutral-400">|</span>
                    <span className="text-xs text-neutral-500">{d.issuingOffice}</span>
                    <span className="mx-2 text-neutral-400">|</span>
                    <span className="text-xs text-neutral-500">{d.notes}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleDelete(d.id)} className="rounded-full bg-red-600 text-white px-3 py-1 text-sm">حذف</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  )
}

export default AdminSchedules
