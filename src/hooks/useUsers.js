import { useState, useCallback } from 'react'
import * as userService from '../services/userService'

export const useUsers = (auth) => {
  const [adminUsers, setAdminUsers] = useState([])
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'employee' })
  const [userMessage, setUserMessage] = useState('')
  const [userError, setUserError] = useState('')
  const [creatingUser, setCreatingUser] = useState(false)

  const { getToken, handleLogout, csrfToken } = auth

  const fetchAdminUsers = useCallback(async (token = getToken()) => {
    try {
      const data = await userService.getAdminUsers(token)
      setAdminUsers(data.users || [])
    } catch {
      setAdminUsers([])
    }
  }, [getToken])

  const handleCreateUser = useCallback(async (event) => {
    event.preventDefault()
    setUserError('')
    setUserMessage('')
    setCreatingUser(true)

    const token = getToken()
    if (!token) {
      handleLogout()
      return
    }

    try {
      if (!csrfToken) {
        throw new Error('فشل الحصول على رمز CSRF. حاول إعادة تحميل الصفحة.')
      }
      const data = await userService.createAdminUser(newUser, csrfToken, token)
      setUserMessage(data.message || 'تم إنشاء المستخدم بنجاح.')
      setNewUser({ username: '', password: '', role: 'employee' })
      fetchAdminUsers(token)
    } catch (err) {
      setUserError(err.message)
    } finally {
      setCreatingUser(false)
    }
  }, [getToken, handleLogout, csrfToken, newUser, fetchAdminUsers])

  const handleDeleteAdmin = useCallback(async (targetUsername) => {
    if (!window.confirm(`هل أنت متأكد من إلغاء وحذف صلاحيات المشرف (${targetUsername}) نهائياً؟`)) return
    const token = getToken()
    try {
      const data = await userService.deleteAdminUser(targetUsername, csrfToken, token)
      alert(data.message)
      fetchAdminUsers(token)
    } catch (err) {
      alert(err.message)
    }
  }, [getToken, csrfToken, fetchAdminUsers])

  return {
    adminUsers,
    newUser,
    setNewUser,
    userMessage,
    setUserMessage,
    userError,
    setUserError,
    creatingUser,
    fetchAdminUsers,
    handleCreateUser,
    handleDeleteAdmin
  }
}
