'use client'

import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  email: string
}

interface AuthContextType {
  user: User | null
  userDetails: {
    name: string
    email: string
    phone: string
  } | null
  loading: boolean
  signOut: () => Promise<void>
  checkAuth: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userDetails, setUserDetails] = useState<{
    name: string
    email: string
    phone: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const prevEmailRef = useRef<string | null>(null)

  const checkAuth = () => {
    if (typeof window === 'undefined') {
      setLoading(false)
      return
    }

    const userToken = localStorage.getItem('userToken')
    if (userToken === 'user-authenticated') {
      const email = localStorage.getItem('userEmail') || ''
      const name = localStorage.getItem('userName') || ''
      const phone = localStorage.getItem('userPhone') || ''

      // Only update state if email actually changed or user is null
      if (prevEmailRef.current !== email || !user) {
        prevEmailRef.current = email
        setUser({ email })
        setUserDetails({
          name,
          email,
          phone
        })
      }
    } else {
      if (prevEmailRef.current !== null) {
        prevEmailRef.current = null
        setUser(null)
        setUserDetails(null)
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    checkAuth()

    // Listen for storage changes (for cross-tab sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userToken') {
        checkAuth()
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorageChange)
      }
    }
  }, [user])

  const signOut = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userToken')
      localStorage.removeItem('userEmail')
      localStorage.removeItem('userName')
      localStorage.removeItem('userPhone')
    }
    setUser(null)
    setUserDetails(null)
    router.push('/login')
  }

  const value = {
    user,
    userDetails,
    loading,
    signOut,
    checkAuth
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
