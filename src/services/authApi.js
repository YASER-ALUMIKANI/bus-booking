export async function clientRegister(phone, password, csrfToken) {
  const res = await fetch('/api/client/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    body: JSON.stringify({ phone, password }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'فشل إنشاء الحساب.')
  }
  return res.json()
}

export async function clientLogin(phone, password, csrfToken) {
  const res = await fetch('/api/client/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    body: JSON.stringify({ phone, password }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'فشل تسجيل الدخول.')
  }
  return res.json()
}

export async function clientLogout(csrfToken) {
  const res = await fetch('/api/client/logout', {
    method: 'POST',
    headers: {
      'X-CSRF-Token': csrfToken,
    },
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'فشل تسجيل الخروج.')
  }
  return res.json()
}

export async function fetchClientStatus() {
  const res = await fetch('/api/client/status')
  if (!res.ok) {
    throw new Error('فشل جلب حالة الحساب.')
  }
  return res.json()
}

export async function deleteClientAccount(csrfToken) {
  const res = await fetch('/api/client/delete-account', {
    method: 'POST',
    headers: {
      'X-CSRF-Token': csrfToken,
    },
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'حدث خطأ أثناء حذف الحساب.')
  }
  return res.json()
}

export async function adminLogin(username, password) {
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'اسم المستخدم أو كلمة المرور غير صحيحة.')
  }
  return res.json()
}
