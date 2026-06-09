import React, { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getCsrfToken } from '../utils/csrf'

const AdminDashboard = () => {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [role, setRole] = useState('')
  const [showDatabase, setShowDatabase] = useState(false)
  const [adminUsers, setAdminUsers] = useState([])
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'employee' })
  const [userMessage, setUserMessage] = useState('')
  const [userError, setUserError] = useState('')
  const [creatingUser, setCreatingUser] = useState(false)
  const [csrfToken, setCsrfToken] = useState('')
  const navigate = useNavigate()

  // Database view state
  const [dbSearch, setDbSearch] = useState('')
  const [dbStatusFilter, setDbStatusFilter] = useState('all')
  const [dbPage, setDbPage] = useState(1)
  const DB_PAGE_SIZE = 10

  const getToken = () => localStorage.getItem('adminToken')

  const fetchBookings = async () => {
    const token = getToken()
    const currentRole = localStorage.getItem('adminRole')
    if (!token || !currentRole) {
      navigate('/admin/login')
      return
    }

    setRole(currentRole)

    try {
      const response = await fetch('/api/bookings', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.status === 401) {
        localStorage.removeItem('adminToken')
        localStorage.removeItem('adminRole')
        localStorage.removeItem('adminUsername')
        navigate('/admin/login')
        return
      }

      const data = await response.json()
      setBookings(data.bookings || [])
      setError('')
      if (currentRole === 'manager') {
        fetchAdminUsers(token)
      }
    } catch (err) {
      setError('فشل في تحميل البيانات. حاول مرة أخرى.')
    } finally {
      setLoading(false)
    }
  }

  const fetchAdminUsers = async (token) => {
    try {
      const response = await fetch('/api/admin/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) {
        return
      }
      const data = await response.json()
      setAdminUsers(data.users || [])
    } catch {
      setAdminUsers([])
    }
  }

  const handleCreateUser = async (event) => {
    event.preventDefault()
    setUserError('')
    setUserMessage('')
    setCreatingUser(true)

    const token = getToken()
    if (!token) {
      navigate('/admin/login')
      return
    }

    try {
      if (!csrfToken) {
        throw new Error('فشل الحصول على رمز CSRF. حاول إعادة تحميل الصفحة.')
      }
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newUser),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'فشل إنشاء المستخدم.')
      }

      setUserMessage(data.message || 'تم إنشاء المستخدم بنجاح.')
      setNewUser({ username: '', password: '', role: 'employee' })
      fetchAdminUsers(token)
    } catch (err) {
      setUserError(err.message)
    } finally {
      setCreatingUser(false)
    }
  }

  useEffect(() => {
    fetchBookings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const loadToken = async () => {
      const token = await getCsrfToken()
      setCsrfToken(token)
    }
    loadToken()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminRole')
    localStorage.removeItem('adminUsername')
    navigate('/admin/login')
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const bookingsToday = bookings.filter((booking) => {
    const created = new Date(Number(booking.timestamp))
    created.setHours(0, 0, 0, 0)
    return created.getTime() === today.getTime()
  }).length

  const travelToday = bookings.filter((booking) => {
    const travel = new Date(booking.travel_date)
    travel.setHours(0, 0, 0, 0)
    return travel.getTime() === today.getTime()
  }).length

  const confirmedCount = bookings.filter((booking) => booking.status === 'confirmed').length
  const cancelledCount = bookings.filter((booking) => booking.status === 'cancelled').length
  const pendingCount = bookings.filter((booking) => booking.status === 'pending').length
  const approvalRequests = bookings.filter((booking) => booking.change_requested && !booking.approval_granted).length

  return (
    <main className="pt-[8ch] min-h-[calc(100vh-8ch)] bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <div className="max-w-6xl mx-auto px-4 md:px-16 lg:px-28 py-16">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-10">
          <div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">لوحة تحكم المسؤول</p>
            <h1 className="text-4xl font-bold mt-2">إحصائيات الحجز والطلبات</h1>
            <p className="mt-3 text-neutral-600 dark:text-neutral-400 max-w-2xl">
              هنا تجد ملخصاً بنظام الحجوزات اليومي، الحالات الحالية، وعدد طلبات التغيير التي تحتاج موافقة المدير.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {role === 'manager' && (
              <button
                onClick={() => setShowDatabase((prev) => !prev)}
                className="rounded-full border border-slate-600 bg-slate-50 px-6 py-3 text-slate-700 font-semibold hover:bg-slate-100 transition"
              >
                {showDatabase ? 'إخفاء محتوى القاعدة' : 'عرض محتوى قاعدة البيانات'}
              </button>
            )}
            {role === 'manager' && (
              <Link to="/admin/schedules" className="inline-flex items-center justify-center rounded-full border border-violet-600 bg-white px-6 py-3 text-violet-600 font-semibold hover:bg-violet-50 transition">
                إدارة الجداول
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="rounded-full bg-red-600 px-6 py-3 text-white font-semibold hover:bg-red-700 transition"
            >
              تسجيل خروج
            </button>
            <Link
              to="/admin"
              className="inline-flex items-center justify-center rounded-full border border-violet-600 bg-white px-6 py-3 text-violet-600 font-semibold hover:bg-violet-50 transition"
            >
              عرض إشعارات الإدارة
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-10 text-center text-neutral-600 dark:text-neutral-400">
            جارٍ تحميل البيانات...
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30 p-8 text-red-700 dark:text-red-200">
            {error}
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
              <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
                <p className="text-sm text-neutral-500 dark:text-neutral-400">إجمالي الحجوزات</p>
                <p className="mt-4 text-4xl font-bold text-violet-600">{bookings.length}</p>
              </div>
              <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
                <p className="text-sm text-neutral-500 dark:text-neutral-400">الحجوزات اليوم</p>
                <p className="mt-4 text-4xl font-bold text-green-600">{bookingsToday}</p>
              </div>
              <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
                <p className="text-sm text-neutral-500 dark:text-neutral-400">رحلات اليوم</p>
                <p className="mt-4 text-4xl font-bold text-sky-600">{travelToday}</p>
              </div>
              <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
                <p className="text-sm text-neutral-500 dark:text-neutral-400">طلبات موافقة معلقة</p>
                <p className="mt-4 text-4xl font-bold text-yellow-600">{approvalRequests}</p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3 mb-8">
              <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
                <p className="text-sm text-neutral-500 dark:text-neutral-400">معلق</p>
                <p className="mt-4 text-3xl font-semibold text-yellow-600">{pendingCount}</p>
                <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">طلبات تنتظر الإجراء أو الموافقة.</p>
              </div>
              <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
                <p className="text-sm text-neutral-500 dark:text-neutral-400">تم الحجز</p>
                <p className="mt-4 text-3xl font-semibold text-green-600">{confirmedCount}</p>
                <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">طلبات تم تأكيدها بنجاح.</p>
              </div>
              <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
                <p className="text-sm text-neutral-500 dark:text-neutral-400">ملغي</p>
                <p className="mt-4 text-3xl font-semibold text-red-600">{cancelledCount}</p>
                <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">طلبات تم إلغاؤها أو رفضها.</p>
              </div>
            </div>

            {role === 'manager' && (
              <div className="rounded-3xl border border-violet-200 bg-violet-50/70 p-6 shadow-sm mb-8">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
                  <div>
                    <p className="text-sm font-semibold text-violet-600">إنشاء مستخدم جديد</p>
                    <h2 className="mt-2 text-xl font-semibold text-slate-900">لوحة إنشاء المستخدم</h2>
                  </div>
                </div>

                <form onSubmit={handleCreateUser} className="grid gap-4 md:grid-cols-3 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600">اسم المستخدم</label>
                    <input
                      type="text"
                      value={newUser.username}
                      onChange={(e) => setNewUser((prev) => ({ ...prev, username: e.target.value }))}
                      required
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-100"
                      placeholder="مثال: user1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600">كلمة المرور</label>
                    <input
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser((prev) => ({ ...prev, password: e.target.value }))}
                      required
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-100"
                      placeholder="كلمة المرور"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600">الدور</label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser((prev) => ({ ...prev, role: e.target.value }))}
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-100"
                    >
                      <option value="employee">موظف</option>
                      <option value="manager">مدير</option>
                    </select>
                  </div>
                  <div className="md:col-span-3">
                    <button
                      type="submit"
                      disabled={creatingUser}
                      className="mt-4 w-full rounded-full bg-violet-600 px-8 py-3 text-white font-semibold hover:bg-violet-700 transition"
                    >
                      {creatingUser ? 'جارٍ إنشاء المستخدم...' : 'إنشاء مستخدم جديد'}
                    </button>
                  </div>
                </form>

                {userError && <p className="text-sm text-red-600">{userError}</p>}
                {userMessage && <p className="text-sm text-green-600">{userMessage}</p>}
              </div>
            )}
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">آخر 5 طلبات</p>
                  <h2 className="mt-2 text-xl font-semibold">ملخص سريع</h2>
                </div>
                <div className="rounded-full bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700 dark:bg-violet-900/30 dark:text-violet-200">
                  الدور: {role === 'manager' ? 'مدير' : 'موظف'}
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {bookings.slice(0, 5).map((booking) => (
                  <div key={booking.id} className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/50 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm font-semibold">{booking.passenger_name}</p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">{new Date(Number(booking.timestamp)).toLocaleString('ar-EG')}</p>
                    </div>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">الحالة: <span className="font-semibold">{booking.status}</span></p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">من {booking.origin} إلى {booking.destination}</p>
                    </div>
                  </div>
                ))}
              </div>

            {role === 'manager' && showDatabase && (() => {
              // --- Filtered + paginated data ---
              const filtered = bookings.filter((b) => {
                const matchSearch =
                  dbSearch === '' ||
                  (b.passenger_name || '').toLowerCase().includes(dbSearch.toLowerCase()) ||
                  (b.phone || '').includes(dbSearch) ||
                  (b.passport || '').toLowerCase().includes(dbSearch.toLowerCase()) ||
                  (b.origin || '').toLowerCase().includes(dbSearch.toLowerCase()) ||
                  (b.destination || '').toLowerCase().includes(dbSearch.toLowerCase()) ||
                  (b.id || '').toLowerCase().includes(dbSearch.toLowerCase())
                const matchStatus = dbStatusFilter === 'all' || b.status === dbStatusFilter
                return matchSearch && matchStatus
              })
              const totalPages = Math.max(1, Math.ceil(filtered.length / DB_PAGE_SIZE))
              const safePage = Math.min(dbPage, totalPages)
              const pageData = filtered.slice((safePage - 1) * DB_PAGE_SIZE, safePage * DB_PAGE_SIZE)

              const statusBadge = (status) => {
                const map = {
                  confirmed: 'bg-green-100 text-green-700 border border-green-300',
                  cancelled: 'bg-red-100 text-red-700 border border-red-300',
                  pending: 'bg-yellow-100 text-yellow-700 border border-yellow-300',
                }
                const labelMap = { confirmed: 'مؤكد', cancelled: 'ملغي', pending: 'معلق' }
                const cls = map[status] || 'bg-slate-100 text-slate-600 border border-slate-300'
                return (
                  <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${cls}`}>
                    {labelMap[status] || status || '-'}
                  </span>
                )
              }

              const handleExcelDownload = () => {
                const headers = ['معرّف','المسافر','الهاتف','الجواز','من','إلى','تاريخ السفر','الحالة','الحالة المطلوبة','سبب الإلغاء','سبب طلب الإلغاء','مقفول','طلب تغيير','موافقة','ضيف','الطابع الزمني']
                const rows = filtered.map((b) => [
                  b.id, b.passenger_name, b.phone, b.passport,
                  b.origin, b.destination, b.travel_date, b.status,
                  b.requested_status || '', b.cancellation_reason || '',
                  b.requested_cancellation_reason || '',
                  b.locked ? 'نعم' : 'لا',
                  b.change_requested ? 'نعم' : 'لا',
                  b.approval_granted ? 'نعم' : 'لا',
                  b.guest ? 'نعم' : 'لا',
                  b.timestamp,
                ])
                const csvContent = [headers, ...rows]
                  .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
                  .join('\n')
                const BOM = '\uFEFF'
                const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `bookings_${new Date().toISOString().slice(0,10)}.csv`
                a.click()
                URL.revokeObjectURL(url)
              }

              return (
                <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  {/* Header */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-slate-50 border-b border-slate-200 px-6 py-4">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">محتوى قاعدة البيانات</h2>
                      <p className="text-xs text-slate-500 mt-0.5">{filtered.length} سجل من أصل {bookings.length}</p>
                    </div>
                    <button
                      onClick={handleExcelDownload}
                      className="inline-flex items-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-700 transition px-5 py-2.5 text-sm font-semibold text-white shadow-sm"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      تنزيل Excel
                    </button>
                  </div>

                  {/* Filters */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="relative flex-1">
                      <svg className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                      </svg>
                      <input
                        type="text"
                        value={dbSearch}
                        onChange={(e) => { setDbSearch(e.target.value); setDbPage(1) }}
                        placeholder="بحث بالاسم، الهاتف، الجواز، الوجهة..."
                        className="w-full rounded-xl border border-slate-200 bg-white pr-9 pl-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                      />
                    </div>
                    <select
                      value={dbStatusFilter}
                      onChange={(e) => { setDbStatusFilter(e.target.value); setDbPage(1) }}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    >
                      <option value="all">كل الحالات</option>
                      <option value="pending">معلق</option>
                      <option value="confirmed">مؤكد</option>
                      <option value="cancelled">ملغي</option>
                    </select>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100 text-sm" dir="rtl">
                      <thead className="bg-slate-100">
                        <tr>
                          {['معرّف','المسافر','الهاتف','الجواز','من','إلى','التاريخ','الحالة','الحالة المطلوبة','سبب الإلغاء','سبب طلب الإلغاء','مقفول','طلب تغيير','موافقة','ضيف','الطابع الزمني'].map((h) => (
                            <th key={h} className="px-4 py-3 text-right text-xs font-bold text-slate-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {pageData.length === 0 ? (
                          <tr>
                            <td colSpan={16} className="px-4 py-10 text-center text-slate-400 text-sm">لا توجد نتائج مطابقة</td>
                          </tr>
                        ) : pageData.map((booking, idx) => (
                          <tr key={booking.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'} style={{transition:'background 0.15s'}}>
                            <td className="px-4 py-3 text-right text-slate-500 font-mono text-xs max-w-[120px] truncate" title={booking.id}>{booking.id}</td>
                            <td className="px-4 py-3 text-right text-slate-800 font-medium whitespace-nowrap">{booking.passenger_name}</td>
                            <td className="px-4 py-3 text-right text-slate-600 whitespace-nowrap">{booking.phone}</td>
                            <td className="px-4 py-3 text-right text-slate-600">{booking.passport}</td>
                            <td className="px-4 py-3 text-right text-slate-600 whitespace-nowrap">{booking.origin}</td>
                            <td className="px-4 py-3 text-right text-slate-600 whitespace-nowrap">{booking.destination}</td>
                            <td className="px-4 py-3 text-right text-slate-600 whitespace-nowrap">{booking.travel_date}</td>
                            <td className="px-4 py-3 text-right">{statusBadge(booking.status)}</td>
                            <td className="px-4 py-3 text-right text-slate-500">{booking.requested_status || '-'}</td>
                            <td className="px-4 py-3 text-right text-slate-500 max-w-[150px] truncate" title={booking.cancellation_reason}>{booking.cancellation_reason || '-'}</td>
                            <td className="px-4 py-3 text-right text-slate-500 max-w-[150px] truncate" title={booking.requested_cancellation_reason}>{booking.requested_cancellation_reason || '-'}</td>
                            <td className="px-4 py-3 text-right">
                              <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${booking.locked ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>{booking.locked ? 'نعم' : 'لا'}</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${booking.change_requested ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>{booking.change_requested ? 'نعم' : 'لا'}</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${booking.approval_granted ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>{booking.approval_granted ? 'نعم' : 'لا'}</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${booking.guest ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>{booking.guest ? 'نعم' : 'لا'}</span>
                            </td>
                            <td className="px-4 py-3 text-right text-slate-500 text-xs whitespace-nowrap">{booking.timestamp}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50">
                      <p className="text-xs text-slate-500">
                        صفحة {safePage} من {totalPages} — عرض {(safePage-1)*DB_PAGE_SIZE+1}–{Math.min(safePage*DB_PAGE_SIZE, filtered.length)} من {filtered.length}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setDbPage((p) => Math.max(1, p - 1))}
                          disabled={safePage === 1}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >السابق</button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const start = Math.max(1, Math.min(safePage - 2, totalPages - 4))
                          const pg = start + i
                          if (pg > totalPages) return null
                          return (
                            <button
                              key={pg}
                              onClick={() => setDbPage(pg)}
                              className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${
                                pg === safePage
                                  ? 'border-violet-600 bg-violet-600 text-white'
                                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                              }`}
                            >{pg}</button>
                          )
                        })}
                        <button
                          onClick={() => setDbPage((p) => Math.min(totalPages, p + 1))}
                          disabled={safePage === totalPages}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >التالي</button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}
          </>
        )}
      </div>
    </main>
  )
}

export default AdminDashboard
