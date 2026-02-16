'use client'

import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'customer' | 'admin'
}

export default function ProtectedRoute({ children, requiredRole = 'customer' }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [adminLoading, setAdminLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (!loading) {
      if (requiredRole === 'admin') {
        const isUserAdmin = user?.email === 'admin@harveys.com'
        setIsAdmin(isUserAdmin)
        setAdminLoading(false)

        if (!isUserAdmin) {
          router.push('/admin/login')
        }
      } else {
        // Customer route - check regular auth
        if (!user) {
          router.push('/login')
        } else if (user.email === 'admin@harveys.com') {
          // Admin cannot be a customer
          router.push('/admin/dashboard')
        }
        setAdminLoading(false)
      }
    }
  }, [user, loading, router, requiredRole])


  if (loading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white font-grimpt text-xl">Loading...</div>
      </div>
    )
  }

  if (requiredRole === 'admin' && !isAdmin) {
    return null
  }

  if (requiredRole === 'customer' && !user) {
    return null
  }

  return <>{children}</>
}
