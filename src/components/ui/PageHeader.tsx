"use client";

import { ArrowLeft, Plus } from "lucide-react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  onAdd?: () => void;
  addLabel?: string;
  showBack?: boolean;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
}

export default function PageHeader({
  title,
  description,
  onAdd,
  addLabel = "Add",
  showBack = false,
  backHref,
  backLabel,
  actions,
}: PageHeaderProps) {
  const router = useRouter();
  const locale = useLocale();
  const resolvedBackLabel = backLabel ?? (locale === "bn" ? "পিছনে" : "Back");

  return (
    <div className="bg-white rounded-lg shadow-sm px-5 py-3.5 mb-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900">{title}</h1>
          {description && (
            <p className="text-sm text-gray-500 mt-0.5">{description}</p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {showBack && (
            <button
              type="button"
              onClick={() => (backHref ? router.push(backHref) : router.back())}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {resolvedBackLabel}
            </button>
          )}
          {actions}
          {onAdd && (
            <button
              type="button"
              onClick={onAdd}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              {addLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
