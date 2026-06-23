import React, { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getCsrfToken } from '../../utils/csrf'

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
  const [dbDateFilter, setDbDateFilter] = useState('all')
  const [dbPage, setDbPage] = useState(1)
  const DB_PAGE_SIZE = 10
  const [dbSize, setDbSize] = useState(0)
  const [activeTab, setActiveTab] = useState('tools')

  // Account Verification States
  const [verificationRequests, setVerificationRequests] = useState([])
  const [loadingVerifications, setLoadingVerifications] = useState(false)
  const [verificationError, setVerificationError] = useState('')
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [selectedVerifyRequest, setSelectedVerifyRequest] = useState(null)

  const fetchVerificationRequests = async () => {
    const token = getToken()
    if (!token) return
    setLoadingVerifications(true)
    setVerificationError('')
    try {
      const response = await fetch('/api/admin/verifications', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) {
        throw new Error('فشل جلب طلبات التوثيق.')
      }
      const data = await response.json()
      setVerificationRequests(data.verifications || [])
    } catch (err) {
      setVerificationError(err.message)
    } finally {
      setLoadingVerifications(false)
    }
  }

  const handleApproveVerification = async (reqId) => {
    if (!window.confirm('هل أنت متأكد من الموافقة على طلب التوثيق وتأكيد حساب هذا المشترك؟')) return
    const token = getToken()
    try {
      const res = await fetch(`/api/admin/verifications/${reqId}/approve`, {
        method: 'POST',
        headers: {
          'X-CSRF-Token': csrfToken,
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.message || 'فشل إرسال الموافقة.')
      } else {
        alert('تم تأكيد وتوثيق الحساب بنجاح.')
        fetchVerificationRequests()
      }
    } catch (err) {
      alert('حدث خطأ غير متوقع.')
    }
  }

  const handleRejectVerification = async (reqId) => {
    if (!window.confirm('هل أنت متأكد من رفض طلب التوثيق هذا؟')) return
    const token = getToken()
    try {
      const res = await fetch(`/api/admin/verifications/${reqId}/reject`, {
        method: 'POST',
        headers: {
          'X-CSRF-Token': csrfToken,
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.message || 'فشل إرسال الرفض.')
      } else {
        alert('تم رفض طلب التوثيق.')
        fetchVerificationRequests()
      }
    } catch (err) {
      alert('حدث خطأ غير متوقع.')
    }
  }

  useEffect(() => {
    if (activeTab === 'verifications') {
      fetchVerificationRequests()
    }
  }, [activeTab])

  const getToken = () => localStorage.getItem('adminToken')

  const fetchBookings = async () => {
    const token = getToken()
    const currentRole = localStorage.getItem('adminRole')
    if (!token || !currentRole) {
      navigate('/admin/login')
      return
    }
    // ponytail: Secure and isolate the control panel dashboard strictly to manager role
    if (currentRole !== 'manager') {
      navigate('/admin')
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
      if (data.db_size) {
        setDbSize(data.db_size)
      }
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

  // ponytail: Global definitions pulled out to component level for accessibility across tabs
  const filtered = React.useMemo(() => {
    return bookings.filter((b) => {
      const matchSearch =
        dbSearch === '' ||
        (b.passenger_name || '').toLowerCase().includes(dbSearch.toLowerCase()) ||
        (b.phone || '').includes(dbSearch) ||
        (b.passport || '').toLowerCase().includes(dbSearch.toLowerCase()) ||
        (b.origin || '').toLowerCase().includes(dbSearch.toLowerCase()) ||
        (b.destination || '').toLowerCase().includes(dbSearch.toLowerCase()) ||
        (b.id || '').toLowerCase().includes(dbSearch.toLowerCase())
      const matchStatus = dbStatusFilter === 'all' || b.status === dbStatusFilter
      const matchDate = dbDateFilter === 'all' || b.travel_date === dbDateFilter
      return matchSearch && matchStatus && matchDate
    })
  }, [bookings, dbSearch, dbStatusFilter, dbDateFilter])

  const handleExcelDownload = () => {
    const headers = ['معرّف','المسافر','الهاتف','الجواز','من','إلى','تاريخ السفر','الحالة','رقم الحوالة','الحالة المطلوبة','سبب الإلغاء','سبب طلب الإلغاء','مقفول','طلب تغيير','موافقة','ضيف','الطابع الزمني']
    const rows = filtered.map((b) => [
      b.id, b.passenger_name, b.phone, b.passport,
      b.origin, b.destination, b.travel_date, b.status,
      b.payment_ref || '', b.requested_status || '',
      b.cancellation_reason || '',
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

  const handlePrintManifest = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const grouped = {};
    filtered.forEach(b => {
      const d = b.travel_date || 'غير محدد';
      if (!grouped[d]) grouped[d] = [];
      grouped[d].push(b);
    });

    const sortedDates = Object.keys(grouped).sort();

    let contentHtml = '';
    sortedDates.forEach((date, dateIdx) => {
      const dateBookings = grouped[date];
      const tableRows = dateBookings.map((b, idx) => `
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 10px; text-align: center;">${idx + 1}</td>
          <td style="padding: 10px; text-align: right;">${b.passenger_name}</td>
          <td style="padding: 10px; text-align: center;">${b.phone}</td>
          <td style="padding: 10px; text-align: center;">${b.passport}</td>
          <td style="padding: 10px; text-align: center; font-weight: bold;">${b.seat || '-'}</td>
          <td style="padding: 10px; text-align: center;">${b.travel_date}</td>
          <td style="padding: 10px; text-align: center;">${b.company}</td>
          <td style="padding: 10px; text-align: right;">${b.origin} ← ${b.destination}</td>
          <td style="padding: 10px; text-align: center;">${b.payment_ref || '-'}</td>
          <td style="padding: 10px; text-align: center;">${b.status === 'confirmed' ? 'مؤكد' : b.status === 'pending' ? 'معلق' : 'ملغي'}</td>
        </tr>
      `).join('');

      const pageBreak = dateIdx < sortedDates.length - 1 ? 'page-break-after: always;' : '';

      contentHtml += `
        <div style="${pageBreak} padding-bottom: 20px;">
          <h1 style="text-align: center; font-size: 24px; margin-bottom: 5px;">كشف ركاب الرحلة (البيان)</h1>
          <div class="meta-info" style="text-align: center; font-size: 14px; color: #666; margin-bottom: 25px;">
            تاريخ الرحلة: ${date} | تاريخ الطباعة: ${new Date().toLocaleString('ar-EG')} | عدد الركاب: ${dateBookings.length}
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 14px;">
            <thead>
              <tr style="background-color: #f5f5f5; border-bottom: 2px solid #ccc;">
                <th style="padding: 12px; font-weight: bold; text-align: center;">#</th>
                <th style="padding: 12px; font-weight: bold; text-align: right;">المسافر</th>
                <th style="padding: 12px; font-weight: bold; text-align: center;">الهاتف</th>
                <th style="padding: 12px; font-weight: bold; text-align: center;">الجواز</th>
                <th style="padding: 12px; font-weight: bold; text-align: center;">المقعد</th>
                <th style="padding: 12px; font-weight: bold; text-align: center;">التاريخ</th>
                <th style="padding: 12px; font-weight: bold; text-align: center;">الشركة</th>
                <th style="padding: 12px; font-weight: bold; text-align: right;">المسار</th>
                <th style="padding: 12px; font-weight: bold; text-align: center;">رقم الحوالة</th>
                <th style="padding: 12px; font-weight: bold; text-align: center;">الحالة</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </div>
      `;
    });

    const html = `
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8">
          <title>كشف ركاب الرحلة (البيان)</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; color: #333; }
            @media print {
              .no-print { display: none; }
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="text-align: left; margin-bottom: 15px;">
            <button onclick="window.print()" style="padding: 10px 20px; font-size: 14px; background-color: #7c3aed; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">طباعة الكشف</button>
          </div>
          ${contentHtml}
          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); }, 500);
            }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
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
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans" dir="rtl">
      {/* Top Header cPanel Bar */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between px-6 shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <span className="text-xl font-black text-orange-500 tracking-wider">cPanel</span>
          <span className="text-xs font-semibold bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">YemenBus v1.2</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="hidden sm:flex flex-col items-end">
            <span className="font-semibold text-slate-200">المسؤول: {localStorage.getItem('adminUsername') || 'manager'}</span>
            <span className="text-xs text-slate-400 font-mono">الدور: مدير النظام</span>
          </div>
          <Link
            to="/admin"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
            </svg>
            التذاكر والطلبات
          </Link>
          <button
            onClick={handleLogout}
            className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition shadow"
          >
            تسجيل خروج
          </button>
        </div>
      </header>

      {/* Main Body Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Right Sidebar (Navigation) */}
        <aside className="w-full md:w-64 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-800/80">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">لوحة التحكم والموقع</p>
          </div>
          <nav className="flex-1 p-3 space-y-1.5">
            <button
              onClick={() => setActiveTab('tools')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === 'tools'
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              الأدوات الرئيسية (cPanel)
            </button>
            <button
              onClick={() => setActiveTab('database')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === 'database'
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
              مستعرض قاعدة البيانات
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === 'users'
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              إدارة المشرفين والحسابات
            </button>
            <button
              onClick={() => setActiveTab('verifications')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === 'verifications'
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              طلبات توثيق الحسابات
            </button>
            <Link
              to="/admin/schedules"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" />
              </svg>
              إدارة الجداول والمواعيد
            </Link>
            <Link
              to="/admin"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              إشعارات وتذاكر الركاب
            </Link>
          </nav>
          <div className="p-4 border-t border-slate-800/80 text-xs text-slate-500 text-center font-mono">
            YemenBus © 2026
          </div>
        </aside>

        {/* Content Wrapper */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950 flex flex-col xl:flex-row gap-6">
          {loading ? (
            <div className="flex-1 flex items-center justify-center p-12 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-3xl">
              <div className="text-center">
                <div className="inline-block w-8 h-8 border-4 border-t-orange-500 border-r-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-slate-500">جارٍ تحميل لوحة تحكم cPanel...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex-1 p-8 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-3xl text-red-700 dark:text-red-300">
              {error}
            </div>
          ) : (
            <>
              {/* Tab Content (Right 3 Columns on large screens) */}
              <div className="flex-1 xl:max-w-[75%] space-y-6">
                
                {/* 1. TOOLS TAB */}
                {activeTab === 'tools' && (
                  <div className="space-y-6 animate-fadeIn">
                    
                    {/* Header Intro */}
                    <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-3xl p-8 shadow-lg relative overflow-hidden">
                      <div className="absolute top-0 left-0 translate-x-[-10%] translate-y-[-10%] w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>
                      <h2 className="text-3xl font-black mb-2">أهلاً بك في لوحة إدارة الموقع</h2>
                      <p className="text-orange-50 max-w-2xl text-sm leading-6">
                        تحكّم بشكل كامل في إعدادات الموقع والمشرفين والجداول الزمنية وتصدير البيانات من خلال هذا النظام المتكامل المصمم كلياً لتوفير أقصى درجات الفعالية والأمان.
                      </p>
                    </div>

                    {/* cPanel Categories */}
                    <div className="space-y-6">
                      
                      {/* Section: Accounts */}
                      <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-sm">
                        <div className="bg-slate-50 dark:bg-neutral-800/50 px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">إدارة الحسابات والمشرفين (Accounts)</h3>
                        </div>
                        <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <button
                            onClick={() => setActiveTab('users')}
                            className="flex flex-col items-center justify-center p-5 rounded-2xl border border-slate-100 dark:border-neutral-800 hover:border-orange-500 dark:hover:border-orange-500 bg-slate-50/50 dark:bg-neutral-950/40 hover:bg-white transition text-center group"
                          >
                            <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                              </svg>
                            </div>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">إنشاء مشرف جديد</span>
                          </button>

                          <button
                            onClick={() => setActiveTab('users')}
                            className="flex flex-col items-center justify-center p-5 rounded-2xl border border-slate-100 dark:border-neutral-800 hover:border-orange-500 dark:hover:border-orange-500 bg-slate-50/50 dark:bg-neutral-950/40 hover:bg-white transition text-center group"
                          >
                            <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                            </div>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">قائمة المسؤولين</span>
                          </button>
                        </div>
                      </div>

                      {/* Section: Database & Files */}
                      <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-sm">
                        <div className="bg-slate-50 dark:bg-neutral-800/50 px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">إدارة البيانات والأرشيف (Files & Databases)</h3>
                        </div>
                        <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <button
                            onClick={() => setActiveTab('database')}
                            className="flex flex-col items-center justify-center p-5 rounded-2xl border border-slate-100 dark:border-neutral-800 hover:border-orange-500 dark:hover:border-orange-500 bg-slate-50/50 dark:bg-neutral-950/40 hover:bg-white transition text-center group"
                          >
                            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                              </svg>
                            </div>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">مستعرض قاعدة البيانات</span>
                          </button>

                          <button
                            onClick={handleExcelDownload}
                            className="flex flex-col items-center justify-center p-5 rounded-2xl border border-slate-100 dark:border-neutral-800 hover:border-orange-500 dark:hover:border-orange-500 bg-slate-50/50 dark:bg-neutral-950/40 hover:bg-white transition text-center group"
                          >
                            <div className="w-12 h-12 rounded-full bg-teal-500/10 text-teal-600 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">تصدير البيانات Excel</span>
                          </button>

                          <button
                            onClick={handlePrintManifest}
                            className="flex flex-col items-center justify-center p-5 rounded-2xl border border-slate-100 dark:border-neutral-800 hover:border-orange-500 dark:hover:border-orange-500 bg-slate-50/50 dark:bg-neutral-950/40 hover:bg-white transition text-center group"
                          >
                            <div className="w-12 h-12 rounded-full bg-violet-500/10 text-violet-600 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                              </svg>
                            </div>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">طباعة الكشوفات (البيان)</span>
                          </button>
                        </div>
                      </div>

                      {/* Section: Schedules & Trips */}
                      <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-sm">
                        <div className="bg-slate-50 dark:bg-neutral-800/50 px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">الرحلات وجداول العمل (Schedules)</h3>
                        </div>
                        <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <Link
                            to="/admin/schedules"
                            className="flex flex-col items-center justify-center p-5 rounded-2xl border border-slate-100 dark:border-neutral-800 hover:border-orange-500 dark:hover:border-orange-500 bg-slate-50/50 dark:bg-neutral-950/40 hover:bg-white transition text-center group"
                          >
                            <div className="w-12 h-12 rounded-full bg-orange-500/10 text-orange-600 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">إدارة مواعيد الرحلات</span>
                          </Link>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* 2. DATABASE TAB */}
                {activeTab === 'database' && (() => {
                  const totalPages = Math.max(1, Math.ceil(filtered.length / DB_PAGE_SIZE))
                  const safePage = Math.min(dbPage, totalPages)
                  const pageData = filtered.slice((safePage - 1) * DB_PAGE_SIZE, safePage * DB_PAGE_SIZE)

                  const statusBadge = (status) => {
                    const map = {
                      confirmed: 'bg-green-100 text-green-700 border border-green-300 dark:bg-green-950/20 dark:text-green-300 dark:border-green-800',
                      cancelled: 'bg-red-100 text-red-700 border border-red-300 dark:bg-red-950/20 dark:text-red-300 dark:border-red-800',
                      pending: 'bg-yellow-100 text-yellow-700 border border-yellow-300 dark:bg-yellow-950/20 dark:text-yellow-300 dark:border-yellow-800',
                    }
                    const labelMap = { confirmed: 'مؤكد', cancelled: 'ملغي', pending: 'معلق' }
                    const cls = map[status] || 'bg-slate-100 text-slate-600 border border-slate-300'
                    return (
                      <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${cls}`}>
                        {labelMap[status] || status || '-'}
                      </span>
                    )
                  }

                  const uniqueTravelDates = [...new Set(bookings.map((b) => b.travel_date).filter(Boolean))].sort()

                  return (
                    <div className="rounded-3xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden animate-fadeIn">
                      {/* Header */}
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-slate-50 dark:bg-neutral-800/40 border-b border-slate-200 dark:border-slate-800 px-6 py-4">
                        <div>
                          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">مستعرض قاعدة البيانات التفاعلي</h2>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{filtered.length} سجل من أصل {bookings.length}</p>
                        </div>
                        <div className="flex gap-2.5 flex-wrap">
                          <button
                            onClick={handlePrintManifest}
                            className="inline-flex items-center gap-2 rounded-full bg-violet-600 hover:bg-violet-700 transition px-5 py-2.5 text-sm font-semibold text-white shadow-sm"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            طباعة البيان (كشف الركاب)
                          </button>
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
                      </div>

                      {/* Filters */}
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-neutral-900/20">
                        <div className="relative flex-1">
                          <svg className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                          </svg>
                          <input
                            type="text"
                            value={dbSearch}
                            onChange={(e) => { setDbSearch(e.target.value); setDbPage(1) }}
                            placeholder="بحث بالاسم، الهاتف، الجواز، الوجهة..."
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-neutral-950 pr-9 pl-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-950"
                          />
                        </div>
                        <select
                          value={dbStatusFilter}
                          onChange={(e) => { setDbStatusFilter(e.target.value); setDbPage(1) }}
                          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-neutral-950 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-950"
                        >
                          <option value="all">كل الحالات</option>
                          <option value="pending">معلق</option>
                          <option value="confirmed">مؤكد</option>
                          <option value="cancelled">ملغي</option>
                        </select>
                        <select
                          value={dbDateFilter}
                          onChange={(e) => { setDbDateFilter(e.target.value); setDbPage(1) }}
                          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-neutral-950 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-950"
                        >
                          <option value="all">كل التواريخ</option>
                          {uniqueTravelDates.map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>

                      {/* Table */}
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100 dark:divide-neutral-800 text-sm" dir="rtl">
                          <thead className="bg-slate-100 dark:bg-neutral-800/60">
                            <tr>
                              {['معرّف','المسافر','الهاتف','الجواز','من','إلى','التاريخ','الحالة','رقم الحوالة','الحالة المطلوبة','سبب الإلغاء','سبب طلب الإلغاء','مقفول','طلب تغيير','موافقة','ضيف','الطابع الزمني'].map((h) => (
                                <th key={h} className="px-4 py-3 text-right text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                            {pageData.length === 0 ? (
                              <tr>
                                <td colSpan={17} className="px-4 py-10 text-center text-slate-400 text-sm">لا توجد نتائج مطابقة</td>
                              </tr>
                            ) : pageData.map((booking, idx) => (
                              <tr key={booking.id} className={idx % 2 === 0 ? 'bg-white dark:bg-neutral-900' : 'bg-slate-50/60 dark:bg-neutral-950/20'} style={{transition:'background 0.15s'}}>
                                <td className="px-4 py-3 text-right text-slate-500 font-mono text-xs max-w-[120px] truncate" title={booking.id}>{booking.id}</td>
                                <td className="px-4 py-3 text-right text-slate-800 dark:text-slate-200 font-medium whitespace-nowrap">{booking.passenger_name}</td>
                                <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400 whitespace-nowrap">{booking.phone}</td>
                                <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">{booking.passport}</td>
                                <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400 whitespace-nowrap">{booking.origin}</td>
                                <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400 whitespace-nowrap">{booking.destination}</td>
                                <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400 whitespace-nowrap">{booking.travel_date}</td>
                                <td className="px-4 py-3 text-right">{statusBadge(booking.status)}</td>
                                <td className="px-4 py-3 text-right text-green-600 font-semibold">{booking.payment_ref || '-'}</td>
                                <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400">{booking.requested_status || '-'}</td>
                                <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400 max-w-[150px] truncate" title={booking.cancellation_reason}>{booking.cancellation_reason || '-'}</td>
                                <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400 max-w-[150px] truncate" title={booking.requested_cancellation_reason}>{booking.requested_cancellation_reason || '-'}</td>
                                <td className="px-4 py-3 text-right">
                                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${booking.locked ? 'bg-red-100 text-red-600 dark:bg-red-950/20 dark:text-red-400' : 'bg-slate-100 text-slate-500'}`}>{booking.locked ? 'نعم' : 'لا'}</span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${booking.change_requested ? 'bg-orange-100 text-orange-600 dark:bg-orange-950/20 dark:text-orange-400' : 'bg-slate-100 text-slate-500'}`}>{booking.change_requested ? 'نعم' : 'لا'}</span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${booking.approval_granted ? 'bg-green-100 text-green-600 dark:bg-green-950/20 dark:text-green-400' : 'bg-slate-100 text-slate-500'}`}>{booking.approval_granted ? 'نعم' : 'لا'}</span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${booking.guest ? 'bg-blue-100 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400' : 'bg-slate-100 text-slate-500'}`}>{booking.guest ? 'نعم' : 'لا'}</span>
                                </td>
                                <td className="px-4 py-3 text-right text-slate-500 text-xs whitespace-nowrap">{booking.timestamp}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-neutral-800/40">
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            صفحة {safePage} من {totalPages} — عرض {(safePage-1)*DB_PAGE_SIZE+1}–{Math.min(safePage*DB_PAGE_SIZE, filtered.length)} من {filtered.length}
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setDbPage((p) => Math.max(1, p - 1))}
                              disabled={safePage === 1}
                              className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-neutral-900 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
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
                                      ? 'border-orange-600 bg-orange-600 text-white'
                                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-neutral-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-neutral-800'
                                  }`}
                                >{pg}</button>
                              )
                            })}
                            <button
                              onClick={() => setDbPage((p) => Math.min(totalPages, p + 1))}
                              disabled={safePage === totalPages}
                              className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-neutral-900 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
                            >التالي</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()}

                {/* 3. USERS TAB */}
                {activeTab === 'users' && (
                  <div className="space-y-6 animate-fadeIn">
                    
                    {/* User Creation Form */}
                    <div className="rounded-3xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8 shadow-sm">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
                        <div>
                          <p className="text-sm font-semibold text-orange-600">إدارة الأمن والمشرفين</p>
                          <h2 className="mt-2 text-2xl font-black text-slate-800 dark:text-slate-100">إنشاء حساب مسؤول جديد</h2>
                        </div>
                      </div>

                      <form onSubmit={handleCreateUser} className="grid gap-4 md:grid-cols-3 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">اسم المستخدم</label>
                          <input
                            type="text"
                            value={newUser.username}
                            onChange={(e) => setNewUser((prev) => ({ ...prev, username: e.target.value }))}
                            required
                            className="mt-2 w-full rounded-2xl border border-slate-300 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-4 py-3 text-slate-900 dark:text-slate-100 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-950"
                            placeholder="مثال: admin_ali"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">كلمة المرور</label>
                          <input
                            type="password"
                            value={newUser.password}
                            onChange={(e) => setNewUser((prev) => ({ ...prev, password: e.target.value }))}
                            required
                            className="mt-2 w-full rounded-2xl border border-slate-300 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-4 py-3 text-slate-900 dark:text-slate-100 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-950"
                            placeholder="كلمة المرور"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">الدور الصلاحي</label>
                          <select
                            value={newUser.role}
                            onChange={(e) => setNewUser((prev) => ({ ...prev, role: e.target.value }))}
                            className="mt-2 w-full rounded-2xl border border-slate-300 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-4 py-3 text-slate-900 dark:text-slate-100 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-950"
                          >
                            <option value="employee">موظف (موافق حجوزات)</option>
                            <option value="manager">مدير الموقع (صلاحيات كاملة)</option>
                          </select>
                        </div>
                        <div className="md:col-span-3">
                          <button
                            type="submit"
                            disabled={creatingUser}
                            className="mt-4 w-full rounded-full bg-orange-600 px-8 py-3 text-white font-semibold hover:bg-orange-700 transition"
                          >
                            {creatingUser ? 'جارٍ إنشاء المستخدم...' : 'إنشاء مستخدم جديد'}
                          </button>
                        </div>
                      </form>

                      {userError && <p className="text-sm text-red-600 mt-2">{userError}</p>}
                      {userMessage && <p className="text-sm text-green-600 mt-2">{userMessage}</p>}
                    </div>

                    {/* Active Admins List Table */}
                    <div className="rounded-3xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8 shadow-sm">
                      <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg mb-4">المشرفون المسجلون حالياً</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100 dark:divide-neutral-800 text-sm">
                          <thead className="bg-slate-100 dark:bg-neutral-800/60">
                            <tr>
                              <th className="px-6 py-3 text-right text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">اسم المستخدم</th>
                              <th className="px-6 py-3 text-right text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">الدور الصلاحي</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                            {adminUsers.length === 0 ? (
                              <tr>
                                <td colSpan={2} className="px-6 py-4 text-center text-slate-400">لا يوجد مشرفين آخرين</td>
                              </tr>
                            ) : adminUsers.map((u, idx) => (
                              <tr key={idx} className={idx % 2 === 0 ? 'bg-white dark:bg-neutral-900' : 'bg-slate-50/50 dark:bg-neutral-950/20'}>
                                <td className="px-6 py-4 text-slate-800 dark:text-slate-200 font-semibold">{u.username}</td>
                                <td className="px-6 py-4">
                                  <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${
                                    u.role === 'manager'
                                      ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/20 dark:text-orange-300'
                                      : 'bg-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-300'
                                  }`}>
                                    {u.role === 'manager' ? 'مدير كامل الصلاحية' : 'موظف موافق تذاكر'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                  </div>
                )}

                {/* 4. VERIFICATIONS TAB */}
                {activeTab === 'verifications' && (
                  <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm space-y-6 animate-fadeIn">
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-neutral-800 pb-4">
                      <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">طلبات توثيق حسابات الركاب</h2>
                        <p className="text-xs text-slate-500 mt-1">مراجعة وثائق الهوية والتحقق منها لتأكيد حسابات الركاب.</p>
                      </div>
                      <button
                        onClick={fetchVerificationRequests}
                        className="rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 hover:bg-slate-100 dark:bg-neutral-800 dark:hover:bg-neutral-700 px-4 py-2 text-xs font-bold transition flex items-center gap-1.5"
                      >
                        🔄 تحديث القائمة
                      </button>
                    </div>

                    {loadingVerifications ? (
                      <div className="text-center py-12">
                        <div className="inline-block w-8 h-8 border-4 border-t-orange-500 border-r-transparent rounded-full animate-spin mb-3"></div>
                        <p className="text-sm text-slate-500">جاري تحميل طلبات التوثيق...</p>
                      </div>
                    ) : verificationError ? (
                      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-950 dark:bg-red-950/20 dark:text-red-400">
                        {verificationError}
                      </div>
                    ) : verificationRequests.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 dark:text-slate-500 font-semibold">
                        لا توجد طلبات توثيق معروضة حالياً.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-right text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-neutral-800 text-slate-400 font-bold bg-slate-50/50 dark:bg-neutral-800/20">
                              <th className="p-3">المسافر</th>
                              <th className="p-3">الهاتف</th>
                              <th className="p-3">نوع الهوية</th>
                              <th className="p-3">رقم الهوية</th>
                              <th className="p-3">مكان/تاريخ الإصدار</th>
                              <th className="p-3 text-center">الوثيقة</th>
                              <th className="p-3 text-center">الحالة</th>
                              <th className="p-3 text-center">الإجراءات</th>
                            </tr>
                          </thead>
                          <tbody>
                            {verificationRequests.map((req) => (
                              <tr key={req.id} className="border-b border-slate-100 dark:border-neutral-800/60 hover:bg-slate-50/30 dark:hover:bg-neutral-800/10">
                                <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{req.fullname}</td>
                                <td className="p-3 font-mono">{req.phone}</td>
                                <td className="p-3">{req.identityType}</td>
                                <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-350">{req.identityNumber}</td>
                                <td className="p-3">
                                  <div>{req.issuePlace}</div>
                                  <div className="text-[10px] text-slate-400">{req.issueDate}</div>
                                </td>
                                <td className="p-3 text-center">
                                  <button
                                    onClick={() => {
                                      setSelectedVerifyRequest(req)
                                      setShowVerifyModal(true)
                                    }}
                                    className="text-violet-600 dark:text-violet-400 hover:underline font-bold"
                                  >
                                    🔍 عرض الوثيقة
                                  </button>
                                </td>
                                <td className="p-3 text-center">
                                  {req.status === 'approved' && (
                                    <span className="bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-300 px-2.5 py-0.5 rounded-full font-bold">
                                      موثق
                                    </span>
                                  )}
                                  {req.status === 'pending' && (
                                    <span className="bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300 px-2.5 py-0.5 rounded-full font-bold">
                                      معلق
                                    </span>
                                  )}
                                  {req.status === 'rejected' && (
                                    <span className="bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-300 px-2.5 py-0.5 rounded-full font-bold">
                                      مرفوض
                                    </span>
                                  )}
                                </td>
                                <td className="p-3 text-center">
                                  {req.status === 'pending' ? (
                                    <div className="flex justify-center gap-1.5">
                                      <button
                                        onClick={() => handleApproveVerification(req.id)}
                                        className="bg-green-600 hover:bg-green-700 text-white px-2.5 py-1 rounded-lg font-bold text-[10px] transition"
                                      >
                                        ✓ موافقة
                                      </button>
                                      <button
                                        onClick={() => handleRejectVerification(req.id)}
                                        className="bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 rounded-lg font-bold text-[10px] transition"
                                      >
                                        ✕ رفض
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-slate-400">-</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

              </div>

              {/* cPanel Sidebar Info (Left Column) */}
              <div className="w-full xl:w-80 space-y-6 shrink-0">
                
                {/* General Information Box */}
                <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-sm">
                  <div className="bg-slate-50 dark:bg-neutral-800/50 px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">معلومات عامة (General Info)</h3>
                  </div>
                  <div className="p-4 divide-y divide-slate-100 dark:divide-neutral-850 text-xs leading-6">
                    <div className="py-2 flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">المستخدم الحالي</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{localStorage.getItem('adminUsername') || 'manager'}</span>
                    </div>
                    <div className="py-2 flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">النطاق الأساسي</span>
                      <span className="font-mono text-slate-600 dark:text-slate-400">yemenbus.com</span>
                    </div>
                    <div className="py-2 flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">المجلد الرئيسي</span>
                      <span className="font-mono text-slate-600 dark:text-slate-400">/home/yemenbus</span>
                    </div>
                    <div className="py-2 flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">خادم الويب</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">Waitress (WSGI)</span>
                    </div>
                    <div className="py-2 flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">بيئة تشغيل البيانات</span>
                      <span className="text-emerald-600 font-bold dark:text-emerald-400">SQLite WAL Mode</span>
                    </div>
                  </div>
                </div>

                {/* Statistics Box */}
                <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-sm">
                  <div className="bg-slate-50 dark:bg-neutral-800/50 px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">الإحصائيات (Statistics)</h3>
                  </div>
                  <div className="p-4 divide-y divide-slate-100 dark:divide-neutral-850 text-xs leading-6">
                    <div className="py-2 flex justify-between items-center">
                      <span className="text-slate-500 dark:text-slate-400">حجم قاعدة البيانات</span>
                      <span className="font-mono font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20 px-2 py-0.5 rounded">
                        {(dbSize / 1024).toFixed(2)} KB
                      </span>
                    </div>
                    <div className="py-2 flex justify-between items-center">
                      <span className="text-slate-500 dark:text-slate-400">إجمالي الحجوزات</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{bookings.length}</span>
                    </div>
                    <div className="py-2 flex justify-between items-center">
                      <span className="text-slate-500 dark:text-slate-400">حجوزات اليوم</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{bookingsToday}</span>
                    </div>
                    <div className="py-2 flex justify-between items-center">
                      <span className="text-slate-500 dark:text-slate-400">رحلات اليوم</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">{travelToday}</span>
                    </div>
                    <div className="py-2 flex justify-between items-center">
                      <span className="text-slate-500 dark:text-slate-400">حالات معلقة</span>
                      <span className="font-bold text-yellow-600 dark:text-yellow-400">{pendingCount}</span>
                    </div>
                    <div className="py-2 flex justify-between items-center">
                      <span className="text-slate-500 dark:text-slate-400">حالات مؤكدة</span>
                      <span className="font-bold text-green-600 dark:text-green-400">{confirmedCount}</span>
                    </div>
                    <div className="py-2 flex justify-between items-center">
                      <span className="text-slate-500 dark:text-slate-400">حالات ملغاة</span>
                      <span className="font-bold text-red-600 dark:text-red-400">{cancelledCount}</span>
                    </div>
                  </div>
                </div>

              </div>
            </>
          )}
        </div>
      </div>

      {/* IDENTITY IMAGE MODAL */}
      {showVerifyModal && selectedVerifyRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl font-sans">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800" dir="rtl">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">وثيقة الهوية: {selectedVerifyRequest.fullname}</h3>
              <button
                type="button"
                onClick={() => {
                  setShowVerifyModal(false)
                  setSelectedVerifyRequest(null)
                }}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-950" dir="rtl">
              <img
                src={`${selectedVerifyRequest.identityImageUrl}?token=${getToken()}`}
                alt="وثيقة الهوية"
                className="max-h-[50vh] w-full object-contain rounded-2xl border border-neutral-200 dark:border-neutral-850 shadow-md"
              />
              <div className="mt-4 grid grid-cols-2 gap-4 w-full max-w-md text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-2xl">
                <div>رقم الهوية: <span className="font-bold font-mono">{selectedVerifyRequest.identityNumber}</span></div>
                <div>نوع الهوية: <span className="font-bold">{selectedVerifyRequest.identityType}</span></div>
                <div>مكان الإصدار: <span className="font-bold">{selectedVerifyRequest.issuePlace}</span></div>
                <div>تاريخ الإصدار: <span className="font-bold font-mono">{selectedVerifyRequest.issueDate}</span></div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowVerifyModal(false)
                  setSelectedVerifyRequest(null)
                }}
                className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-5 py-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
