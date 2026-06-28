export const getAdminUsers = async (token) => {
  const response = await fetch('/api/admin/users', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  if (!response.ok) {
    throw new Error('فشل جلب المستخدمين.')
  }
  return response.json()
}

export const createAdminUser = async (newUser, csrfToken, token) => {
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
  return data
}

export const deleteAdminUser = async (targetUsername, csrfToken, token) => {
  const response = await fetch(`/api/admin/danger/delete-admin/${targetUsername}`, {
    method: 'DELETE',
    headers: {
      'X-CSRF-Token': csrfToken,
      Authorization: `Bearer ${token}`
    }
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.message || 'فشلت عملية حذف المشرف.')
  }
  return data
}
