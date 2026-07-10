"use client";

import { useGetCategoriesQuery } from "@/api/categories/categoriesApi";
import { useGetProductsQuery } from "@/api/products/productsApi";
import OfferBanners from "@/components/products/OfferBanners";
import PackageCard from "@/components/products/PackageCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { Product } from "@/lib/types";
import { useLocale } from "next-intl";
import { useEffect, useRef, useState } from "react";

export default function PackagesPageClient() {
  const locale = useLocale();
  const isBn = locale === "bn";

  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [allPackages, setAllPackages] = useState<Product[]>([]);

  const isFetchingRef = useRef(false);
  const hasMoreRef = useRef(false);

  const { data: allCategories = [] } = useGetCategoriesQuery();

  // Fetch all packages (unfiltered) once to derive which categories have packages
  const { data: allPackagesData } = useGetProductsQuery({ is_package: "true", page: 1, page_size: 100 });
  const availableCategories = allCategories.filter(cat =>
    (allPackagesData?.data ?? []).some((pkg: Product) => pkg.category === cat.id)
  );

  const { data, isLoading, isFetching } = useGetProductsQuery({
    page,
    is_package: "true",
    category: selectedCategory || undefined,
  });

  const totalPages = data?.pagination?.total_pages ?? 1;
  const hasMore = page < totalPages;

  isFetchingRef.current = isFetching;
  hasMoreRef.current = hasMore;

  useEffect(() => {
    if (!data?.data) return;
    setAllPackages(prev => (page === 1 ? data.data : [...prev, ...data.data]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  useEffect(() => {
    const onScroll = () => {
      const nearBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 300;
      if (nearBottom && !isFetchingRef.current && hasMoreRef.current) {
        setPage(prev => prev + 1);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const selectCategory = (id: string) => {
    setSelectedCategory(id);
    setPage(1);
    setAllPackages([]);
  };

  const CardSkeleton = () => (
    <div className="card p-0 overflow-hidden flex flex-col">
      <Skeleton className="h-56 w-full rounded-none" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-3">
      <div className="mb-6">
        <OfferBanners />
      </div>

      {/* Category tabs */}
      {availableCategories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-none">
          <button
            onClick={() => selectCategory("")}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              selectedCategory === ""
                ? "bg-amber-500 text-white border-amber-500"
                : "bg-white text-gray-600 border-gray-200 hover:border-amber-400 hover:text-amber-600"
            }`}
          >
            {isBn ? "সব" : "All"}
          </button>
          {availableCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => selectCategory(cat.id)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                selectedCategory === cat.id
                  ? "bg-amber-500 text-white border-amber-500"
                  : "bg-white text-gray-600 border-gray-200 hover:border-amber-400 hover:text-amber-600"
              }`}
            >
              {isBn ? cat.name_bn : cat.name_en}
            </button>
          ))}
        </div>
      )}

      {isLoading && allPackages.length === 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          {allPackages.length === 0 && !isFetching ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-4xl mb-3">🎁</p>
              <p>{isBn ? "কোনো প্যাকেজ নেই" : "No packages available"}</p>
              {selectedCategory && (
                <button
                  onClick={() => selectCategory("")}
                  className="mt-3 text-amber-600 hover:underline text-sm"
                >
                  {isBn ? "সব দেখুন" : "View all"}
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {allPackages.map(pkg => (
                <PackageCard key={pkg.id} pkg={pkg} locale={locale} />
              ))}
              {isFetching && allPackages.length > 0 &&
                Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={`sk-${i}`} />)
              }
            </div>
          )}
        </>
      )}
    </div>
  );
}
