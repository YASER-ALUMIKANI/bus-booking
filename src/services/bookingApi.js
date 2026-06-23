export async function fetchClientBookings() {
  const res = await fetch('/api/client/bookings')
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'فشل جلب الحجوزات السابقة.')
  }
  return res.json()
}

export async function createBooking(formData, csrfToken) {
  const res = await fetch('/api/bookings', {
    method: 'POST',
    headers: {
      'X-CSRF-Token': csrfToken,
    },
    body: formData,
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'فشل معالجة طلب الحجز.')
  }
  return res.json()
}
