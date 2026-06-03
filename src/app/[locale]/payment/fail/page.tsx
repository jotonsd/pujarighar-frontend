'use client'
import { useSearchParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import Link from 'next/link'

export default function PaymentFailPage() {
  const locale       = useLocale()
  const searchParams = useSearchParams()
  const orderId      = searchParams.get('order_id')

  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="card space-y-4">
        <p className="text-6xl">❌</p>
        <h1 className="text-2xl font-bold text-gray-800">
          {locale === 'bn' ? 'পেমেন্ট ব্যর্থ হয়েছে' : 'Payment Failed'}
        </h1>
        <p className="text-gray-600">
          {locale === 'bn'
            ? 'আপনার পেমেন্ট সম্পন্ন হয়নি। অনুগ্রহ করে আবার চেষ্টা করুন।'
            : 'Your payment could not be completed. Please try again.'}
        </p>
        {orderId && (
          <Link
            href={`/${locale}/orders/${orderId}`}
            className="btn-secondary inline-block"
          >
            {locale === 'bn' ? 'অর্ডার দেখুন' : 'View Order'}
          </Link>
        )}
        <Link href={`/${locale}/cart`} className="btn-primary inline-block">
          {locale === 'bn' ? 'কার্টে ফিরে যান' : 'Back to Cart'}
        </Link>
      </div>
    </div>
  )
}
