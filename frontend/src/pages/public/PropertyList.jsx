import { useEffect, useRef, useState } from "react";
import {
  Bath,
  BedDouble,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Heart,
  Home,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
  Square,
  UserCircle,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import api from "../../services/api";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=2200&q=85";
const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80";
const PAGE_SIZE = 6;

const propertyTypeLabels = {
  apartment: "Căn hộ",
  house: "Nhà riêng",
  land: "Đất nền",
  villa: "Biệt thự",
  shophouse: "Shophouse",
};

const propertyTypes = [
  { label: "Căn hộ", value: "apartment" },
  { label: "Nhà riêng", value: "house" },
  { label: "Đất nền", value: "land" },
  { label: "Biệt thự", value: "villa" },
  { label: "Shophouse", value: "shophouse" },
];

const priceRanges = [
  { label: "Mức giá", value: "" },
  { label: "Dưới 3 tỷ", value: "0-3000000000", maxPrice: "3000000000" },
  { label: "3 - 7 tỷ", value: "3000000000-7000000000", minPrice: "3000000000", maxPrice: "7000000000" },
  { label: "7 - 15 tỷ", value: "7000000000-15000000000", minPrice: "7000000000", maxPrice: "15000000000" },
  { label: "Trên 15 tỷ", value: "15000000000-", minPrice: "15000000000" },
];

const areaRanges = [
  { label: "Diện tích", value: "" },
  { label: "Dưới 50m²", value: "0-50", maxArea: "50" },
  { label: "50 - 100m²", value: "50-100", minArea: "50", maxArea: "100" },
  { label: "100 - 200m²", value: "100-200", minArea: "100", maxArea: "200" },
  { label: "Trên 200m²", value: "200-", minArea: "200" },
];

const sortOptions = [
  { label: "Mới nhất", value: "createdAt-DESC", sortBy: "createdAt", sortDirection: "DESC" },
  { label: "Giá thấp đến cao", value: "price-ASC", sortBy: "price", sortDirection: "ASC" },
  { label: "Giá cao đến thấp", value: "price-DESC", sortBy: "price", sortDirection: "DESC" },
  { label: "Diện tích lớn nhất", value: "area-DESC", sortBy: "area", sortDirection: "DESC" },
];

const quickFilters = [
  { label: "Căn hộ", values: { propertyType: "apartment" } },
  { label: "Nhà riêng", values: { propertyType: "house" } },
  { label: "Dưới 3 tỷ", values: { priceRange: "0-3000000000" } },
  { label: "Đất nền", values: { propertyType: "land" } },
];

const heroStats = [
  { value: "10K+", label: "tin đăng" },
  { value: "63", label: "tỉnh thành" },
  { value: "5K+", label: "khách hàng" },
];

const formatPrice = (price) => {
  if (!price) return "Liên hệ";
  if (Number(price) >= 1000000000) {
    return `${Number(price / 1000000000).toLocaleString("vi-VN", {
      maximumFractionDigits: 1,
    })} tỷ`;
  }
  return `${Number(price / 1000000).toLocaleString("vi-VN")} triệu`;
};

const formatArea = (area) => {
  if (!area) return "Đang cập nhật";
  return `${Number(area).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}m²`;
};

const getPropertyImage = (property) => {
  const primaryImage = property?.images?.find((image) => image.isPrimary);
  return primaryImage?.url || property?.images?.[0]?.url || PLACEHOLDER_IMAGE;
};

const getPropertyTypeLabel = (type) => propertyTypeLabels[type] || type || "BĐS";

const getRangeValue = (ranges, minKey, maxKey, params) => {
  const minValue = params.get(minKey) || "";
  const maxValue = params.get(maxKey) || "";
  const found = ranges.find(
    (range) =>
      (range.minPrice || range.minArea || "") === minValue &&
      (range.maxPrice || range.maxArea || "") === maxValue
  );
  return found?.value || "";
};

const buildSearchParams = (filters) => {
  const params = new URLSearchParams();
  if (filters.keyword.trim()) params.set("keyword", filters.keyword.trim());
  if (filters.propertyType) params.set("propertyType", filters.propertyType);

  const selectedPrice = priceRanges.find((range) => range.value === filters.priceRange);
  if (filters.minPrice) params.set("minPrice", String(filters.minPrice));
  else if (selectedPrice?.minPrice) params.set("minPrice", selectedPrice.minPrice);
  if (filters.maxPrice) params.set("maxPrice", String(filters.maxPrice));
  else if (selectedPrice?.maxPrice) params.set("maxPrice", selectedPrice.maxPrice);

  const selectedArea = areaRanges.find((range) => range.value === filters.areaRange);
  if (filters.minArea) params.set("minArea", String(filters.minArea));
  else if (selectedArea?.minArea) params.set("minArea", selectedArea.minArea);
  if (filters.maxArea) params.set("maxArea", String(filters.maxArea));
  else if (selectedArea?.maxArea) params.set("maxArea", selectedArea.maxArea);

  const selectedSort = sortOptions.find((option) => option.value === filters.sort) || sortOptions[0];
  params.set("sortBy", selectedSort.sortBy);
  params.set("sortDirection", selectedSort.sortDirection);
  params.set("page", "0");
  params.set("status", "published");

  return params;
};

const buildFilterState = (searchParams) => ({
  keyword: searchParams.get("keyword") || "",
  propertyType: searchParams.get("propertyType") || "",
  priceRange: getRangeValue(priceRanges, "minPrice", "maxPrice", searchParams),
  minPrice: searchParams.get("minPrice") || "",
  maxPrice: searchParams.get("maxPrice") || "",
  areaRange: getRangeValue(areaRanges, "minArea", "maxArea", searchParams),
  minArea: searchParams.get("minArea") || "",
  maxArea: searchParams.get("maxArea") || "",
  sort: `${searchParams.get("sortBy") || "createdAt"}-${searchParams.get("sortDirection") || "DESC"}`,
});

const getPaginationItems = (currentPage, totalPages) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index);
  }

  const pages = new Set([0, totalPages - 1, currentPage]);
  if (currentPage > 0) pages.add(currentPage - 1);
  if (currentPage < totalPages - 1) pages.add(currentPage + 1);
  if (currentPage <= 2) [1, 2, 3, 4].forEach((page) => pages.add(page));
  if (currentPage >= totalPages - 3) {
    [totalPages - 4, totalPages - 3, totalPages - 2].forEach((page) => pages.add(page));
  }

  const sortedPages = [...pages]
    .filter((page) => page >= 0 && page < totalPages)
    .sort((a, b) => a - b);

  return sortedPages.reduce((items, page, index) => {
    const previousPage = sortedPages[index - 1];
    if (index > 0 && page - previousPage > 1) {
      items.push(`ellipsis-${previousPage}-${page}`);
    }
    items.push(page);
    return items;
  }, []);
};

function ListingSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="shimmer h-60 bg-slate-200" />
      <div className="space-y-4 p-4">
        <div className="shimmer h-5 w-4/5 rounded bg-slate-200" />
        <div className="shimmer h-4 w-2/3 rounded bg-slate-200" />
        <div className="flex justify-between gap-4">
          <div className="shimmer h-5 w-24 rounded bg-slate-200" />
          <div className="shimmer h-5 w-32 rounded bg-slate-200" />
        </div>
        <div className="shimmer h-10 rounded bg-slate-200" />
      </div>
    </div>
  );
}

export default function PropertyList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [filters, setFilters] = useState(() => buildFilterState(searchParams));
  const [loading, setLoading] = useState(true);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const previousFiltersKeyRef = useRef(JSON.stringify(filters));
  const [pageInfo, setPageInfo] = useState({
    totalElements: 0,
    totalPages: 0,
    number: 0,
  });
  const [likedProperties, setLikedProperties] = useState(new Set());

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams(searchParams);
        params.delete("province");
        params.set("status", "published");
        params.set("size", String(PAGE_SIZE));
        if (!params.has("sortBy")) params.set("sortBy", "createdAt");
        if (!params.has("sortDirection")) params.set("sortDirection", "DESC");

        const response = await api.get(`/properties?${params.toString()}`);
        if (response.data.success) {
          const pageData = response.data.data;
          setProperties(pageData.content || []);
          setPageInfo({
            totalElements: pageData.totalElements || 0,
            totalPages: pageData.totalPages || 0,
            number: pageData.number || 0,
          });
        }
      } catch (error) {
        console.error("Failed to fetch properties", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [searchParams]);

  const updateFilter = (name, value) => {
    setFilters((current) => {
      const next = { ...current, [name]: value };
      if (name === "minPrice" || name === "maxPrice") next.priceRange = "";
      if (name === "minArea" || name === "maxArea") next.areaRange = "";
      if (name === "priceRange") {
        next.minPrice = "";
        next.maxPrice = "";
      }
      if (name === "areaRange") {
        next.minArea = "";
        next.maxArea = "";
      }
      return next;
    });
  };

  useEffect(() => {
    const filtersKey = JSON.stringify(filters);
    if (filtersKey === previousFiltersKeyRef.current) return undefined;

    const handler = setTimeout(() => {
      setSearchParams(buildSearchParams(filters));
      previousFiltersKeyRef.current = filtersKey;
    }, 350);

    return () => clearTimeout(handler);
  }, [filters, setSearchParams]);

  const clearFilters = () => {
    setFilters(buildFilterState(new URLSearchParams()));
    setSearchParams(new URLSearchParams());
    setShowAdvancedFilters(false);
  };

  const applyQuickFilter = (values) => {
    setFilters((current) => ({
      ...current,
      ...values,
      minPrice: values.priceRange ? "" : current.minPrice,
      maxPrice: values.priceRange ? "" : current.maxPrice,
    }));
  };

  const goToPage = (page) => {
    const params = new URLSearchParams(searchParams);
    params.delete("province");
    params.set("page", String(page));
    setSearchParams(params);
  };

  const toggleLike = (propertyId, event) => {
    event.preventDefault();
    setLikedProperties((current) => {
      const next = new Set(current);
      if (next.has(propertyId)) next.delete(propertyId);
      else next.add(propertyId);
      return next;
    });
  };

  const hasActiveFilters =
    filters.keyword ||
    filters.propertyType ||
    filters.priceRange ||
    filters.areaRange ||
    filters.sort !== "createdAt-DESC" ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.minArea ||
    filters.maxArea;
  const currentPage = Math.min(pageInfo.number, Math.max(pageInfo.totalPages - 1, 0));
  const paginationItems = getPaginationItems(currentPage, pageInfo.totalPages);

  return (
    <div className="min-h-screen bg-[#f7f4ef] text-slate-950">
      <section className="relative isolate min-h-[320px] overflow-hidden bg-slate-950">
        <img src={HERO_IMAGE} alt="Thành phố hiện đại" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(2,6,23,0.9)_0%,rgba(15,23,42,0.64)_48%,rgba(15,23,42,0.34)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(215,181,109,0.34),transparent_28%)]" />

        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-10 text-white sm:px-6 lg:px-8">
          <div className="mb-7 flex flex-wrap items-center gap-2 text-sm font-bold text-white/70">
            <Link to="/" className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 transition hover:bg-white hover:text-slate-950">
              <Home className="h-4 w-4" />
              Trang chủ
            </Link>
            <span className="text-white/35">/</span>
            <span>Nhà đất bán</span>
            <span className="text-white/35">/</span>
            <span className="text-[#f7d794]">Tất cả loại hình</span>
          </div>

          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#f7d794] backdrop-blur-md">
              <Sparkles className="h-4 w-4" />
              Cập nhật mới nhất hôm nay
            </div>
            <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">
              Tìm kiếm bất động sản phù hợp
            </h1>
            <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-white/74">
              Lọc nhanh theo loại hình, ngân sách và diện tích để tìm đúng lựa chọn bạn cần.
            </p>

            <div className="mt-7 grid max-w-2xl grid-cols-3 overflow-hidden rounded-lg border border-white/15 bg-white/[0.08] backdrop-blur-md">
              {heroStats.map((stat) => (
                <div key={stat.label} className="border-r border-white/10 px-4 py-3 last:border-r-0 sm:px-6">
                  <p className="text-2xl font-black text-white">{stat.value}</p>
                  <p className="mt-1 text-xs font-bold text-white/60">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <main className="mx-auto -mt-14 max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="relative z-10 mb-8 rounded-2xl border border-white/50 bg-white/82 p-4 shadow-2xl shadow-slate-950/12 backdrop-blur-xl"
        >
          <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_0.8fr_0.8fr_auto]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={filters.keyword}
                onChange={(event) => updateFilter("keyword", event.target.value)}
                className="h-12 w-full rounded-lg border border-white/80 bg-white/90 pl-11 pr-4 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#d7b56d] focus:ring-4 focus:ring-[#d7b56d]/20"
                placeholder="Tìm kiếm theo tên, địa chỉ hoặc mã BĐS..."
              />
            </label>

            <label className="relative block">
              <Building2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                value={filters.propertyType}
                onChange={(event) => updateFilter("propertyType", event.target.value)}
                className="h-12 w-full appearance-none rounded-lg border border-white/80 bg-white/90 pl-11 pr-9 text-sm font-bold text-slate-800 outline-none transition focus:border-[#d7b56d] focus:ring-4 focus:ring-[#d7b56d]/20"
              >
                <option value="">Tất cả loại hình</option>
                {propertyTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </label>

            <select
              value={filters.priceRange}
              onChange={(event) => updateFilter("priceRange", event.target.value)}
              className="h-12 rounded-lg border border-white/80 bg-white/90 px-4 text-sm font-bold text-slate-800 outline-none transition focus:border-[#d7b56d] focus:ring-4 focus:ring-[#d7b56d]/20"
            >
              {priceRanges.map((range) => (
                <option key={range.value || "price"} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>

            <select
              value={filters.sort}
              onChange={(event) => updateFilter("sort", event.target.value)}
              className="h-12 rounded-lg border border-white/80 bg-white/90 px-4 text-sm font-bold text-slate-800 outline-none transition focus:border-[#d7b56d] focus:ring-4 focus:ring-[#d7b56d]/20"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowAdvancedFilters((value) => !value)}
                className={`grid h-12 w-12 place-items-center rounded-lg border transition hover:-translate-y-0.5 ${
                  showAdvancedFilters ? "border-slate-950 bg-slate-950 text-white" : "border-white/80 bg-white/90 text-slate-800 hover:bg-white"
                }`}
                title="Bộ lọc nâng cao"
              >
                <SlidersHorizontal className="h-5 w-5" />
              </button>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="grid h-12 w-12 place-items-center rounded-lg border border-white/80 bg-white/90 text-slate-800 transition hover:-translate-y-0.5 hover:bg-white"
                  title="Xóa bộ lọc"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {showAdvancedFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-3 grid gap-3 border-t border-slate-200/70 pt-3 sm:grid-cols-2 lg:grid-cols-5"
            >
              <select
                value={filters.areaRange}
                onChange={(event) => updateFilter("areaRange", event.target.value)}
                className="h-12 rounded-lg border border-white/80 bg-white/90 px-4 text-sm font-bold text-slate-800 outline-none transition focus:border-[#d7b56d] focus:ring-4 focus:ring-[#d7b56d]/20"
              >
                {areaRanges.map((range) => (
                  <option key={range.value || "area"} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="0"
                value={filters.minPrice}
                onChange={(event) => updateFilter("minPrice", event.target.value)}
                className="h-12 rounded-lg border border-white/80 bg-white/90 px-4 text-sm font-bold outline-none transition focus:border-[#d7b56d] focus:ring-4 focus:ring-[#d7b56d]/20"
                placeholder="Giá từ (VNĐ)"
              />
              <input
                type="number"
                min="0"
                value={filters.maxPrice}
                onChange={(event) => updateFilter("maxPrice", event.target.value)}
                className="h-12 rounded-lg border border-white/80 bg-white/90 px-4 text-sm font-bold outline-none transition focus:border-[#d7b56d] focus:ring-4 focus:ring-[#d7b56d]/20"
                placeholder="Giá đến (VNĐ)"
              />
              <input
                type="number"
                min="0"
                value={filters.minArea}
                onChange={(event) => updateFilter("minArea", event.target.value)}
                className="h-12 rounded-lg border border-white/80 bg-white/90 px-4 text-sm font-bold outline-none transition focus:border-[#d7b56d] focus:ring-4 focus:ring-[#d7b56d]/20"
                placeholder="Diện tích từ"
              />
              <input
                type="number"
                min="0"
                value={filters.maxArea}
                onChange={(event) => updateFilter("maxArea", event.target.value)}
                className="h-12 rounded-lg border border-white/80 bg-white/90 px-4 text-sm font-bold outline-none transition focus:border-[#d7b56d] focus:ring-4 focus:ring-[#d7b56d]/20"
                placeholder="Diện tích đến"
              />
            </motion.div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {quickFilters.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => applyQuickFilter(item.values)}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5 hover:border-[#d7b56d] hover:bg-[#d7b56d] hover:text-slate-950"
              >
                {item.label}
              </button>
            ))}
          </div>
        </motion.div>

        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2 text-sm font-black text-[#9b7932]">
              <Filter className="h-4 w-4" />
              Cập nhật mới nhất hôm nay
            </div>
            <h2 className="mt-2 text-2xl font-black text-slate-950">
              {pageInfo.totalElements.toLocaleString("vi-VN")} bất động sản phù hợp
            </h2>
          </div>
          <span className="w-fit rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-500 shadow-sm">
            Sắp xếp theo {sortOptions.find((option) => option.value === filters.sort)?.label || "Mới nhất"}
          </span>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <ListingSkeleton key={item} />
            ))}
          </div>
        ) : properties.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {properties.map((property, index) => (
              <motion.div
                key={property.propertyId}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.04 }}
              >
                <Link
                  to={`/properties/${property.propertyId}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white transition-all duration-300 hover:-translate-y-1.5 hover:premium-shadow"
                >
                  <div className="relative h-60 overflow-hidden">
                    <img
                      src={getPropertyImage(property)}
                      alt={property.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent opacity-60 transition-opacity group-hover:opacity-80" />
                    <span className="absolute left-3 top-3 rounded-lg bg-white/90 backdrop-blur-md px-3 py-1 text-xs font-bold text-slate-800 shadow-sm">
                      {getPropertyTypeLabel(property.propertyType)}
                    </span>
                    <span className="absolute bottom-3 left-3 flex items-center gap-1 rounded-lg bg-slate-900/60 backdrop-blur-md px-2.5 py-1 text-xs font-medium text-white">
                      <MapPin className="h-3 w-3" />
                      {property.province || "Hồ Chí Minh"}
                    </span>
                    <button
                      type="button"
                      onClick={(event) => toggleLike(property.propertyId, event)}
                      className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 backdrop-blur-sm text-slate-700 transition hover:bg-rose-500 hover:text-white hover:shadow-md"
                      aria-label="Lưu bất động sản"
                    >
                      <Heart
                        className={`h-4 w-4 ${
                          likedProperties.has(property.propertyId) ? "fill-rose-500 text-rose-500" : ""
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex flex-col flex-1 p-5">
                    <h2 className="line-clamp-2 min-h-[2.75rem] text-base font-bold leading-snug text-slate-800 group-hover:text-gold-600 transition-colors">
                      {property.title}
                    </h2>
                    <p className="mt-2.5 flex items-center gap-1.5 text-sm text-slate-500">
                      <span className="line-clamp-1">{property.address || `${property.district || ""}, ${property.province || ""}`}</span>
                    </p>

                    <div className="mt-5 flex items-center justify-between gap-3 pt-4 border-t border-slate-100">
                      <p className="text-lg font-bold text-gold-600">{formatPrice(property.price)}</p>
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                        <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md">
                          <Square className="h-3.5 w-3.5 text-slate-400" />{formatArea(property.area)}
                        </span>
                        <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md">
                          <BedDouble className="h-3.5 w-3.5 text-slate-400" />{property.bedrooms || "-"}
                        </span>
                        <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md">
                          <Bath className="h-3.5 w-3.5 text-slate-400" />{property.bathrooms || "-"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                      <div className="flex items-center gap-3">
                        <div className="grid h-8 w-8 place-items-center rounded-full bg-gold-50 text-gold-600 group-hover:bg-gold-500 group-hover:text-white transition-colors">
                          <UserCircle className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">
                            {property.assignedTo?.fullName || "Tư vấn viên"}
                          </p>
                          <p className="text-xs font-medium text-slate-500">Phụ trách chính</p>
                        </div>
                      </div>
                      <span className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600 group-hover:bg-gold-50 group-hover:text-gold-600 transition-colors">
                        Xem chi tiết
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-14 text-center shadow-sm">
            <Building2 className="mx-auto h-12 w-12 text-slate-400" />
            <h2 className="mt-4 text-2xl font-extrabold text-slate-950">
              Không tìm thấy bất động sản phù hợp
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm font-medium leading-6 text-slate-500">
              Hãy thử bỏ bớt bộ lọc hoặc tìm theo từ khóa khác để xem thêm tin đăng.
            </p>
          </div>
        )}

        {pageInfo.totalPages > 1 && (
          <div className="mt-10 flex justify-center">
            <div className="inline-flex overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
              <button
                type="button"
                onClick={() => goToPage(Math.max(currentPage - 1, 0))}
                disabled={currentPage === 0}
                className="grid h-10 w-10 place-items-center border-r border-slate-200 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
                aria-label="Trang trước"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {paginationItems.map((item) =>
                typeof item === "string" ? (
                  <span
                    key={item}
                    className="grid h-10 min-w-10 place-items-center border-r border-slate-200 px-3 text-sm font-bold text-slate-400"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    onClick={() => goToPage(item)}
                    className={`h-10 min-w-10 border-r border-slate-200 px-3 text-sm font-bold transition ${
                      currentPage === item
                        ? "bg-slate-950 text-white"
                        : "bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {item + 1}
                  </button>
                )
              )}

              <button
                type="button"
                onClick={() => goToPage(Math.min(currentPage + 1, pageInfo.totalPages - 1))}
                disabled={currentPage >= pageInfo.totalPages - 1}
                className="grid h-10 w-10 place-items-center text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
                aria-label="Trang sau"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
