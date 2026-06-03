import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const AdminLogin = () => {
  const [username, setUsername] = useState('manager')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'فشل تسجيل الدخول.')
      }

      localStorage.setItem('adminToken', data.token)
      localStorage.setItem('adminRole', data.role)
      localStorage.setItem('adminUsername', data.username)
      navigate('/admin/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="pt-[8ch] min-h-[calc(100vh-8ch)] bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <div className="max-w-4xl mx-auto px-4 md:px-16 lg:px-28 py-16">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-10 shadow-sm">
          <h1 className="text-3xl font-bold mb-4">تسجيل دخول المسؤول</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            اختر دورك ثم أدخل كلمة المرور لتسجيل الدخول إلى لوحة التحكم.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">اسم المستخدم</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 px-4 py-3 text-neutral-900 dark:text-neutral-100 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900"
                placeholder="أدخل اسم المستخدم"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">كلمة المرور</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 px-4 py-3 text-neutral-900 dark:text-neutral-100 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900"
                placeholder="أدخل كلمة المرور"
              />
            </div>

            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-violet-600 px-8 py-3 text-white font-semibold hover:bg-violet-700 transition"
              disabled={loading}
            >
              {loading ? 'جارٍ تسجيل الدخول...' : 'تسجيل الدخول'}
            </button>
          </form>

          <div className="mt-6 text-sm text-neutral-500 dark:text-neutral-400 space-y-2">
            <p>بيانات الدخول التجريبية:</p>
            <p>مدير: اسم المستخدم manager، كلمة المرور admin123</p>
            <p>موظف: اسم المستخدم employee، كلمة المرور employee123</p>
          </div>
        </div>
      </div>
    </main>
  )
}

export default AdminLogin
