import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const statusLabels = {
  pending: 'معلق',
  confirmed: 'تم الحجز',
  cancelled: 'ملغي',
}

const statusClasses = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200',
  confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
}

const AdminNotifications = () => {
  const [bookings, setBookings] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [approvalPasswords, setApprovalPasswords] = useState({})
  const [cancelReasons, setCancelReasons] = useState({})
  const [requestReasons, setRequestReasons] = useState({})
  const [role, setRole] = useState('')
  const navigate = useNavigate()

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
    } catch (err) {
      setError('فشل في تحميل الإشعارات. حاول مرة أخرى.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminRole')
    localStorage.removeItem('adminUsername')
    navigate('/admin/login')
  }

  const updateStatus = async (bookingId, newStatus, reason = '') => {
    const token = getToken()
    if (!token) return

    if (role !== 'manager' && newStatus !== 'confirmed' && newStatus !== 'cancelled') {
      setError('فقط المدير يمكنه تغيير الحالة مباشرة.')
      return
    }

    if (role !== 'manager' && newStatus === 'cancelled' && !reason.trim()) {
      setError('يجب إضافة سبب الإلغاء.')
      return
    }

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': '1',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus, cancellationReason: reason.trim() }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'فشل تحديث الحالة.')
      }

      const data = await response.json()
      setBookings((prev) => prev.map((booking) => booking.id === bookingId ? data.booking : booking))
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }

  const requestChange = async (bookingId, requestedStatus, reason = '') => {
    const token = getToken()
    if (!token) return

    if (requestedStatus === 'cancelled' && !reason.trim()) {
      setError('يجب إضافة سبب الإلغاء عند طلب التغيير إلى ملغي.')
      return
    }

    try {
      const response = await fetch(`/api/bookings/${bookingId}/request-change`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': '1',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ requested_status: requestedStatus, requested_cancellation_reason: reason.trim() }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'فشل طلب موافقة التغيير.')
      }

      const data = await response.json()
      setBookings((prev) => prev.map((booking) => booking.id === bookingId ? data.booking : booking))
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }

  const approveChange = async (bookingId) => {
    const token = getToken()
    if (!token) return

    const password = approvalPasswords[bookingId] || ''
    if (!password.trim()) {
      setError('يجب إدخال كلمة مرور المسؤول للموافقة.')
      return
    }

    try {
      const response = await fetch(`/api/bookings/${bookingId}/approve-change`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': '1',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'فشل الموافقة على التغيير.')
      }

      const data = await response.json()
      setBookings((prev) => prev.map((booking) => booking.id === bookingId ? data.booking : booking))
      setApprovalPasswords((prev) => ({ ...prev, [bookingId]: '' }))
    } catch (err) {
      setError(err.message)
    }
  }

  const bookingCounts = bookings.reduce(
    (acc, booking) => {
      if (booking.status === 'confirmed') acc.confirmed += 1
      else if (booking.status === 'cancelled') acc.cancelled += 1
      else acc.pending += 1
      return acc
    },
    { confirmed: 0, cancelled: 0, pending: 0 }
  )

  return (
    <main className="pt-[8ch] min-h-[calc(100vh-8ch)] bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <div className="max-w-6xl mx-auto px-4 md:px-16 lg:px-28 py-16">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">لوحة إشعارات المسؤول</h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-2">
              هنا تظهر الحجوزات الجديدة ويمكنك تغيير حالة كل طلب بسهولة.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/admin/dashboard"
              className="inline-flex items-center justify-center rounded-full border border-violet-600 bg-white px-6 py-3 text-violet-600 font-semibold hover:bg-violet-50 transition"
            >
              افتح لوحة التحكم
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center rounded-full bg-red-600 px-6 py-3 text-white font-semibold hover:bg-red-700 transition"
            >
              تسجيل خروج
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">تم الحجز</p>
            <p className="mt-3 text-3xl font-semibold text-green-600 dark:text-green-300">{bookingCounts.confirmed}</p>
          </div>
          <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">معلق</p>
            <p className="mt-3 text-3xl font-semibold text-yellow-600 dark:text-yellow-300">{bookingCounts.pending}</p>
          </div>
          <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">ملغي</p>
            <p className="mt-3 text-3xl font-semibold text-red-600 dark:text-red-300">{bookingCounts.cancelled}</p>
          </div>
        </div>

        {loading ? (
          <p className="text-neutral-600 dark:text-neutral-400">جارٍ تحميل الإشعارات...</p>
        ) : error ? (
          <p className="text-red-600 dark:text-red-400 mb-6">{error}</p>
        ) : bookings.length === 0 ? (
          <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8">
            <p className="text-neutral-600 dark:text-neutral-400">لا توجد إشعارات حجز جديدة بعد.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => (
              <div key={booking.id} className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 flex-1">
                    <div>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">اسم المسافر</p>
                      <p className="mt-1 font-semibold">{booking.passenger_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">رقم الجوال</p>
                      <p className="mt-1">{booking.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">رقم الجواز</p>
                      <p className="mt-1">{booking.passport}</p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">من</p>
                      <p className="mt-1">{booking.origin}</p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">إلى</p>
                      <p className="mt-1">{booking.destination}</p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">تاريخ الحجز</p>
                      <p className="mt-1">{new Date(booking.travel_date).toLocaleDateString('ar-EG')}</p>
                    </div>
                  </div>

                  {booking.cancellation_reason && booking.status === 'cancelled' && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30 p-4 text-sm text-red-700 dark:text-red-200">
                      <p className="font-semibold">سبب الإلغاء:</p>
                      <p className="mt-2">{booking.cancellation_reason}</p>
                    </div>
                  )}

                  <div className="flex flex-col gap-3 min-w-[220px]">
                    <span className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold ${statusClasses[booking.status] || statusClasses.pending}`}>
                      {statusLabels[booking.status] || statusLabels.pending}
                    </span>
                    <div className="space-y-3">
                      {booking.status === 'pending' ? (
                        role === 'manager' ? (
                          <>
                            <button
                              onClick={() => updateStatus(booking.id, 'confirmed')}
                              className="w-full rounded-full bg-green-600 px-4 py-2 text-white font-semibold hover:bg-green-700 transition"
                            >
                              تم الحجز
                            </button>
                            <button
                              onClick={() => updateStatus(booking.id, 'cancelled')}
                              className="w-full rounded-full bg-red-600 px-4 py-2 text-white font-semibold hover:bg-red-700 transition"
                            >
                              ملغي
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => updateStatus(booking.id, 'confirmed')}
                              className="w-full rounded-full bg-green-600 px-4 py-2 text-white font-semibold hover:bg-green-700 transition"
                            >
                              تأكيد الحجز
                            </button>
                            <div>
                              <textarea
                                value={cancelReasons[booking.id] || ''}
                                onChange={(e) => setCancelReasons((prev) => ({ ...prev, [booking.id]: e.target.value }))}
                                rows={3}
                                className="w-full rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 px-4 py-3 text-neutral-900 dark:text-neutral-100 outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900"
                                placeholder="ضع سبب الإلغاء هنا قبل الضغط على إلغاء"
                              />
                            </div>
                            <button
                              onClick={() => updateStatus(booking.id, 'cancelled', cancelReasons[booking.id] || '')}
                              className="w-full rounded-full bg-red-600 px-4 py-2 text-white font-semibold hover:bg-red-700 transition"
                            >
                              إلغاء الحجز مع سبب
                            </button>
                          </>
                        )
                      ) : (
                        <>
                          <button
                            disabled
                            className="w-full rounded-full bg-neutral-100 px-4 py-2 text-neutral-500 font-semibold cursor-not-allowed"
                          >
                            لا يمكن التغيير الآن
                          </button>
                          {booking.status === 'confirmed' ? (
                            <>
                              <textarea
                                value={requestReasons[booking.id] || ''}
                                onChange={(e) => setRequestReasons((prev) => ({ ...prev, [booking.id]: e.target.value }))}
                                rows={3}
                                className="w-full rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 px-4 py-3 text-neutral-900 dark:text-neutral-100 outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900"
                                placeholder="ضع سبب طلب الإلغاء"
                              />
                              <button
                                onClick={() => requestChange(booking.id, 'cancelled', requestReasons[booking.id] || '')}
                                className="w-full rounded-full border border-violet-600 bg-white text-violet-600 font-semibold hover:bg-violet-50 transition"
                              >
                                طلب إلغاء الحالة
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => requestChange(booking.id, 'confirmed')}
                              className="w-full rounded-full border border-violet-600 bg-white text-violet-600 font-semibold hover:bg-violet-50 transition"
                            >
                              طلب تأكيد الحجز
                            </button>
                          )}
                        </>
                      )}
                      {booking.change_requested && booking.requested_status && (
                        <div className="rounded-2xl bg-violet-50 dark:bg-violet-950/40 p-3 text-sm text-violet-700 dark:text-violet-200">
                          <p>طلب تغيير الحالة إلى: {statusLabels[booking.requested_status] || booking.requested_status}</p>
                          {booking.requested_cancellation_reason && (
                            <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">
                              سبب الطلب: {booking.requested_cancellation_reason}
                            </p>
                          )}
                        </div>
                      )}
                      {booking.change_requested && !booking.approval_granted && (
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300">كلمة مرور المسؤول</label>
                            <input
                              type="password"
                              value={approvalPasswords[booking.id] || ''}
                              onChange={(e) => setApprovalPasswords((prev) => ({ ...prev, [booking.id]: e.target.value }))}
                              className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 px-4 py-3 text-neutral-900 dark:text-neutral-100 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900"
                              placeholder="أدخل كلمة المرور لموافقة التغيير"
                            />
                          </div>
                          <button
                            onClick={() => approveChange(booking.id)}
                            className="w-full rounded-full bg-yellow-500 px-4 py-2 text-white font-semibold hover:bg-yellow-600 transition"
                          >
                            موافقة المسؤول على التغيير
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-5 border-t border-neutral-200 dark:border-neutral-800 pt-4 text-sm text-neutral-500 dark:text-neutral-400">
                  <p>وقت الطلب: {new Date(booking.timestamp).toLocaleString('ar-EG')}</p>
                  <p>رقم الطلب: {booking.id}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

export default AdminNotifications
