"use client";
import {
  useCreateReviewMutation,
  useGetMyOrderReviewsQuery,
} from "@/api/reviews/reviewsApi";
import { Review, SalesOrderItem } from "@/lib/types";
import { localName } from "@/utils/format";
import { toast } from "@/store/toastStore";
import { useState } from "react";

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <span className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          className={`text-2xl transition-colors ${
            s <= (hover || value) ? "text-amber-400" : "text-gray-300"
          }`}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}
        >
          ★
        </button>
      ))}
    </span>
  );
}

function ReviewForm({
  item,
  orderId,
  locale,
  existingReview,
}: {
  item: SalesOrderItem;
  orderId: string;
  locale: string;
  existingReview: Review | undefined;
}) {
  const isBn = locale === "bn";
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [createReview, { isLoading }] = useCreateReviewMutation();

  const name = localName(item.product_name_bn, item.product_name_en, isBn);

  if (existingReview || submitted) {
    return (
      <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-100 rounded-xl">
        <span className="text-green-500 text-lg shrink-0">✓</span>
        <div>
          <p className="text-sm font-medium text-gray-700">{name}</p>
          <p className="text-xs text-green-600 mt-0.5">
            {isBn ? "রিভিউ দেওয়া হয়েছে" : "Review submitted"}
          </p>
          {(existingReview?.comment || submitted) && (
            <div className="flex gap-0.5 mt-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <span
                  key={s}
                  className={
                    s <= (existingReview?.rating ?? rating)
                      ? "text-amber-400 text-sm"
                      : "text-gray-200 text-sm"
                  }
                >
                  ★
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error(isBn ? "রেটিং দিন" : "Please select a rating");
      return;
    }
    try {
      await createReview({
        product_id: item.product,
        order_id: orderId,
        rating,
        comment,
      }).unwrap();
      setSubmitted(true);
      toast.success(isBn ? "রিভিউ জমা হয়েছে, অনুমোদনের পর দেখা যাবে।" : "Review submitted — visible after admin approval.");
    } catch {
      toast.error(isBn ? "রিভিউ দেওয়া যায়নি" : "Failed to submit review");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 border border-gray-100 rounded-xl space-y-3 bg-gray-50"
    >
      <p className="text-sm font-semibold text-gray-700">{name}</p>
      <StarPicker value={rating} onChange={setRating} />
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        placeholder={isBn ? "মন্তব্য লিখুন (ঐচ্ছিক)" : "Write a comment (optional)"}
        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
      />
      <button
        type="submit"
        disabled={isLoading}
        className="btn-primary text-sm py-2 px-4"
      >
        {isLoading
          ? isBn
            ? "জমা হচ্ছে..."
            : "Submitting..."
          : isBn
            ? "রিভিউ দিন"
            : "Submit Review"}
      </button>
    </form>
  );
}

export default function OrderReviewSection({
  orderId,
  items,
  locale,
}: {
  orderId: string;
  items: SalesOrderItem[];
  locale: string;
}) {
  const isBn = locale === "bn";
  const { data: myReviews = [] } = useGetMyOrderReviewsQuery(orderId);

  return (
    <div className="card mt-4">
      <h2 className="font-semibold text-gray-700 mb-4">
        {isBn ? "পণ্যের রিভিউ দিন" : "Review Your Products"}
      </h2>
      <div className="space-y-3">
        {items.map((item) => (
          <ReviewForm
            key={item.id}
            item={item}
            orderId={orderId}
            locale={locale}
            existingReview={myReviews.find((r) => r.product_id === item.product)}
          />
        ))}
      </div>
    </div>
  );
}
