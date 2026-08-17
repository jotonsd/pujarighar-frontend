"use client";

import { useGetBrandsQuery } from "@/api/brands/brandsApi";
import { useGetCategoriesQuery } from "@/api/categories/categoriesApi";
import { useGetProductsQuery } from "@/api/products/productsApi";
import ProductCard from "@/components/products/ProductCard";
import { BADGE_STYLE } from "@/components/products/ProductBadges";
import { Checkbox, FloatingInput } from "@/components/ui/forms";
import { FilterPanelSkeleton, ProductCardSkeleton } from "@/components/ui/skeletons";
import { Brand, Category, Product } from "@/lib/types";
import { ChevronDown, PackageSearch, SlidersHorizontal, X } from "lucide-react";
import { useLocale } from "next-intl";
import { usePathname, useSearchParams } from "next/navigation";
import { ReactNode, useEffect, useRef, useState } from "react";

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
        className="w-full py-1.5 rounded-lg bg-amber-600 hover:bg-amber-600 text-white text-xs font-semibold transition-colors"
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
  initialCategories?: Category[];
  initialBrands?: Brand[];
  offerBanners?: ReactNode;
}

export default function ProductsPageClient({
  initialProducts = [],
  initialTotalPages = 1,
  initialCategories = [],
  initialBrands = [],
  offerBanners,
}: Props) {
  const locale = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get("search") ?? "";
  const urlCategory = searchParams.get("category") ?? "";
  const urlBrand = searchParams.get("brand") ?? "";
  const urlOffers = searchParams.get("offers") === "true";
  const urlOrdering = searchParams.get("ordering") ?? "";
  const urlBadges = searchParams.get("badges") ?? "";
  const urlMinPrice = Number(searchParams.get("min_price") ?? 0) || 0;
  const urlMaxPrice = Number(searchParams.get("max_price") ?? PRICE_MAX) || PRICE_MAX;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(urlSearch);
  const [categories, setCategories] = useState<string[]>(urlCategory ? urlCategory.split(",") : []);
  const [selectedBrands, setSelectedBrands] = useState<string[]>(urlBrand ? urlBrand.split(",") : []);
  const [selectedBadges, setSelectedBadges] = useState<string[]>(urlBadges ? urlBadges.split(",") : []);
  const [priceMin, setPriceMin] = useState(urlMinPrice);
  const [priceMax, setPriceMax] = useState(urlMaxPrice);
  const [sortOrder, setSortOrder] = useState<"" | "newest" | "price_asc" | "price_desc" | "discount_asc" | "discount_desc">(
    urlOrdering as "" | "newest" | "price_asc" | "price_desc" | "discount_asc" | "discount_desc",
  );
  const [onlyOffers, setOnlyOffers] = useState(urlOffers);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(true);
  const [brandOpen, setBrandOpen] = useState(true);
  // Seeded from the server so the first paint already has real products —
  // avoids the skeleton flash and makes the first image LCP-discoverable.
  const [allProducts, setAllProducts] = useState<Product[]>(initialProducts);

  // Refs so the observer callback always reads latest values without re-registering
  const isFetchingRef = useRef(false);
  const hasMoreRef = useRef(false);
  const allProductsLenRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Tracks the querystring WE last wrote (below) — lets the inbound sync
  // skip reacting to our own writes (which would otherwise immediately
  // bounce back into a redundant, flicker-causing state reset), while still
  // reacting to genuine external URL changes (browser back/forward, an
  // incoming link with different filters already in it).
  const lastSelfWrittenQs = useRef<string | null>(null);

  // Skip the first run — the server already fetched page 1 matching these
  // exact URL params, so resetting here would wipe the seeded products.
  const isFirstUrlSync = useRef(true);
  useEffect(() => {
    if (isFirstUrlSync.current) {
      isFirstUrlSync.current = false;
      return;
    }
    if (searchParams.toString() === lastSelfWrittenQs.current) return;
    setSearch(urlSearch);
    setCategories(urlCategory ? urlCategory.split(",") : []);
    setSelectedBrands(urlBrand ? urlBrand.split(",") : []);
    setOnlyOffers(urlOffers);
    setSortOrder(urlOrdering as "" | "newest" | "price_asc" | "price_desc" | "discount_asc" | "discount_desc");
    setSelectedBadges(urlBadges ? urlBadges.split(",") : []);
    setPriceMin(urlMinPrice);
    setPriceMax(urlMaxPrice);
    setPage(1);
    setAllProducts([]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlSearch, urlCategory, urlBrand, searchParams.get("offers"), urlOrdering, urlBadges, urlMinPrice, urlMaxPrice]);

  // Outbound: reflect the current filter state into the URL so it's
  // bookmarkable/shareable/refresh-safe — skips its own first run since the
  // state was already seeded from the URL at that point (nothing changed).
  //
  // Deliberately NOT router.replace(): this page reads searchParams
  // server-side (dynamic = "force-dynamic"), so a router-driven URL change
  // makes Next re-run the Server Component and re-render the page tree on
  // every single filter click — fighting with the client-side RTK Query
  // fetch/pagination state that's already handling the filter change on its
  // own, and breaking the very pagination this was meant to go alongside.
  // A raw History API write updates the address bar (shareable, and
  // restorable on a real page reload) without triggering any of that.
  const isFirstOutboundSync = useRef(true);
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (categories.length) params.set("category", categories.join(","));
    if (selectedBrands.length) params.set("brand", selectedBrands.join(","));
    if (selectedBadges.length) params.set("badges", selectedBadges.join(","));
    if (priceMin > 0) params.set("min_price", String(priceMin));
    if (priceMax < PRICE_MAX) params.set("max_price", String(priceMax));
    if (sortOrder) params.set("ordering", sortOrder);
    if (onlyOffers) params.set("offers", "true");
    const qs = params.toString();

    if (isFirstOutboundSync.current) {
      isFirstOutboundSync.current = false;
      lastSelfWrittenQs.current = qs;
      return;
    }
    lastSelfWrittenQs.current = qs;
    window.history.replaceState(null, "", `${pathname}${qs ? `?${qs}` : ""}`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, categories, selectedBrands, selectedBadges, priceMin, priceMax, sortOrder, onlyOffers]);

  const isPriceFiltered = priceMin > 0 || priceMax < PRICE_MAX;
  const hasFilter = !!(search || categories.length || selectedBrands.length || isPriceFiltered || sortOrder || onlyOffers || selectedBadges.length);

  const resetFilters = () => {
    setSearch("");
    setCategories([]);
    setSelectedBrands([]);
    setPriceMin(0);
    setPriceMax(PRICE_MAX);
    setSortOrder("");
    setOnlyOffers(false);
    setSelectedBadges([]);
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

  const toggleBadge = (code: string) => {
    setSelectedBadges(prev =>
      prev.includes(code) ? prev.filter(b => b !== code) : [...prev, code],
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
    badges: selectedBadges.length ? selectedBadges.join(",") : undefined,
  });

  const { data: allCategories = initialCategories } = useGetCategoriesQuery();
  const { data: allBrands = initialBrands } = useGetBrandsQuery();

  const totalPages = data?.pagination?.total_pages ?? initialTotalPages;
  const hasMore = page < totalPages;

  // Keep refs in sync every render
  isFetchingRef.current = isFetching;
  hasMoreRef.current = hasMore;
  allProductsLenRef.current = allProducts.length;

  // Accumulate products — reset on page 1, append on subsequent pages
  useEffect(() => {
    if (!data?.data) return;
    setAllProducts(prev => (page === 1 ? data.data : [...prev, ...data.data]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // A sentinel placed right after the product grid, observed via
  // IntersectionObserver — triggers the next page once it's within 300px of
  // the viewport. Unlike measuring against document.scrollHeight, this is
  // anchored to the grid's own position, so a tall footer below it can never
  // delay the trigger (the old scrollHeight-based check counted the footer's
  // height as part of "the bottom," so on mobile — where the footer stacks
  // much taller — the page had to scroll well past the grid, into the
  // footer, before the next page loaded).
  //
  // Runs once (empty deps) — the sentinel div is now rendered unconditionally
  // (see below, outside the skeleton/content ternary) so it's a permanently
  // stable DOM node for the observer's whole lifetime. It used to live only
  // inside the "real content" branch and re-attach on every `isLoading`
  // flip; but a filter change always passes through a render frame where the
  // grid is empty AND still loading (the skeleton branch), which unmounted
  // this element — and the observer never got a reliable second chance to
  // reattach, permanently killing infinite scroll for the rest of the
  // session after the very first filter click. That was the actual
  // "pagination breaks after any filter" bug, confirmed by reproducing it
  // locally: filtering correctly swapped in page 1, but scrolling afterward
  // fired zero further requests.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        // allProductsLenRef guard: right when a filter changes, there's a
        // render frame where the grid has just been cleared but `hasMore`
        // still reflects the PREVIOUS (stale) filter's total_pages — without
        // this, the sentinel could fire immediately off that stale flag,
        // advancing to page 2 before the new filter's page 1 has even
        // loaded.
        if (entry.isIntersecting && !isFetchingRef.current && hasMoreRef.current && allProductsLenRef.current > 0) {
          setPage(prev => prev + 1);
        }
      },
      { rootMargin: "300px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
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
          {locale === "bn" ? "ট্যাগ" : "Tags"}
        </p>
        <div className="space-y-0.5">
          {(["new", "flash_sale", "trendy"] as const).map(code => (
            <Checkbox
              key={code}
              checked={selectedBadges.includes(code)}
              onChange={() => toggleBadge(code)}
              label={locale === "bn" ? BADGE_STYLE[code].bn : BADGE_STYLE[code].en}
            />
          ))}
        </div>
        {selectedBadges.length > 0 && (
          <button
            onClick={() => { setSelectedBadges([]); setPage(1); setAllProducts([]); }}
            className="mt-2 text-xs text-amber-700 hover:underline"
          >
            {locale === "bn" ? "বাতিল করুন" : "Clear"}
          </button>
        )}
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
              <span className="text-sm text-gray-700 group-hover:text-gray-900 flex items-center gap-1.5">
                {locale === "bn" ? opt.bn : opt.en}
                {opt.value === "newest" && (
                  <span className="relative inline-flex w-3 h-3">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600" />
                  </span>
                )}
              </span>
            </label>
          ))}
          {sortOrder && (
            <button
              onClick={() => { setSortOrder(""); setPage(1); setAllProducts([]); }}
              className="text-xs text-amber-700 hover:underline mt-1"
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
        <div className="max-h-80 overflow-y-auto overscroll-contain pr-1 space-y-0.5 scrollbar-thin">
          {allCategories.map(cat => (
            <Checkbox
              key={cat.id}
              checked={categories.includes(cat.slug)}
              onChange={() => toggleCategory(cat.slug)}
              label={locale === "bn" ? cat.name_bn : cat.name_en}
            />
          ))}
        </div>
        {categories.length > 0 && (
          <button
            onClick={() => { setCategories([]); setPage(1); setAllProducts([]); }}
            className="mt-2 text-xs text-amber-700 hover:underline"
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
              className="mt-2 text-xs text-amber-700 hover:underline"
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
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed bottom-4 left-4 z-30 lg:hidden inline-flex items-center gap-2 px-4 py-3 rounded-full bg-green-700 shadow-lg text-sm font-medium text-white hover:bg-green-700 transition-colors"
      >
        <SlidersHorizontal className="w-4 h-4" />
        {locale === "bn" ? "ফিল্টার" : "Filters"}
        {hasFilter && <span className="w-2 h-2 rounded-full bg-white" />}
      </button>

      {offerBanners}

      <div className="flex gap-3">
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto overscroll-contain scrollbar-hide">
            {isLoading && allProducts.length === 0 ? <FilterPanelSkeleton /> : <FilterPanel />}
          </div>
        </aside>

        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
              onPointerDown={() => {
                setSidebarOpen(false);
                // The tap that closes this backdrop still produces a trailing
                // synthetic click somewhere in the DOM once the backdrop is gone
                // (e.g. on a product card underneath), which would otherwise
                // navigate into it. Swallow exactly that one click, wherever it
                // lands, regardless of the browser's touch-to-click timing.
                const suppressNextClick = (e: MouseEvent) => {
                  e.stopPropagation();
                  e.preventDefault();
                };
                document.addEventListener("click", suppressNextClick, { capture: true, once: true });
              }}
            />
            <div className="fixed inset-y-0 left-0 w-72 bg-white z-50 lg:hidden overflow-y-auto overscroll-contain shadow-xl">
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
                  <PackageSearch className="w-10 h-10 mx-auto mb-4 text-gray-300" />
                  <p>{locale === "bn" ? "কোনো পণ্য পাওয়া যায়নি" : "No products found"}</p>
                  {hasFilter && (
                    <button
                      onClick={resetFilters}
                      className="mt-3 text-amber-700 hover:underline text-sm"
                    >
                      {locale === "bn" ? "ফিল্টার মুছুন" : "Clear filters"}
                    </button>
                  )}
                </div>
              )}

            </>
          )}
          {/* Always mounted — see the effect above for why this can never be
              conditionally rendered. */}
          <div ref={sentinelRef} className="h-1" />
        </div>
      </div>
    </div>
  );
}
