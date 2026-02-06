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
    if (requiredRole === 'admin') {
      // Check admin authentication
      const adminToken = localStorage.getItem('adminToken')
      setIsAdmin(!!adminToken)
      setAdminLoading(false)
      
      if (!adminToken) {
        router.push('/admin/login')
      }
    } else {
      // Customer route - check regular auth
      if (!loading && !user) {
        router.push('/login')
      }
      setAdminLoading(false)
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
