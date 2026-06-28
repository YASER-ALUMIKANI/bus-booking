import { useState, useEffect, useCallback, useMemo } from 'react'
import * as bookingService from '../services/bookingService'

export const useBookings = (auth) => {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dbSize, setDbSize] = useState(0)

  // Database search/filter states
  const [dbSearch, setDbSearch] = useState('')
  const [dbStatusFilter, setDbStatusFilter] = useState('all')
  const [dbDateFilter, setDbDateFilter] = useState('all')
  const [dbPage, setDbPage] = useState(1)

  // Verifications
  const [verificationRequests, setVerificationRequests] = useState([])
  const [loadingVerifications, setLoadingVerifications] = useState(false)
  const [verificationError, setVerificationError] = useState('')
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [selectedVerifyRequest, setSelectedVerifyRequest] = useState(null)

  const { verifyAuth, getToken, csrfToken, handleLogout } = auth

  const fetchBookings = useCallback(async (onSuccess) => {
    if (!verifyAuth()) return

    const token = getToken()
    try {
      const data = await bookingService.getBookings(token)
      setBookings(data.bookings || [])
      if (data.db_size) {
        setDbSize(data.db_size)
      }
      setError('')
      if (onSuccess) onSuccess(token)
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('Unauthorized')) {
        handleLogout()
      } else {
        setError('فشل في تحميل البيانات. حاول مرة أخرى.')
      }
    } finally {
      setLoading(false)
    }
  }, [verifyAuth, getToken, handleLogout])

  const fetchVerificationRequests = useCallback(async () => {
    const token = getToken()
    if (!token) return
    setLoadingVerifications(true)
    setVerificationError('')
    try {
      const data = await bookingService.getVerificationRequests(token)
      setVerificationRequests(data.verifications || [])
    } catch (err) {
      setVerificationError(err.message)
    } finally {
      setLoadingVerifications(false)
    }
  }, [getToken])

  const handleApproveVerification = useCallback(async (reqId) => {
    if (!window.confirm('هل أنت متأكد من الموافقة على طلب التوثيق وتأكيد حساب هذا المشترك؟')) return
    const token = getToken()
    try {
      await bookingService.approveVerification(reqId, csrfToken, token)
      alert('تم تأكيد وتوثيق الحساب بنجاح.')
      fetchVerificationRequests()
    } catch (err) {
      alert(err.message || 'حدث خطأ غير متوقع.')
    }
  }, [getToken, csrfToken, fetchVerificationRequests])

  const handleRejectVerification = useCallback(async (reqId) => {
    if (!window.confirm('هل أنت متأكد من رفض طلب التوثيق هذا؟')) return
    const token = getToken()
    try {
      await bookingService.rejectVerification(reqId, csrfToken, token)
      alert('تم رفض طلب التوثيق.')
      fetchVerificationRequests()
    } catch (err) {
      alert(err.message || 'حدث خطأ غير متوقع.')
    }
  }, [getToken, csrfToken, fetchVerificationRequests])

  const handleClearDatabase = useCallback(async () => {
    if (!window.confirm("تحذير أمني خطير: هل أنت متأكد من تصفية وحذف جميع الحجوزات وجداول الرحلات من قاعدة البيانات؟ لا يمكن التراجع عن هذا الإجراء!")) return
    const confirmation = window.prompt("لتأكيد الحذف، يرجى كتابة الكلمة 'DANGER' في الخانة:")
    if (confirmation !== 'DANGER') {
      alert("تم إلغاء العملية لعدم مطابقة كلمة التأكيد.")
      return
    }
    const token = getToken()
    try {
      const data = await bookingService.clearDatabase(csrfToken, token)
      alert(data.message)
      fetchBookings()
    } catch (err) {
      alert(err.message)
    }
  }, [getToken, csrfToken, fetchBookings])

  const handleClearClients = useCallback(async () => {
    if (!window.confirm("تحذير أمني خطير: هل أنت متأكد من حذف جميع حسابات المشتركين والعملاء نهائياً؟ هذا الإجراء سيحذف أيضاً جميع حجوزاتهم!")) return
    const confirmation = window.prompt("لتأكيد الحذف، يرجى كتابة الكلمة 'DELETE ALL' في الخانة:")
    if (confirmation !== 'DELETE ALL') {
      alert("تم إلغاء العملية لعدم مطابقة كلمة التأكيد.")
      return
    }
    const token = getToken()
    try {
      const data = await bookingService.clearClients(csrfToken, token)
      alert(data.message)
      fetchBookings()
    } catch (err) {
      alert(err.message)
    }
  }, [getToken, csrfToken, fetchBookings])

  // Filtered bookings
  const filteredBookings = useMemo(() => {
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

  return {
    bookings,
    loading,
    error,
    dbSize,
    dbSearch,
    setDbSearch,
    dbStatusFilter,
    setDbStatusFilter,
    dbDateFilter,
    setDbDateFilter,
    dbPage,
    setDbPage,
    verificationRequests,
    loadingVerifications,
    verificationError,
    showVerifyModal,
    setShowVerifyModal,
    selectedVerifyRequest,
    setSelectedVerifyRequest,
    fetchBookings,
    fetchVerificationRequests,
    handleApproveVerification,
    handleRejectVerification,
    handleClearDatabase,
    handleClearClients,
    filteredBookings
  }
}
