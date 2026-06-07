'use client'

import { useRegisterMutation } from '@/api/auth/authApi'
import { FloatingInput } from '@/components/ui/forms'
import { useAuthStore } from '@/store/authStore'
import { toast } from '@/store/toastStore'
import { useLocale, useTranslations } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function RegisterPage() {
  const t       = useTranslations()
  const locale  = useLocale()
  const router  = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)
  const isBn    = locale === 'bn'

  const [form, setForm] = useState({ email: '', phone: '', password: '', full_name_bn: '', full_name_en: '' })
  const [register, { isLoading }] = useRegisterMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const data = await register(form).unwrap()
      setAuth(data.user, data.access, data.refresh)
      toast.success(isBn ? 'নিবন্ধন সফল হয়েছে' : 'Registration successful')
      router.push(`/${locale}`)
    } catch (err: unknown) {
      const e = err as { data?: { errors?: { details?: { message_bn?: string; message_en?: string } } } }
      toast.error(isBn
        ? (e.data?.errors?.details?.message_bn ?? 'নিবন্ধন ব্যর্থ হয়েছে')
        : (e.data?.errors?.details?.message_en ?? 'Registration failed'))
    }
  }

  const f = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [key]: e.target.value })

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      {/* Left decorative panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-amber-500 to-amber-700 items-center justify-center relative overflow-hidden">
        <div className="absolute w-72 h-72 rounded-full bg-white/10 -top-16 -left-16" />
        <div className="absolute w-48 h-48 rounded-full bg-white/10 bottom-10 -right-10" />
        <div className="absolute w-32 h-32 rounded-full bg-amber-400/40 top-1/2 left-1/3" />
        <div className="relative z-10 text-center px-10">
          <Image src="/assets/logo/favicon.png" alt="PujariGhar" width={0} height={0} sizes="100vw" className="h-16 w-auto mx-auto mb-5" />
          <h2 className="text-3xl font-bold text-white leading-snug">
            {isBn ? 'যোগ দিন আমাদের সাথে' : 'Join PujariGhar'}
          </h2>
          <p className="mt-3 text-amber-100 text-sm leading-relaxed">
            {isBn
              ? 'নিবন্ধন করুন এবং সেরা পূজার সামগ্রী উপভোগ করুন।'
              : 'Register and enjoy the best puja essentials.'}
          </p>
          <div className="mt-6 flex flex-col gap-2 text-left">
            {[
              isBn ? '✓ দ্রুত চেকআউট' : '✓ Fast checkout',
              isBn ? '✓ অর্ডার ট্র্যাকিং' : '✓ Order tracking',
              isBn ? '✓ বিশেষ অফার' : '✓ Exclusive offers',
            ].map(item => (
              <span key={item} className="text-amber-100 text-sm">{item}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-3/5 flex items-center justify-center px-6 py-12 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Logo — mobile only */}
          <div className="lg:hidden text-center mb-8">
            <Image src="/assets/logo/pujarighar.png" alt="PujariGhar" width={0} height={0} sizes="100vw" className="h-14 w-auto mx-auto" />
          </div>

          <div className="mb-7">
            <h2 className="text-2xl font-bold text-gray-900">
              {isBn ? 'নতুন অ্যাকাউন্ট তৈরি করুন' : 'Create your account'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {isBn ? 'নিচে আপনার তথ্য পূরণ করুন' : 'Fill in your details below to get started'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FloatingInput
                label={t('auth.fullNameBn')}
                required
                value={form.full_name_bn}
                onChange={f('full_name_bn')}
              />
              <FloatingInput
                label={t('auth.fullNameEn')}
                value={form.full_name_en}
                onChange={f('full_name_en')}
              />
            </div>
            <FloatingInput
              label={t('auth.email')}
              type="email"
              required
              value={form.email}
              onChange={f('email')}
            />
            <FloatingInput
              label={t('auth.phone')}
              required
              value={form.phone}
              onChange={f('phone')}
              placeholder="01XXXXXXXXX"
            />
            <FloatingInput
              label={t('auth.password')}
              type="password"
              required
              value={form.password}
              onChange={f('password')}
            />

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3 text-base"
            >
              {isLoading
                ? (isBn ? 'নিবন্ধন হচ্ছে...' : 'Creating account...')
                : (isBn ? 'নিবন্ধন করুন' : 'Create Account')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              {isBn ? 'ইতিমধ্যে অ্যাকাউন্ট আছে?' : 'Already have an account?'}{' '}
              <Link href={`/${locale}/auth/login`} className="text-amber-600 hover:text-amber-700 font-medium hover:underline">
                {isBn ? 'লগইন করুন' : 'Sign in'}
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
