'use client'

import { useLoginMutation } from '@/api/auth/authApi'
import { FloatingInput } from '@/components/ui/forms'
import { useAuthStore } from '@/store/authStore'
import { toast } from '@/store/toastStore'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LoginPage() {
  const t       = useTranslations()
  const locale  = useLocale()
  const router  = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)
  const isBn    = locale === 'bn'

  const [form, setForm] = useState({ identifier: '', password: '' })
  const [login, { isLoading }] = useLoginMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const data = await login(form).unwrap()
      setAuth(data.user, data.access, data.refresh)
      toast.success(isBn ? 'সফলভাবে লগইন হয়েছে' : 'Logged in successfully')
      const role = data.user?.role
      if (role === 'ADMIN' || role === 'WAREHOUSE') {
        router.push(`/${locale}/admin/orders/new`)
      } else {
        router.push(`/${locale}`)
      }
    } catch (err: unknown) {
      const e = err as { data?: { errors?: { details?: { message_bn?: string; message_en?: string } } } }
      toast.error(isBn
        ? (e.data?.errors?.details?.message_bn ?? 'লগইন ব্যর্থ হয়েছে')
        : (e.data?.errors?.details?.message_en ?? 'Login failed'))
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      {/* Left decorative panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-amber-500 to-amber-700 items-center justify-center relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute w-72 h-72 rounded-full bg-white/10 -top-16 -left-16" />
        <div className="absolute w-48 h-48 rounded-full bg-white/10 bottom-10 -right-10" />
        <div className="absolute w-32 h-32 rounded-full bg-amber-400/40 top-1/2 left-1/3" />
        <div className="relative z-10 text-center px-10">
          <p className="text-5xl mb-5">🪔</p>
          <h2 className="text-3xl font-bold text-white leading-snug">
            {isBn ? 'পূজারিঘরে স্বাগতম' : 'Welcome to PujariGhar'}
          </h2>
          <p className="mt-3 text-amber-100 text-sm leading-relaxed">
            {isBn
              ? 'পূজার সকল প্রয়োজনীয় সামগ্রী এক জায়গায়।'
              : 'All your puja essentials in one place.'}
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 bg-gray-50">
        <div className="w-full max-w-sm">
          {/* Logo — mobile only */}
          <div className="lg:hidden text-center mb-8">
            <p className="text-4xl mb-2">🪔</p>
            <h1 className="text-xl font-bold text-amber-600">PujariGhar</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              {isBn ? 'লগইন করুন' : 'Sign in'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {isBn ? 'আপনার অ্যাকাউন্টে প্রবেশ করুন' : 'Enter your account details below'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <FloatingInput
              label={isBn ? 'ইমেইল বা ফোন নম্বর' : 'Email or Phone Number'}
              required
              value={form.identifier}
              onChange={(e) => setForm({ ...form, identifier: e.target.value })}
              placeholder={isBn ? 'ইমেইল অথবা 01XXXXXXXXX' : 'Email or 01XXXXXXXXX'}
            />
            <FloatingInput
              label={t('auth.password')}
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3 text-base"
            >
              {isLoading
                ? (isBn ? 'প্রবেশ হচ্ছে...' : 'Signing in...')
                : (isBn ? 'লগইন করুন' : 'Sign In')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              {isBn ? 'অ্যাকাউন্ট নেই?' : "Don't have an account?"}{' '}
              <Link href={`/${locale}/auth/register`} className="text-amber-600 hover:text-amber-700 font-medium hover:underline">
                {isBn ? 'রেজিস্ট্রেশন করুন' : 'Register'}
              </Link>
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <Link
              href={`/${locale}`}
              className="flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              ← {isBn ? 'হোমে ফিরুন' : 'Back to Home'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
