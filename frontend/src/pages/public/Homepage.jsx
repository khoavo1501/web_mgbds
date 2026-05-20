import { useEffect, useMemo, useState } from "react";
import {
  Bath,
  BedDouble,
  Building2,
  Home,
  MapPin,
  Search,
  Square,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=2200&q=85";
const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80";

const propertyTypeLabels = {
  apartment: "Căn hộ",
  house: "Nhà phố",
  land: "Đất nền",
  villa: "Biệt thự",
  shophouse: "Shophouse",
};

const priceRanges = [
  { label: "Mức giá", minPrice: "", maxPrice: "" },
  { label: "Dưới 3 tỷ", minPrice: "", maxPrice: "3000000000" },
  { label: "3 - 7 tỷ", minPrice: "3000000000", maxPrice: "7000000000" },
  { label: "7 - 15 tỷ", minPrice: "7000000000", maxPrice: "15000000000" },
  { label: "Trên 15 tỷ", minPrice: "15000000000", maxPrice: "" },
];

const fallbackCategories = [
  { label: "Căn hộ", type: "apartment", count: "1,234 tin đăng", icon: Building2 },
  { label: "Nhà phố", type: "house", count: "856 tin đăng", icon: Home },
  { label: "Biệt thự", type: "villa", count: "342 tin đăng", icon: Home },
  { label: "Đất nền", type: "land", count: "2,105 tin đăng", icon: MapPin },
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

export default function Homepage() {
  const navigate = useNavigate();
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    keyword: "",
    province: "",
    priceRange: "0",
  });

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await api.get(
          "/properties?status=published&size=6&sortBy=createdAt&sortDirection=DESC"
        );
        if (response.data.success) {
          setFeaturedProperties(response.data.data.content || []);
        }
      } catch (error) {
        console.error("Failed to fetch featured properties", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  const provinces = useMemo(
    () => [...new Set(featuredProperties.map((property) => property.province).filter(Boolean))],
    [featuredProperties]
  );

  const categoryCounts = useMemo(() => {
    const counts = featuredProperties.reduce((acc, property) => {
      acc[property.propertyType] = (acc[property.propertyType] || 0) + 1;
      return acc;
    }, {});

    return fallbackCategories.map((category) => ({
      ...category,
      count: counts[category.type] ? `${counts[category.type].toLocaleString("vi-VN")} tin đăng` : category.count,
    }));
  }, [featuredProperties]);

  const updateFilter = (name, value) => {
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const handleSearch = (event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (filters.keyword.trim()) params.set("keyword", filters.keyword.trim());
    if (filters.province) params.set("province", filters.province);

    const selectedRange = priceRanges[Number(filters.priceRange)];
    if (selectedRange?.minPrice) params.set("minPrice", selectedRange.minPrice);
    if (selectedRange?.maxPrice) params.set("maxPrice", selectedRange.maxPrice);

    navigate(`/properties${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <div className="bg-slate-50 text-slate-950">
      <section className="relative min-h-[560px] overflow-hidden">
        <img src={HERO_IMAGE} alt="Biệt thự hiện đại" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-slate-950/55" />
        <div className="relative mx-auto flex min-h-[560px] max-w-7xl flex-col items-center justify-center px-4 text-center sm:px-6 lg:px-8">
          <h1 className="max-w-5xl text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Tìm kiếm ngôi nhà mơ ước của bạn
          </h1>
          <p className="mt-5 max-w-3xl text-lg font-semibold leading-8 text-white/85 sm:text-2xl">
            Nền tảng môi giới bất động sản hàng đầu với hàng ngàn lựa chọn đa dạng, minh bạch và an toàn.
          </p>

          <form
            onSubmit={handleSearch}
            className="mt-10 grid w-full max-w-5xl gap-3 rounded-xl bg-white p-3 shadow-2xl shadow-slate-950/25 md:grid-cols-[1.5fr_1fr_1fr_auto]"
          >
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                value={filters.keyword}
                onChange={(event) => updateFilter("keyword", event.target.value)}
                className="h-14 w-full rounded-md border border-slate-200 bg-white pl-12 pr-4 text-base font-medium text-slate-800 outline-none transition focus:border-slate-400"
                placeholder="Nhập địa điểm, dự án hoặc từ khóa"
              />
            </label>

            <select
              value={filters.province}
              onChange={(event) => updateFilter("province", event.target.value)}
              className="h-14 rounded-md border border-slate-200 bg-white px-4 text-base font-medium text-slate-800 outline-none transition focus:border-slate-400"
            >
              <option value="">Tất cả khu vực</option>
              {provinces.map((province) => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </select>

            <select
              value={filters.priceRange}
              onChange={(event) => updateFilter("priceRange", event.target.value)}
              className="h-14 rounded-md border border-slate-200 bg-white px-4 text-base font-medium text-slate-800 outline-none transition focus:border-slate-400"
            >
              {priceRanges.map((range, index) => (
                <option key={range.label} value={index}>
                  {range.label}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="h-14 rounded-md px-8 text-base font-bold text-slate-950 transition hover:bg-slate-100"
            >
              Tìm kiếm
            </button>
          </form>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-9 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-950">Bất động sản nổi bật</h2>
              <p className="mt-3 text-base font-medium text-slate-600">
                Những dự án và nhà đất đang được quan tâm nhất
              </p>
            </div>
            <Link
              to="/properties"
              className="hidden rounded-md border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-50 sm:inline-flex"
            >
              Xem tất cả
            </Link>
          </div>

          {loading ? (
            <div className="grid gap-6 md:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-80 animate-pulse rounded-md bg-slate-200" />
              ))}
            </div>
          ) : featuredProperties.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-3">
              {featuredProperties.slice(0, 3).map((property) => (
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
                  </div>
                  <div className="p-4">
                    <h3 className="line-clamp-2 min-h-11 text-base font-extrabold leading-snug text-slate-950">
                      {property.title}
                    </h3>
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
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-slate-300 bg-white p-12 text-center font-semibold text-slate-500">
              Chưa có bất động sản nào được duyệt trong hệ thống.
            </div>
          )}
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-extrabold tracking-tight text-slate-950">
            Khám phá theo loại hình
          </h2>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categoryCounts.map((category) => {
              const Icon = category.icon;
              return (
                <Link
                  key={category.label}
                  to={`/properties?propertyType=${category.type}`}
                  className="rounded-md border border-slate-200 bg-white p-7 text-center transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-md"
                >
                  <Icon className="mx-auto h-7 w-7 text-slate-800" />
                  <p className="mt-5 text-sm font-extrabold text-slate-950">{category.label}</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">{category.count}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
