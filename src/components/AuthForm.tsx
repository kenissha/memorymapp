'use client'

import React, { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { X, Mail, Lock, User, Heart } from 'lucide-react'

interface AuthFormProps {
  onClose: () => void
  onSuccess: () => void
}

export default function AuthForm({ onClose, onSuccess }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (isLogin) {
        // Login
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (error) {
          setMessage(`Giriş hatası: ${error.message}`)
          return
        }

        if (data.user) {
          setMessage('Giriş başarılı! ✨')
          onSuccess()
          onClose()
        }
      } else {
        // Signup
        const { data, error } = await supabase.auth.signUp({
          email,
          password
        })

        if (error) {
          setMessage(`Kayıt hatası: ${error.message}`)
          return
        }

        if (data.user) {
          // Create user profile in public.users table
          const { error: profileError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              email: data.user.email || '',
              username: username || data.user.email?.split('@')[0] || 'user'
            })

          if (profileError) {
            console.error('Profile creation error:', profileError)
            setMessage('Hesap oluşturuldu ama profilde sorun var. Devam edebilirsin.')
          } else {
            setMessage('Kayıt başarılı! Artık anılarını ekleyebilirsin ✨')
          }

          onSuccess()
          onClose()
        }
      }
    } catch (error) {
      console.error('Auth error:', error)
      setMessage('Beklenmeyen bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl max-w-md w-full mx-4 p-8 shadow-2xl border border-pink-100">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
              <Heart className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {isLogin ? 'Hoş Geldin' : 'Aramıza Katıl'}
              </h2>
              <p className="text-sm text-gray-600">
                {isLogin ? 'Anılarına devam et' : 'Anılarını kaydetmeye başla'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex border border-gray-200 rounded-xl mb-6 p-1">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              isLogin
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Giriş Yap
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              !isLogin
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Kayıt Ol
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <User size={16} className="text-purple-500" />
                Kullanıcı Adı
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required={!isLogin}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                placeholder="Nasıl çağıralım seni?"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Mail size={16} className="text-blue-500" />
              E-posta
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
              placeholder="ornek@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Lock size={16} className="text-green-500" />
              Şifre
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
              placeholder="En az 6 karakter"
            />
          </div>

          {message && (
            <div className={`p-3 rounded-xl text-sm ${
              message.includes('başarılı') || message.includes('✨')
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 font-medium shadow-md"
          >
            {loading ? 'İşleniyor...' : (isLogin ? 'Giriş Yap ✨' : 'Hesap Oluştur 🎉')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            {isLogin ? 'Hesabın yok mu?' : 'Zaten hesabın var mı?'}{' '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-pink-600 hover:text-pink-700 font-medium"
            >
              {isLogin ? 'Kayıt ol' : 'Giriş yap'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
} 