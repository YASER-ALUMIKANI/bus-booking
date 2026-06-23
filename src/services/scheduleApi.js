export async function fetchSchedules() {
  const res = await fetch('/api/schedules')
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'فشل جلب مواعيد الرحلات.')
  }
  return res.json()
}

export async function fetchBookedSeats(scheduleId) {
  const res = await fetch(`/api/schedules/${scheduleId}/booked-seats`)
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'فشل جلب المقاعد المحجوزة لهذه الرحلة.')
  }
  return res.json()
}
