"use client";
import { useLocale } from "next-intl";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function PaymentCancelPage() {
  const locale = useLocale();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const isBn = locale === "bn";

  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="card space-y-4">
        <p className="text-6xl">🚫</p>
        <h1 className="text-2xl font-bold text-gray-800">
          {isBn ? "পেমেন্ট বাতিল করা হয়েছে" : "Payment Cancelled"}
        </h1>
        <p className="text-gray-600">
          {isBn
            ? "আপনি পেমেন্ট বাতিল করেছেন। অর্ডারটি পেন্ডিং অবস্থায় আছে।"
            : "You cancelled the payment. Your order is still pending."}
        </p>
        {orderId && (
          <Link
            href={`/${locale}/orders/${orderId}/tracking`}
            className="btn-secondary inline-block"
          >
            {isBn ? "অর্ডার অবস্থা দেখুন" : "View Order Status"}
          </Link>
        )}
        <Link href={`/${locale}/cart`} className="btn-primary inline-block">
          {isBn ? "কার্টে ফিরে যান" : "Back to Cart"}
        </Link>
        <p className="text-xs text-gray-400">
          {isBn
            ? "পরে পেমেন্ট করতে অর্ডার ট্র্যাক পেজ থেকে পুনরায় চেষ্টা করুন।"
            : "To complete payment later, use the order track page to retry."}
        </p>
      </div>
    </div>
  );
}
