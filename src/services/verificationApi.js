export async function submitVerification(formData, csrfToken) {
  const res = await fetch('/api/client/verify', {
    method: 'POST',
    headers: {
      'X-CSRF-Token': csrfToken,
    },
    body: formData,
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'فشل تقديم طلب التوثيق.')
  }
  return res.json()
}
