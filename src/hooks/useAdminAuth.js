import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCsrfToken } from '../utils/csrf'

export const useAdminAuth = () => {
  const [csrfToken, setCsrfToken] = useState('')
  const [role, setRole] = useState(localStorage.getItem('adminRole') || '')
  const navigate = useNavigate()

  const getToken = useCallback(() => localStorage.getItem('adminToken'), [])
  const getUsername = useCallback(() => localStorage.getItem('adminUsername') || 'manager', [])

  useEffect(() => {
    const loadToken = async () => {
      const token = await getCsrfToken()
      setCsrfToken(token)
    }
    loadToken()
  }, [])

  const handleLogout = useCallback(() => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminRole')
    localStorage.removeItem('adminUsername')
    navigate('/admin/login')
  }, [navigate])

  const verifyAuth = useCallback(() => {
    const token = getToken()
    const currentRole = localStorage.getItem('adminRole')
    if (!token || !currentRole) {
      handleLogout()
      return false
    }
    if (currentRole !== 'manager') {
      navigate('/admin')
      return false
    }
    return true
  }, [getToken, navigate, handleLogout])

  return useMemo(() => ({
    csrfToken,
    role,
    username: getUsername(),
    getToken,
    handleLogout,
    verifyAuth
  }), [csrfToken, role, getUsername, getToken, handleLogout, verifyAuth])
}
