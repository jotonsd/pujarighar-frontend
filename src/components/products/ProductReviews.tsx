"use client";
import {
  useGetProductReviewsQuery,
  useGetEligibleOrderForProductQuery,
  useCreateReviewMutation,
} from "@/api/reviews/reviewsApi";
import { Review } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/store/toastStore";
import { useState } from "react";

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= rating ? "text-amber-400" : "text-gray-200"}>
          ★
        </span>
      ))}
    </span>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <span className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          className={`text-2xl transition-colors ${s <= (hover || value) ? "text-amber-400" : "text-gray-300"}`}
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

function ReviewCard({ review, isBn }: { review: Review; isBn: boolean }) {
  return (
    <div className="border border-gray-100 rounded-xl p-4 space-y-2 bg-gray-50">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm shrink-0">
            {review.user_name.charAt(0).toUpperCase()}
          </div>
          <span className="font-medium text-sm text-gray-700">{review.user_name}</span>
        </div>
        <StarDisplay rating={review.rating} />
      </div>
      {review.comment && (
        <p className="text-sm text-gray-600 leading-relaxed pl-10">{review.comment}</p>
      )}
      <p className="text-xs text-gray-400 pl-10">
        {new Date(review.created_at).toLocaleDateString(isBn ? "bn-BD" : "en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>
    </div>
  );
}

function AverageRating({ reviews, isBn }: { reviews: Review[]; isBn: boolean }) {
  if (reviews.length === 0) return null;
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  return (
    <div className="flex items-center gap-3 mb-4 p-4 bg-amber-50 border border-amber-100 rounded-xl">
      <span className="text-4xl font-bold text-amber-600">
        {avg.toLocaleString(isBn ? "bn-BD" : "en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
      </span>
      <div>
        <StarDisplay rating={Math.round(avg)} />
        <p className="text-xs text-gray-500 mt-1">
          {isBn
            ? `${reviews.length.toLocaleString("bn-BD")}টি রিভিউ`
            : `${reviews.length} review${reviews.length !== 1 ? "s" : ""}`}
        </p>
      </div>
    </div>
  );
}

function WriteReviewForm({
  productId,
  orderId,
  isBn,
}: {
  productId: string;
  orderId: string;
  isBn: boolean;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);
  const [createReview, { isLoading }] = useCreateReviewMutation();

  if (done) {
    return (
      <div className="p-4 bg-green-50 border border-green-100 rounded-xl text-sm text-green-700 font-medium">
        ✓ {isBn ? "রিভিউ জমা হয়েছে, অনুমোদনের পর দেখা যাবে।" : "Review submitted — it will appear after admin approval."}
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
      await createReview({ product_id: productId, order_id: orderId, rating, comment }).unwrap();
      setDone(true);
      toast.success(isBn ? "রিভিউ জমা হয়েছে" : "Review submitted");
    } catch {
      toast.error(isBn ? "রিভিউ দেওয়া যায়নি" : "Failed to submit review");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border border-amber-100 bg-amber-50 rounded-xl space-y-3">
      <p className="text-sm font-semibold text-gray-700">
        {isBn ? "আপনার রিভিউ দিন" : "Write Your Review"}
      </p>
      <StarPicker value={rating} onChange={setRating} />
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        placeholder={isBn ? "মন্তব্য লিখুন (ঐচ্ছিক)" : "Write a comment (optional)"}
        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
      />
      <button type="submit" disabled={isLoading} className="btn-primary text-sm py-2 px-4">
        {isLoading
          ? isBn ? "জমা হচ্ছে..." : "Submitting..."
          : isBn ? "জমা দিন" : "Submit"}
      </button>
    </form>
  );
}

function EligibleWriteSection({
  productId,
  isBn,
}: {
  productId: string;
  isBn: boolean;
}) {
  const { data, isLoading } = useGetEligibleOrderForProductQuery(productId);
  if (isLoading || !data?.order_id) return null;
  return <WriteReviewForm productId={productId} orderId={data.order_id} isBn={isBn} />;
}

export default function ProductReviews({
  productId,
  locale,
}: {
  productId: string;
  locale: string;
}) {
  const isBn = locale === "bn";
  const { isAuthenticated, user } = useAuthStore();
  const { data: reviews = [], isLoading } = useGetProductReviewsQuery(productId);

  const canReview = isAuthenticated && user?.role === "CUSTOMER";

  if (!isLoading && reviews.length === 0 && !canReview) return null;

  return (
    <div className="mt-8 space-y-4">
      {canReview && <EligibleWriteSection productId={productId} isBn={isBn} />}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : reviews.length > 0 ? (
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            {isBn ? "ক্রেতাদের রিভিউ" : "Customer Reviews"}
          </h2>
          <AverageRating reviews={reviews} isBn={isBn} />
          <div className="space-y-3">
            {reviews.map((r) => (
              <ReviewCard key={r.id} review={r} isBn={isBn} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
