'use client'
import { useSearchParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import Link from 'next/link'

export default function PaymentSuccessPage() {
  const locale       = useLocale()
  const searchParams = useSearchParams()
  const orderId      = searchParams.get('order_id')
  const isBn         = locale === 'bn'

  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="card space-y-4">
        <p className="text-6xl">✅</p>
        <h1 className="text-2xl font-bold text-gray-800">
          {isBn ? 'পেমেন্ট সফল হয়েছে!' : 'Payment Successful!'}
        </h1>
        <p className="text-gray-600">
          {isBn
            ? 'আপনার পেমেন্ট গ্রহণ করা হয়েছে এবং অর্ডারটি নিশ্চিত করা হয়েছে।'
            : 'Your payment has been received and your order is confirmed.'}
        </p>
        {orderId && (
          <div className="flex flex-col gap-3">
            <Link href={`/${locale}/orders/${orderId}/tracking`} className="btn-primary">
              {isBn ? 'অর্ডার ট্র্যাক করুন' : 'Track Order'}
            </Link>
            <Link href={`/${locale}/orders/${orderId}`} className="btn-secondary">
              {isBn ? 'অর্ডার বিস্তারিত দেখুন' : 'View Order Details'}
            </Link>
          </div>
        )}
        <Link href={`/${locale}/products`} className="block text-sm text-amber-600 hover:underline">
          {isBn ? 'কেনাকাটা চালিয়ে যান' : 'Continue Shopping'}
        </Link>
      </div>
    </div>
  )
}
