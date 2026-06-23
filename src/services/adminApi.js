export async function fetchAdminBookings(token) {
  const res = await fetch('/api/bookings', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'فشل جلب الحجوزات.')
  }
  return res.json()
}

export async function updateBookingStatus(bookingId, status, cancellationReason, token, csrfToken) {
  const res = await fetch(`/api/bookings/${bookingId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    body: JSON.stringify({ status, cancellationReason }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'فشل تحديث حالة الحجز.')
  }
  return res.json()
}

export async function requestBookingChange(bookingId, requestedStatus, requestedCancellationReason, token, csrfToken) {
  const res = await fetch(`/api/bookings/${bookingId}/request-change`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    body: JSON.stringify({
      requested_status: requestedStatus,
      requested_cancellation_reason: requestedCancellationReason,
    }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'فشل تقديم طلب التغيير.')
  }
  return res.json()
}

export async function approveBookingChange(bookingId, password, token, csrfToken) {
  const res = await fetch(`/api/bookings/${bookingId}/approve-change`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    body: JSON.stringify({ password }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'فشل الموافقة على طلب التغيير.')
  }
  return res.json()
}

export async function fetchAdminUsers(token) {
  const res = await fetch('/api/admin/users', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'فشل جلب قائمة مستخدمي النظام.')
  }
  return res.json()
}

export async function createAdminUser(username, password, role, token, csrfToken) {
  const res = await fetch('/api/admin/users', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    body: JSON.stringify({ username, password, role }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'فشل إنشاء المستخدم.')
  }
  return res.json()
}

export async function fetchVerifications(token) {
  const res = await fetch('/api/admin/verifications', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'فشل جلب طلبات التوثيق.')
  }
  return res.json()
}

export async function approveVerification(requestId, token, csrfToken) {
  const res = await fetch(`/api/admin/verifications/${requestId}/approve`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-CSRF-Token': csrfToken,
    },
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'فشل الموافقة على طلب التوثيق.')
  }
  return res.json()
}

export async function rejectVerification(requestId, token, csrfToken) {
  const res = await fetch(`/api/admin/verifications/${requestId}/reject`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-CSRF-Token': csrfToken,
    },
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'فشل رفض طلب التوثيق.')
  }
  return res.json()
}

export async function createSchedule(scheduleData, token, csrfToken) {
  const res = await fetch('/api/schedules', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    body: JSON.stringify(scheduleData),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'فشل إضافة جدول الرحلة.')
  }
  return res.json()
}

export async function deleteSchedule(scheduleId, token, csrfToken) {
  const res = await fetch(`/api/schedules/${scheduleId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-CSRF-Token': csrfToken,
    },
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'فشل حذف جدول الرحلة.')
  }
  return res.json()
}
