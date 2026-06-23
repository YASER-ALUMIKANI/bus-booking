import { useState, useEffect } from 'react'
import { getCsrfToken } from '../utils/csrf'
import { fetchClientStatus as apiFetchClientStatus } from '../services/authApi'

export function useClientStatus() {
  const [passengerName, setPassengerName] = useState('')
  const [phone, setPhone] = useState('')
  const [verificationStatus, setVerificationStatus] = useState('unverified')
  const [csrfToken, setCsrfToken] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchStatus = async () => {
    try {
      const data = await apiFetchClientStatus()
      if (data.isLoggedIn) {
        setVerificationStatus(data.verificationStatus)
        if (data.fullname) {
          setPassengerName(data.fullname)
          sessionStorage.setItem('clientName', data.fullname)
        }
      }
    } catch (e) {
      // ignore
    }
  }

  useEffect(() => {
    const storedName = sessionStorage.getItem('clientName')
    const storedPhone = sessionStorage.getItem('clientPhone')
    if (storedName) setPassengerName(storedName)
    if (storedPhone) setPhone(storedPhone)

    const init = async () => {
      try {
        const token = await getCsrfToken()
        setCsrfToken(token)
        await fetchStatus()
      } catch (e) {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  return {
    passengerName,
    setPassengerName,
    phone,
    setPhone,
    verificationStatus,
    setVerificationStatus,
    csrfToken,
    setCsrfToken,
    fetchClientStatus: fetchStatus,
    loading
  }
}
export default useClientStatus
