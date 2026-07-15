"use client";

import { useGetBrandsQuery } from "@/api/brands/brandsApi";
import { useGetCategoriesQuery } from "@/api/categories/categoriesApi";
import { useGetProductsQuery } from "@/api/products/productsApi";
import OfferBanners from "@/components/products/OfferBanners";
import ProductCard from "@/components/products/ProductCard";
import { Checkbox, FloatingInput } from "@/components/ui/forms";
import { FilterPanelSkeleton, ProductCardSkeleton } from "@/components/ui/skeletons";
import { Product } from "@/lib/types";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const PRICE_MAX = 5000;

function CollapsibleSection({
  label,
  open,
  onToggle,
  children,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full group"
      >
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          {label}
        </p>
        <ChevronDown
          className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

function PriceRangeInputs({
  min,
  max,
  onApply,
  locale,
}: {
  min: number;
  max: number;
  onApply: (min: number, max: number) => void;
  locale: string;
}) {
  const [localMin, setLocalMin] = useState(min || "");
  const [localMax, setLocalMax] = useState(max >= PRICE_MAX ? "" : max);

  // Sync when slider changes externally
  useEffect(() => { setLocalMin(min || ""); }, [min]);
  useEffect(() => { setLocalMax(max >= PRICE_MAX ? "" : max); }, [max]);

  const isBn = locale === "bn";

  const apply = () => {
    const mn = localMin === "" ? 0 : Number(localMin);
    const mx = localMax === "" ? PRICE_MAX : Number(localMax);
    if (mn < mx) onApply(mn, mx);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          value={localMin}
          placeholder={isBn ? "সর্বনিম্ন" : "Min"}
          onChange={e => setLocalMin(e.target.value === "" ? "" : Number(e.target.value))}
          onKeyDown={e => e.key === "Enter" && apply()}
          className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-amber-400"
        />
        <span className="text-gray-400 shrink-0">—</span>
        <input
          type="number"
          min={0}
          value={localMax}
          placeholder={isBn ? "সর্বোচ্চ" : "Max"}
          onChange={e => setLocalMax(e.target.value === "" ? "" : Number(e.target.value))}
          onKeyDown={e => e.key === "Enter" && apply()}
          className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-amber-400"
        />
      </div>
      <button
        onClick={apply}
        className="w-full py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-colors"
      >
        {isBn ? "ফিল্টার করুন" : "Filter"}
      </button>
    </div>
  );
}

function PriceRangeSlider({
  min,
  max,
  onMinChange,
  onMaxChange,
}: {
  min: number;
  max: number;
  onMinChange: (v: number) => void;
  onMaxChange: (v: number) => void;
}) {
  const minPct = (min / PRICE_MAX) * 100;
  const maxPct = (max / PRICE_MAX) * 100;
  return (
    <div>
      <div className="relative h-5 flex items-center">
        <div className="absolute w-full h-1.5 bg-gray-200 rounded-full" />
        <div
          className="absolute h-1.5 bg-amber-400 rounded-full"
          style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }}
        />
        <input
          type="range"
          min={0}
          max={PRICE_MAX}
          step={50}
          value={min}
          onChange={e => {
            const v = Number(e.target.value);
            if (v < max) onMinChange(v);
          }}
          className="absolute w-full h-1.5 appearance-none bg-transparent cursor-pointer range-thumb"
        />
        <input
          type="range"
          min={0}
          max={PRICE_MAX}
          step={50}
          value={max}
          onChange={e => {
            const v = Number(e.target.value);
            if (v > min) onMaxChange(v);
          }}
          className="absolute w-full h-1.5 appearance-none bg-transparent cursor-pointer range-thumb"
        />
      </div>
      <style>{`
        .range-thumb { pointer-events: none; }
        .range-thumb::-webkit-slider-thumb { -webkit-appearance:none; pointer-events: all; width:16px; height:16px; border-radius:50%; background:#fff; border:2px solid #f59e0b; box-shadow:0 1px 4px rgba(0,0,0,.15); cursor:pointer; }
        .range-thumb::-moz-range-thumb    { pointer-events: all; width:16px; height:16px; border-radius:50%; background:#fff; border:2px solid #f59e0b; box-shadow:0 1px 4px rgba(0,0,0,.15); cursor:pointer; }
      `}</style>
    </div>
  );
}

interface Props {
  initialProducts?: Product[];
  initialTotalPages?: number;
}

