'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

interface UserDetails {
  name: string
  email: string
  phone: string
}

interface AuthContextType {
  user: User | null
  userDetails: UserDetails | null
  loading: boolean
  signOut: () => Promise<void>
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const checkAuth = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error

      if (session?.user) {
        setUser(session.user)
        // For now, we'll use the user metadata for name and phone if available, 
        // or just set defaults. In a real app, you might fetch this from a 'profiles' table.
        setUserDetails({
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
          phone: session.user.user_metadata?.phone || session.user.phone || ''
        })
      } else {
        setUser(null)
        setUserDetails(null)
      }
    } catch (error) {
      console.error('Error checking auth:', error)
      setUser(null)
      setUserDetails(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Initial check
    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event)
      if (session?.user) {
        setUser(session.user)
        setUserDetails({
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
          phone: session.user.user_metadata?.phone || session.user.phone || ''
        })
      } else {
        setUser(null)
        setUserDetails(null)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
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

