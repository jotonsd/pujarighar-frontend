"use client";

import { useGetMeQuery } from "@/api/auth/authApi";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = useLocale();
  const router = useRouter();
  // Live check against the backend instead of trusting middleware.ts's cookie
  // snapshot — that cookie is only as fresh as the last client-side getMe()
  // call, so a role granted/changed moments ago could otherwise still 403 here.
  const { data: me, isLoading, isError, error } = useGetMeQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  const roleCode = me?.role.code ?? null;
  const forbidden = !!me && (roleCode === "CUSTOMER" || roleCode === "DELIVERY");
  const noSession = isError && "status" in error! && error.status === 401;

  useEffect(() => {
    if (noSession) {
      router.replace(`/${locale}/auth/login`);
    } else if (forbidden) {
      router.replace(`/${locale}/403`);
    }
  }, [noSession, forbidden, locale, router]);

  if (isLoading || noSession || forbidden) {
    return <div className="min-h-[calc(100vh-4rem)]" />;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 pt-3">
        {children}
      </div>
    </div>
  );
}
