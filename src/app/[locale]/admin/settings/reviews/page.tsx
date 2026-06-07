"use client";

import {
  useGetPendingReviewsQuery,
  useApproveReviewMutation,
  useDeleteReviewMutation,
} from "@/api/reviews/reviewsApi";
import PageHeader from "@/components/ui/PageHeader";
import TableSkeleton from "@/components/ui/skeletons";
import { localName } from "@/utils/format";
import { toast } from "@/store/toastStore";
import { Check, Trash2 } from "lucide-react";
import { useLocale } from "next-intl";

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          className={`text-sm ${s <= rating ? "text-amber-400" : "text-gray-200"}`}
        >
          ★
        </span>
      ))}
    </span>
  );
}

export default function AdminReviewsPage() {
  const locale = useLocale();
  const isBn = locale === "bn";

  const { data: reviews = [], isLoading } = useGetPendingReviewsQuery();
  const [approveReview] = useApproveReviewMutation();
  const [deleteReview] = useDeleteReviewMutation();

  const handleApprove = async (id: string) => {
    try {
      await approveReview(id).unwrap();
      toast.success(isBn ? "রিভিউ অনুমোদিত হয়েছে" : "Review approved");
    } catch {
      toast.error(isBn ? "ব্যর্থ হয়েছে" : "Failed");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteReview(id).unwrap();
      toast.success(isBn ? "রিভিউ মুছে গেছে" : "Review deleted");
    } catch {
      toast.error(isBn ? "ব্যর্থ হয়েছে" : "Failed");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-3">
      <PageHeader
        title={isBn ? "পেন্ডিং রিভিউ" : "Pending Reviews"}
        description={
          isBn
            ? `অনুমোদনের অপেক্ষায় ${reviews.length}টি রিভিউ`
            : `${reviews.length} review${reviews.length !== 1 ? "s" : ""} awaiting approval`
        }
      />

      {isLoading ? (
        <TableSkeleton />
      ) : reviews.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-3">✅</p>
          <p className="text-sm font-medium">
            {isBn ? "কোনো পেন্ডিং রিভিউ নেই" : "No pending reviews"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="card flex flex-col sm:flex-row sm:items-start gap-4"
            >
              <div className="flex-1 space-y-1.5">
                <p className="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full w-fit">
                  {localName(review.product_name_bn, review.product_name_en, isBn)}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0">
                    {review.user_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-semibold text-gray-800 text-sm">
                    {review.user_name}
                  </span>
                  <StarDisplay rating={review.rating} />
                </div>
                {review.comment && (
                  <p className="text-sm text-gray-600 leading-relaxed pl-9">
                    {review.comment}
                  </p>
                )}
                <p className="text-xs text-gray-400 pl-9">
                  {new Date(review.created_at).toLocaleString(
                    isBn ? "bn-BD" : "en-US",
                  )}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => handleApprove(review.id)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  {isBn ? "অনুমোদন" : "Approve"}
                </button>
                <button
                  onClick={() => handleDelete(review.id)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {isBn ? "মুছুন" : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
