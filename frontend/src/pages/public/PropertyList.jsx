import { useEffect, useMemo, useState } from "react";
import {
  Bath,
  BedDouble,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Heart,
  MapPin,
  Search,
  SlidersHorizontal,
  Square,
  UserCircle,
  X,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../../services/api";

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80";
const PAGE_SIZE = 6;

const propertyTypeLabels = {
  apartment: "Căn hộ",
  house: "Nhà phố",
  land: "Đất nền",
  villa: "Biệt thự",
  shophouse: "Shophouse",
};

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
  if (filters.province) params.set("province", filters.province);
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
  province: searchParams.get("province") || "",
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

export default function PropertyList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [filterOptions, setFilterOptions] = useState([]);
  const [filters, setFilters] = useState(() => buildFilterState(searchParams));
  const [loading, setLoading] = useState(true);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [pageInfo, setPageInfo] = useState({
    totalElements: 0,
    totalPages: 0,
    number: 0,
  });
  const [likedProperties, setLikedProperties] = useState(new Set());

  const provinces = useMemo(
    () => [...new Set(filterOptions.map((property) => property.province).filter(Boolean))],
    [filterOptions]
  );

  const propertyTypes = useMemo(
    () => [...new Set(filterOptions.map((property) => property.propertyType).filter(Boolean))],
    [filterOptions]
  );

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await api.get("/properties?status=published&size=100");
        if (response.data.success) {
          setFilterOptions(response.data.data.content || []);
        }
      } catch (error) {
        console.error("Failed to fetch filter options", error);
      }
    };

    fetchOptions();
  }, []);

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams(searchParams);
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
    const handler = setTimeout(() => {
      setSearchParams(buildSearchParams(filters));
    }, 350);

    return () => clearTimeout(handler);
  }, [filters, setSearchParams]);

  const clearFilters = () => {
    setFilters(buildFilterState(new URLSearchParams()));
    setSearchParams(new URLSearchParams());
    setShowAdvancedFilters(false);
  };

  const goToPage = (page) => {
    const params = new URLSearchParams(searchParams);
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

  const activeLocation = searchParams.get("province") || "Việt Nam";
  const hasActiveFilters =
    filters.keyword ||
    filters.province ||
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
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-500">
                <Link to="/" className="hover:text-slate-950">Trang chủ</Link>
                <span>/</span>
                <span>Nhà đất bán</span>
                <span>/</span>
                <span className="text-slate-950">{activeLocation}</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
                Danh sách bất động sản
              </h1>
              <p className="mt-3 max-w-2xl text-base font-medium leading-7 text-slate-600">
                Tìm thấy {pageInfo.totalElements.toLocaleString("vi-VN")} tin đăng phù hợp, được
                cập nhật liên tục theo khu vực, giá và diện tích bạn quan tâm.
              </p>
            </div>
            <Link
              to="/"
              className="inline-flex w-fit items-center gap-2 rounded-md border border-slate-200 bg-white px-5 py-3 text-sm font-bold transition hover:bg-slate-50"
            >
              <Building2 className="h-4 w-4" />
              Trang chủ
            </Link>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-md border border-slate-200 bg-white p-3 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr_0.8fr_0.8fr_auto]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={filters.keyword}
                onChange={(event) => updateFilter("keyword", event.target.value)}
                className="h-12 w-full rounded-md border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-800 outline-none transition focus:border-slate-400"
                placeholder="Tìm kiếm theo tên, địa chỉ hoặc mã BĐS..."
              />
            </label>

            <label className="relative block">
              <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                value={filters.province}
                onChange={(event) => updateFilter("province", event.target.value)}
                className="h-12 w-full appearance-none rounded-md border border-slate-200 bg-white pl-11 pr-9 text-sm font-medium text-slate-800 outline-none transition focus:border-slate-400"
              >
                <option value="">Tất cả khu vực</option>
                {provinces.map((province) => (
                  <option key={province} value={province}>
                    {province}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </label>

            <label className="relative block">
              <Building2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                value={filters.propertyType}
                onChange={(event) => updateFilter("propertyType", event.target.value)}
                className="h-12 w-full appearance-none rounded-md border border-slate-200 bg-white pl-11 pr-9 text-sm font-medium text-slate-800 outline-none transition focus:border-slate-400"
              >
                <option value="">Tất cả loại hình</option>
                {propertyTypes.map((type) => (
                  <option key={type} value={type}>
                    {getPropertyTypeLabel(type)}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </label>

            <select
              value={filters.priceRange}
              onChange={(event) => updateFilter("priceRange", event.target.value)}
              className="h-12 rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 outline-none transition focus:border-slate-400"
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
              className="h-12 rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 outline-none transition focus:border-slate-400"
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
                className={`grid h-12 w-12 place-items-center rounded-md border transition ${
                  showAdvancedFilters ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                }`}
                title="Bộ lọc nâng cao"
              >
                <SlidersHorizontal className="h-5 w-5" />
              </button>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="grid h-12 w-12 place-items-center rounded-md border border-slate-200 bg-white text-slate-800 transition hover:bg-slate-50"
                  title="Xóa bộ lọc"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {showAdvancedFilters && (
            <div className="mt-3 grid gap-3 border-t border-slate-200 pt-3 sm:grid-cols-2 lg:grid-cols-5">
              <select
                value={filters.areaRange}
                onChange={(event) => updateFilter("areaRange", event.target.value)}
                className="h-12 rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 outline-none transition focus:border-slate-400"
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
                className="h-12 rounded-md border border-slate-200 bg-white px-4 text-sm font-medium outline-none transition focus:border-slate-400"
                placeholder="Giá từ (VNĐ)"
              />
              <input
                type="number"
                min="0"
                value={filters.maxPrice}
                onChange={(event) => updateFilter("maxPrice", event.target.value)}
                className="h-12 rounded-md border border-slate-200 bg-white px-4 text-sm font-medium outline-none transition focus:border-slate-400"
                placeholder="Giá đến (VNĐ)"
              />
              <input
                type="number"
                min="0"
                value={filters.minArea}
                onChange={(event) => updateFilter("minArea", event.target.value)}
                className="h-12 rounded-md border border-slate-200 bg-white px-4 text-sm font-medium outline-none transition focus:border-slate-400"
                placeholder="Diện tích từ"
              />
              <input
                type="number"
                min="0"
                value={filters.maxArea}
                onChange={(event) => updateFilter("maxArea", event.target.value)}
                className="h-12 rounded-md border border-slate-200 bg-white px-4 text-sm font-medium outline-none transition focus:border-slate-400"
                placeholder="Diện tích đến"
              />
            </div>
          )}
        </div>

        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <Filter className="h-4 w-4 text-slate-400" />
            <span>
              {pageInfo.totalElements.toLocaleString("vi-VN")} bất động sản
            </span>
          </div>
          <span className="rounded-sm border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500">
            Cập nhật mới nhất
          </span>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="h-96 animate-pulse rounded-md bg-slate-200" />
            ))}
          </div>
        ) : properties.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <Link
                key={property.propertyId}
                to={`/properties/${property.propertyId}`}
                className="group overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative h-60 overflow-hidden">
                  <img
                    src={getPropertyImage(property)}
                    alt={property.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <span className="absolute left-3 top-3 rounded-sm bg-white/90 px-3 py-1 text-xs font-bold text-slate-900">
                    {getPropertyTypeLabel(property.propertyType)}
                  </span>
                  <span className="absolute bottom-3 left-3 rounded-sm bg-white px-2.5 py-1 text-xs font-semibold text-slate-900">
                    {property.province || "Hồ Chí Minh"}
                  </span>
                  <button
                    type="button"
                    onClick={(event) => toggleLike(property.propertyId, event)}
                    className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/95 text-slate-700 transition hover:bg-slate-950 hover:text-white"
                    aria-label="Lưu bất động sản"
                  >
                    <Heart
                      className={`h-4 w-4 ${
                        likedProperties.has(property.propertyId) ? "fill-slate-950 text-slate-950" : ""
                      }`}
                    />
                  </button>
                </div>

                <div className="p-4">
                  <h2 className="line-clamp-2 min-h-11 text-base font-extrabold leading-snug text-slate-950">
                    {property.title}
                  </h2>
                  <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-slate-600">
                    <MapPin className="h-4 w-4" />
                    {property.address || `${property.district || ""}, ${property.province || ""}`}
                  </p>

                  <div className="mt-5 flex items-center justify-between">
                    <p className="text-lg font-extrabold text-slate-950">{formatPrice(property.price)}</p>
                    <div className="flex items-center gap-3 text-xs font-semibold text-slate-700">
                      <span className="flex items-center gap-1"><Square className="h-3.5 w-3.5" />{formatArea(property.area)}</span>
                      <span className="flex items-center gap-1"><BedDouble className="h-3.5 w-3.5" />{property.bedrooms || "-"}</span>
                      <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" />{property.bathrooms || "-"}</span>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                    <div className="flex items-center gap-2">
                      <div className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-600">
                        <UserCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          {property.assignedTo?.fullName || "Tư vấn viên"}
                        </p>
                        <p className="text-xs font-medium text-slate-500">Phụ trách chính</p>
                      </div>
                    </div>
                    <span className="rounded-sm bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                      Xem chi tiết
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-slate-300 bg-white p-14 text-center">
            <Building2 className="mx-auto h-12 w-12 text-slate-400" />
            <h2 className="mt-4 text-2xl font-extrabold text-slate-950">
              Không tìm thấy bất động sản phù hợp
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm font-medium leading-6 text-slate-500">
              Hãy thử bỏ bớt bộ lọc hoặc tìm theo khu vực rộng hơn để xem thêm tin đăng.
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
