import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCsrfToken } from '../utils/csrf'

const AdminSchedules = () => {
  const [dates, setDates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newDate, setNewDate] = useState('')
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
        body: JSON.stringify({ travelDate: newDate }),
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
          <form onSubmit={handleAdd} className="flex gap-3 items-center">
            <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="rounded-xl border px-4 py-2" />
            <button className="rounded-full bg-violet-600 text-white px-4 py-2 font-semibold" disabled={saving}>{saving ? 'جاري الحفظ...' : 'أضف تاريخ'}</button>
            {error && <p className="text-sm text-red-600">{error}</p>}
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
                <li key={d.id} className="flex items-center justify-between border rounded-lg p-3">
                  <div>{new Date(d.travelDate).toLocaleDateString('ar-EG')}</div>
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
