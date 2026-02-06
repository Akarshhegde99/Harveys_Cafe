'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { Lock, Mail, Eye, EyeOff } from 'lucide-react'
import Image from 'next/image'

export default function AdminLogin() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Check if admin is already logged in
  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken')
    if (adminToken) {
      router.push('/admin/dashboard')
    }
  }, [router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields')
      return
    }

    setLoading(true)

    try {
      // Check admin credentials
      if (formData.email === 'admin@harveys.com' && formData.password === 'admin@123') {
        // Set admin token in localStorage
        localStorage.setItem('adminToken', 'admin-authenticated')
        localStorage.setItem('adminEmail', formData.email)
        
        // Request notification permissions for mobile alerts
        if ('Notification' in window) {
          try {
            const permission = await Notification.requestPermission()
            if (permission === 'granted') {
              toast.success('Admin login successful! Notifications enabled for new orders.')
            } else {
              toast.success('Admin login successful! Enable notifications for order alerts.')
            }
          } catch (error) {
            toast.success('Admin login successful!')
          }
        } else {
          toast.success('Admin login successful!')
        }
        
        router.push('/admin/dashboard')
      } else {
        toast.error('Invalid admin credentials')
      }
    } catch (error) {
      toast.error('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Image
              src="/logo.svg"
              alt="Harvey's Logo"
              width={120}
              height={120}
              className="mx-auto mb-6"
            />
          </motion.div>
          <motion.h1 
            className="text-4xl font-grimpt-brush text-white mb-4"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Admin Portal
          </motion.h1>
          <motion.p 
            className="text-lg font-garet text-gray-300"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            Secure access for administrators
          </motion.p>
        </div>

        <motion.div 
          className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-white font-garet mb-2">
                <Mail className="inline w-4 h-4 mr-2" />
                Admin Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-gray-300 font-garet focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                placeholder="admin@harveys.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-white font-garet mb-2">
                <Lock className="inline w-4 h-4 mr-2" />
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 pr-12 rounded-lg bg-white/20 border border-white/30 text-white placeholder-gray-300 font-garet focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                  placeholder="Enter admin password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-300 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              className="w-full bg-transparent border-2 border-white text-white font-grimpt text-xl font-bold py-3 rounded-lg hover:bg-white hover:text-[#eb3e04] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Signing In...
                </div>
              ) : (
                'Sign In to Admin Panel'
              )}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm font-garet">
              Authorized personnel only
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