export default function ProductsPageClient({ initialProducts = [], initialTotalPages = 1 }: Props) {
  const t = useTranslations();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get("search") ?? "";
  const urlCategory = searchParams.get("category") ?? "";
  const urlOffers = searchParams.get("offers") === "true";

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(urlSearch);
  const [categories, setCategories] = useState<string[]>(urlCategory ? [urlCategory] : []);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(PRICE_MAX);
  const [sortOrder, setSortOrder] = useState<"" | "newest" | "price_asc" | "price_desc" | "discount_asc" | "discount_desc">("");
  const [onlyOffers, setOnlyOffers] = useState(urlOffers);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(true);
  const [brandOpen, setBrandOpen] = useState(true);
  // Seeded from the server so the first paint already has real products —
  // avoids the skeleton flash and makes the first image LCP-discoverable.
  const [allProducts, setAllProducts] = useState<Product[]>(initialProducts);

  // Refs so scroll handler always reads latest values without re-registering
  const isFetchingRef = useRef(false);
  const hasMoreRef = useRef(false);

  // Skip the first run — the server already fetched page 1 matching these
  // exact URL params, so resetting here would wipe the seeded products.
  const isFirstUrlSync = useRef(true);
  useEffect(() => {
    if (isFirstUrlSync.current) {
      isFirstUrlSync.current = false;
      return;
    }
    setSearch(urlSearch);
    setCategories(urlCategory ? [urlCategory] : []);
    setOnlyOffers(urlOffers);
    setPage(1);
    setAllProducts([]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlSearch, urlCategory, searchParams.get("offers")]);

  const isPriceFiltered = priceMin > 0 || priceMax < PRICE_MAX;
  const hasFilter = !!(search || categories.length || selectedBrands.length || isPriceFiltered || sortOrder || onlyOffers);

  const resetFilters = () => {
    setSearch("");
    setCategories([]);
    setSelectedBrands([]);
    setPriceMin(0);
    setPriceMax(PRICE_MAX);
    setSortOrder("");
    setOnlyOffers(false);
    setPage(1);
    setAllProducts([]);
  };

  const toggleCategory = (id: string) => {
    setCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id],
    );
    setPage(1);
    setAllProducts([]);
  };

  const { data, isLoading, isFetching } = useGetProductsQuery({
    page,
    search,
    is_package: "false",
    category: categories.length ? categories.join(",") : undefined,
    brand: selectedBrands.length ? selectedBrands.join(",") : undefined,
    min_price: priceMin > 0 ? String(priceMin) : undefined,
    max_price: priceMax < PRICE_MAX ? String(priceMax) : undefined,
    ordering: sortOrder || undefined,
    has_discount: onlyOffers || undefined,
  });

  const { data: allCategories = [] } = useGetCategoriesQuery();
  const { data: allBrands = [] } = useGetBrandsQuery();

  const totalPages = data?.pagination?.total_pages ?? initialTotalPages;
  const hasMore = page < totalPages;

  // Keep refs in sync every render
  isFetchingRef.current = isFetching;
  hasMoreRef.current = hasMore;

  // Accumulate products — reset on page 1, append on subsequent pages
  useEffect(() => {
    if (!data?.data) return;
    setAllProducts(prev => (page === 1 ? data.data : [...prev, ...data.data]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // Window scroll — registered once, never fires on mount
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

  const FilterPanel = () => (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          {locale === "bn" ? "পণ্য খুঁজুন" : "Search"}
        </p>
        <FloatingInput
          label={locale === "bn" ? "নাম লিখুন" : "Product name"}
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setPage(1);
            setAllProducts([]);
          }}
        />
      </div>
      <div>
        <Checkbox
          checked={onlyOffers}
          onChange={() => { setOnlyOffers(p => !p); setPage(1); setAllProducts([]); }}
          label={locale === "bn" ? "শুধু অফার" : "Offers only"}
          variant="red"
          bold
        />
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          {locale === "bn" ? "সাজানো" : "Sort"}
        </p>
        <div className="space-y-2">
          {([
            { value: "newest",       en: "New Released",         bn: "নতুন পণ্য" },
            { value: "price_asc",    en: "Price - Low to High",  bn: "মূল্য: কম → বেশি" },
            { value: "price_desc",   en: "Price - High to Low",  bn: "মূল্য: বেশি → কম" },
            { value: "discount_asc", en: "Discount - Low to High", bn: "ডিসকাউন্ট: কম → বেশি" },
            { value: "discount_desc",en: "Discount - High to Low",  bn: "ডিসকাউন্ট: বেশি → কম" },
          ] as const).map(opt => (
            <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="radio"
                name="sort"
                value={opt.value}
                checked={sortOrder === opt.value}
                onChange={() => { setSortOrder(opt.value); setPage(1); setAllProducts([]); }}
                className="w-4 h-4 accent-amber-500 cursor-pointer"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900">
                {locale === "bn" ? opt.bn : opt.en}
              </span>
            </label>
          ))}
          {sortOrder && (
            <button
              onClick={() => { setSortOrder(""); setPage(1); setAllProducts([]); }}
              className="text-xs text-amber-600 hover:underline mt-1"
            >
              {locale === "bn" ? "বাতিল করুন" : "Clear"}
            </button>
          )}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          {locale === "bn" ? "মূল্য পরিসর" : "Price Range"}
        </p>
        <PriceRangeInputs
          min={priceMin}
          max={priceMax}
          locale={locale}
          onApply={(mn, mx) => { setPriceMin(mn); setPriceMax(mx); setPage(1); setAllProducts([]); }}
        />
        <div className="mt-3">
          <PriceRangeSlider
            min={priceMin}
            max={priceMax}
            onMinChange={v => { setPriceMin(v); setPage(1); setAllProducts([]); }}
            onMaxChange={v => { setPriceMax(v); setPage(1); setAllProducts([]); }}
          />
        </div>
      </div>
      <CollapsibleSection
        label={locale === "bn" ? "কেটাগরি" : "Category"}
        open={catOpen}
        onToggle={() => setCatOpen(p => !p)}
      >
        <div className="max-h-80 overflow-y-auto pr-1 space-y-0.5 scrollbar-thin">
          {allCategories.map(cat => (
            <Checkbox
              key={cat.id}
              checked={categories.includes(cat.id)}
              onChange={() => toggleCategory(cat.id)}
              label={locale === "bn" ? cat.name_bn : cat.name_en}
            />
          ))}
        </div>
        {categories.length > 0 && (
          <button
            onClick={() => { setCategories([]); setPage(1); setAllProducts([]); }}
            className="mt-2 text-xs text-amber-600 hover:underline"
          >
            {locale === "bn"
              ? `${categories.length}টি নির্বাচিত — মুছুন`
              : `${categories.length} selected — clear`}
          </button>
        )}
      </CollapsibleSection>
      {allBrands.length > 0 && (
        <CollapsibleSection
          label={locale === "bn" ? "ব্র্যান্ড" : "Brand"}
          open={brandOpen}
          onToggle={() => setBrandOpen(p => !p)}
        >
          <div className="space-y-0.5">
            {allBrands.map(brand => (
              <Checkbox
                key={brand.id}
                checked={selectedBrands.includes(brand.id)}
                onChange={() => {
                  setSelectedBrands(prev =>
                    prev.includes(brand.id) ? prev.filter(id => id !== brand.id) : [...prev, brand.id]
                  );
                  setPage(1);
                  setAllProducts([]);
                }}
                label={locale === "bn" ? brand.name_bn : brand.name_en}
              />
            ))}
          </div>
          {selectedBrands.length > 0 && (
            <button
              onClick={() => { setSelectedBrands([]); setPage(1); setAllProducts([]); }}
              className="mt-2 text-xs text-amber-600 hover:underline"
            >
              {locale === "bn"
                ? `${selectedBrands.length}টি নির্বাচিত — মুছুন`
                : `${selectedBrands.length} selected — clear`}
            </button>
          )}
        </CollapsibleSection>
      )}
      {hasFilter && (
        <button
          onClick={resetFilters}
          className="w-full flex items-center justify-center gap-2 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg border border-amber-100 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          {locale === "bn" ? "ফিল্টার মুছুন" : "Clear Filters"}
        </button>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-3">
      <div className="flex justify-end mb-4 lg:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4" />
          {locale === "bn" ? "ফিল্টার" : "Filters"}
          {hasFilter && <span className="w-2 h-2 rounded-full bg-amber-500" />}
        </button>
      </div>

      <OfferBanners />

      <div className="flex gap-3">
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sticky top-20">
            {isLoading && allProducts.length === 0 ? <FilterPanelSkeleton /> : <FilterPanel />}
          </div>
        </aside>

        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 w-72 bg-white z-50 lg:hidden overflow-y-auto shadow-xl">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <span className="font-semibold text-gray-800">
                  {locale === "bn" ? "ফিল্টার" : "Filters"}
                </span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5">
                <FilterPanel />
              </div>
            </div>
          </>
        )}

        <div className="flex-1 min-w-0">
          {/* Initial load / filter-change skeleton */}
          {(isLoading || isFetching) && allProducts.length === 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {allProducts.map((product, i) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    locale={locale}
                    priority={i < 2}
                  />
                ))}
                {isFetching && allProducts.length > 0 &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <ProductCardSkeleton key={`sk-${i}`} />
                  ))
                }
              </div>

              {!allProducts.length && !isFetching && (
                <div className="text-center py-16 text-gray-400">
                  <p className="text-4xl mb-4">🔍</p>
                  <p>{t("common.noData")}</p>
                  {hasFilter && (
                    <button
                      onClick={resetFilters}
                      className="mt-3 text-amber-600 hover:underline text-sm"
                    >
                      {locale === "bn" ? "ফিল্টার মুছুন" : "Clear filters"}
                    </button>
                  )}
                </div>
              )}

            </>
          )}
        </div>
      </div>
    </div>
  );
}
