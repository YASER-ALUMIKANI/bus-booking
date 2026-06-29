import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaEye, FaEyeSlash, FaGlobe, FaChevronDown } from 'react-icons/fa6'
import Logo from '../assets/logo.png'
import { getCsrfToken } from '../utils/csrf'

const API_MESSAGES = {
  loginFailed: 'رقم الجوال أو كلمة المرور غير صحيحة.',
  signupFailed: 'تعذر إنشاء الحساب. حاول مرة أخرى.',
  network: 'تعذر الاتصال بالخادم. حاول مرة أخرى.',
}

const normalizePhone = (value) => value.replace(/\D/g, '').slice(0, 15)
const normalizeCountryCode = (value) => value.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '').slice(0, 5)

const splitStoredPhone = (value) => {
  const digits = normalizePhone(value)
  if (digits.startsWith('967') && digits.length > 3) {
    return { countryCode: '+967', phone: digits.slice(3) }
  }
  return { countryCode: '+967', phone: digits }
}

const Home = () => {
  const [countryCode, setCountryCode] = useState('+967')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [mode, setMode] = useState('login')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [csrfToken, setCsrfToken] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const storedPhone = sessionStorage.getItem('clientPhone') || ''
    const parsedPhone = splitStoredPhone(storedPhone)
    setCountryCode(parsedPhone.countryCode)
    setPhone(parsedPhone.phone)

    const loadToken = async () => {
      setCsrfToken(await getCsrfToken())
    }
    loadToken()
  }, [])

  const submitLabel = useMemo(() => {
    if (status === 'sending') return mode === 'login' ? 'جاري الدخول...' : 'جاري إنشاء الحساب...'
    return mode === 'login' ? 'دخول' : 'إنشاء الحساب'
  }, [mode, status])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    const identifier = phone.trim()
    const isNumericOnly = /^\d+$/.test(identifier)

    // ponytail: If identifier contains non-digits (like 'manager'), route automatically to admin endpoint
    if (!isNumericOnly && identifier.length > 0) {
      if (password.length < 6) {
        setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل.')
        return
      }
      setStatus('sending')
      try {
        const response = await fetch('/api/admin/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken,
          },
          body: JSON.stringify({ username: identifier, password }),
        })
        const data = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(data.message || 'اسم المستخدم أو كلمة المرور غير صحيحة.')
        }
        localStorage.setItem('adminToken', data.token)
        localStorage.setItem('adminRole', data.role)
        localStorage.setItem('adminUsername', data.username)
        navigate('/admin')
      } catch (err) {
        setError(err.message || API_MESSAGES.network)
        setStatus('')
      }
      return
    }

    const cleanCountryCode = normalizePhone(countryCode)
    const cleanPhone = normalizePhone(phone)
    const fullPhone = `${cleanCountryCode}${cleanPhone}`
    if (cleanCountryCode.length < 1) {
      setError('أدخل كود الدولة.')
      return
    }
    if (cleanPhone.length < 7) {
      setError('أدخل رقم جوال صحيح.')
      return
    }
    if (fullPhone.length > 15) {
      setError('رقم الجوال مع كود الدولة يجب ألا يتجاوز 15 رقماً.')
      return
    }
    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل.')
      return
    }
    if (!csrfToken) {
      setError('تعذر تجهيز رمز الحماية. أعد تحميل الصفحة وحاول مرة أخرى.')
      return
    }

    setStatus('sending')
    try {
      const response = await fetch(mode === 'login' ? '/api/client/login' : '/api/client/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ phone: fullPhone, password }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.message || (mode === 'login' ? API_MESSAGES.loginFailed : API_MESSAGES.signupFailed))
      }

      sessionStorage.setItem('clientPhone', data.phone || fullPhone)
      sessionStorage.removeItem('clientName')
      navigate('/bus')
    } catch (err) {
      setError(err.message || API_MESSAGES.network)
      setStatus('')
    }
  }

  const isInputAdmin = phone.length > 0 && !/^\d+$/.test(phone)

  return (
    <main className="min-h-screen bg-white text-neutral-950" dir="rtl">
      <div className="relative mx-auto flex min-h-screen w-full max-w-[520px] flex-col overflow-hidden px-7 pb-9 pt-9">
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[48%] opacity-[0.055]"
          style={{
            backgroundImage:
              'linear-gradient(135deg, transparent 18%, #c59f3b 18%, #c59f3b 26%, transparent 26%), linear-gradient(45deg, transparent 18%, #c59f3b 18%, #c59f3b 26%, transparent 26%)',
            backgroundSize: '150px 150px',
            backgroundPosition: '0 0, 75px 0',
          }}
        />

        <header className="relative z-10 flex items-center justify-between text-[#bd9b45]">
          <button type="button" className="grid h-10 w-10 place-items-center rounded-full text-2xl" aria-label="تغيير اللغة">
            <FaGlobe />
          </button>
          <button type="button" className="grid h-7 w-7 place-items-center rounded-md bg-slate-700 text-xs text-white" aria-label="فتح القائمة">
            <FaChevronDown />
          </button>
        </header>

        <section className="relative z-10 flex flex-1 flex-col items-center">
          <img src={Logo} alt="يمن باص" className="mt-8 h-52 w-auto max-w-[78%] object-contain" />

          <h1 className="mt-5 text-center text-4xl font-bold text-[#c39c40]">تسجيل دخول</h1>

          <div className="mt-8 grid h-[58px] w-full grid-cols-2 rounded-full border border-neutral-200 bg-neutral-50 p-0.5 shadow-inner">
            <button
              type="button"
              className="rounded-full bg-[#efc04e] text-xl font-bold text-black shadow-sm"
            >
              الجوال
            </button>
            <button
              type="button"
              className="rounded-full text-xl font-bold text-neutral-400"
              disabled
              aria-disabled="true"
            >
              البريد الإلكتروني
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 w-full space-y-6">
            <div className={`grid ${isInputAdmin ? 'grid-cols-1' : 'grid-cols-[1fr_132px]'} items-end gap-4 transition-all duration-300`}>
              <label className="block">
                <span className="sr-only">رقم الجوال أو اسم المستخدم</span>
                <input
                  type="text"
                  value={phone}
                  onChange={(event) => {
                    const val = event.target.value
                    if (/^\d*$/.test(val)) {
                      setPhone(normalizePhone(val))
                    } else {
                      setPhone(val)
                    }
                  }}
                  required
                  placeholder="رقم الجوال أو اسم المستخدم"
                  className="h-[64px] w-full rounded-2xl border border-neutral-300 bg-white px-5 text-right text-2xl font-semibold text-[#b99a43] outline-none transition focus:border-[#c39c40] focus:ring-4 focus:ring-[#c39c40]/15"
                />
              </label>

              {!isInputAdmin && (
                <label className="block">
                  <span className="mb-2 block px-4 text-center text-lg font-medium text-[#b99a43]">كود الدولة</span>
                  <input
                    type="tel"
                    inputMode="tel"
                    dir="ltr"
                    value={countryCode}
                    onChange={(event) => setCountryCode(normalizeCountryCode(event.target.value))}
                    required
                    maxLength={5}
                    placeholder="+967"
                    className="h-[64px] w-full rounded-2xl border border-neutral-300 bg-white px-4 text-center text-2xl font-bold text-neutral-950 outline-none transition focus:border-[#c39c40] focus:ring-4 focus:ring-[#c39c40]/15 animate-fadeIn"
                  />
                </label>
              )}
            </div>

            <label className="relative block">
              <span className="sr-only">كلمة المرور</span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={6}
                placeholder="كلمة المرور"
                className="h-[64px] w-full rounded-2xl border border-neutral-300 bg-white px-5 pl-16 text-right text-2xl font-semibold text-[#b99a43] outline-none transition focus:border-[#c39c40] focus:ring-4 focus:ring-[#c39c40]/15"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute left-5 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center text-2xl text-neutral-500"
                aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </label>

            {mode === 'login' && !isInputAdmin && (
              <button type="button" className="text-right text-lg font-semibold text-[#b99a43]">
                هل نسيت كلمة المرور؟
              </button>
            )}

            {error && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>
            )}

            <div className="space-y-5 pt-3">
              <button
                type="submit"
                disabled={status === 'sending'}
                className="h-[66px] w-full rounded-xl bg-[#c6a044] text-2xl font-bold text-white shadow-lg shadow-[#c6a044]/25 transition hover:bg-[#b89238] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isInputAdmin ? 'دخول المسؤولين' : submitLabel}
              </button>

              {!isInputAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    sessionStorage.removeItem('clientPhone')
                    sessionStorage.removeItem('clientName')
                    navigate('/bus')
                  }}
                  className="h-[66px] w-full rounded-xl bg-black text-2xl font-bold text-white shadow-lg shadow-black/10 transition hover:bg-neutral-900"
                >
                  دخول كزائر
                </button>
              )}
            </div>
          </form>

          {!isInputAdmin && (
            <button
              type="button"
              onClick={() => {
                setError('')
                setStatus('')
                setMode((value) => (value === 'login' ? 'register' : 'login'))
              }}
              className="mt-8 text-center text-lg font-semibold text-[#837143] underline underline-offset-4"
            >
              {mode === 'login' ? 'ليس لديك حساب؟ قم بإنشاء حساب الآن!' : 'لديك حساب؟ تسجيل الدخول الآن!'}
            </button>
          )}

          <p className="mt-10 text-center text-lg text-neutral-900" dir="ltr">
            الإصدار : 2026-06-01 1.0.4.01
          </p>
        </section>
      </div>
    </main>
  )
}

export default Home
