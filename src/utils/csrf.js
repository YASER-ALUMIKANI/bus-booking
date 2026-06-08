export async function getCsrfToken() {
  try {
    const response = await fetch('/api/csrf-token')
    if (!response.ok) return ''
    const data = await response.json()
    return data.csrfToken || ''
  } catch {
    return ''
  }
}
