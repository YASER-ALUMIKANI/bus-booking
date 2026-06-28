export const getBookings = async (token) => {
  const response = await fetch('/api/bookings', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  if (!response.ok) {
    throw new Error('فشل جلب الحجوزات.')
  }
  return response.json()
}

export const getVerificationRequests = async (token) => {
  const response = await fetch('/api/admin/verifications', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  if (!response.ok) {
    throw new Error('فشل جلب طلبات التوثيق.')
  }
  return response.json()
}

export const approveVerification = async (reqId, csrfToken, token) => {
  const res = await fetch(`/api/admin/verifications/${reqId}/approve`, {
    method: 'POST',
    headers: {
      'X-CSRF-Token': csrfToken,
      Authorization: `Bearer ${token}`,
    },
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.message || 'فشل إرسال الموافقة.')
  }
  return res.json()
}

export const rejectVerification = async (reqId, csrfToken, token) => {
  const res = await fetch(`/api/admin/verifications/${reqId}/reject`, {
    method: 'POST',
    headers: {
      'X-CSRF-Token': csrfToken,
      Authorization: `Bearer ${token}`,
    },
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.message || 'فشل إرسال الرفض.')
  }
  return res.json()
}

export const clearDatabase = async (csrfToken, token) => {
  const response = await fetch('/api/admin/danger/clear-db', {
    method: 'POST',
    headers: {
      'X-CSRF-Token': csrfToken,
      Authorization: `Bearer ${token}`
    }
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || 'فشلت عملية التصفية.')
  return data
}

export const clearClients = async (csrfToken, token) => {
  const response = await fetch('/api/admin/danger/clear-clients', {
    method: 'POST',
    headers: {
      'X-CSRF-Token': csrfToken,
      Authorization: `Bearer ${token}`
    }
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || 'فشلت عملية حذف العملاء.')
  return data
}
