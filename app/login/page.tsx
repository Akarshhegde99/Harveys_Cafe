'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: ''
  })
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  // Redirect if user is already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/menu')
    }
  }, [user, authLoading, router])

  // Show loading while checking auth status
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white font-grimpt text-xl">Loading...</div>
      </div>
    )
  }

  // Don't render login form if user is logged in
  if (user) {
    return null
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.email || !formData.password || (isSignUp && (!formData.name || !formData.phone))) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      if (isSignUp) {
        // Sign Up logic
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.name,
              phone: formData.phone,
            }
          }
        })

        if (error) {
          toast.error(error.message)
          return
        }

        if (data.user) {
          toast.success('Account created successfully!')
          // Depending on Supabase settings, user might need to verify email
          // or they might be signed in immediately
          if (data.session) {
            router.push('/menu')
          } else {
            toast('Please check your email for verification link', { icon: '📧' })
            setIsSignUp(false) // Switch to login
          }
        }
      } else {
        // Check if user is trying to login with admin credentials
        if (formData.email === 'admin@harveys.com') {
          toast.error('Please use the Admin Portal for admin access');
          setLoading(false);
          return;
        }

        // Login logic
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        })

        if (error) {
          toast.error(error.message)
          return
        }

        toast.success('Login successful!')
        router.push('/menu')
      }
    } catch (error) {
      toast.error(`${isSignUp ? 'Registration' : 'Login'} failed. Please try again.`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-grimpt-brush text-white mb-4">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-lg font-garet text-gray-300">
            {isSignUp ? 'Join us for extraordinary taste' : 'Enter your details to continue'}
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
          <form onSubmit={handleAuth} className="space-y-6">
            {isSignUp && (
              <>
                <div>
                  <label htmlFor="name" className="block text-white font-garet mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-gray-300 font-garet focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-white font-garet mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-gray-300 font-garet focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                    placeholder="Enter your phone number"
                    required
                  />
                </div>
              </>
            )}
            <div>
              <label htmlFor="email" className="block text-white font-garet mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-gray-300 font-garet focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                placeholder="Enter your email address"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-white font-garet mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-gray-300 font-garet focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-transparent border-2 border-white text-white font-grimpt text-xl font-bold py-3 rounded-lg hover:bg-white hover:text-[#eb3e04] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (isSignUp ? 'Creating Account...' : 'Logging in...') : (isSignUp ? 'Sign Up' : 'Login')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-white font-garet hover:underline"
            >
              {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}

