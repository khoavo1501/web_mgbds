import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Bath,
  BedDouble,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Headphones,
  Home,
  Layers3,
  MapPin,
  Newspaper,
  Search,
  Sparkles,
  Square,
  Star,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";

const heroSlides = [
  {
    image:
      "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=2400&q=90",
    label: "Penthouse Skyline",
    title: "Không gian sống trên cao",
  },
  {
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2400&q=90",
    label: "Luxury Villa",
    title: "Biệt thự riêng tư giữa thiên nhiên",
  },
  {
    image:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2400&q=90",
    label: "Night City",
    title: "Dự án trung tâm thành phố",
  },
];

const premiumProjects = [
  {
    title: "Han River Residence",
    type: "Căn hộ cao cấp",
    location: "Phường Hải Châu, Đà Nẵng",
    image:
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=85",
  },
  {
    title: "My Khe Beach Villas",
    type: "Biệt thự nghỉ dưỡng",
    location: "Phường Sơn Trà, Đà Nẵng",
    image:
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=85",
  },
  {
    title: "Sky Garden Da Nang",
    type: "Dự án hot",
    location: "Phường Ngũ Hành Sơn, Đà Nẵng",
    image:
      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=85",
  },
  {
    title: "Lien Chieu Marina Homes",
    type: "Shophouse",
    location: "Phường Liên Chiểu, Đà Nẵng",
    image:
      "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1200&q=85",
  },
];

const blogPosts = [
  {
    title: "5 kinh nghiệm kiểm tra pháp lý trước khi mua nhà",
    category: "Pháp lý BĐS",
    date: "24/05/2026",
    image:
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=900&q=85",
  },
  {
    title: "Xu hướng căn hộ cao cấp tại đô thị lớn năm 2026",
    category: "Thị trường",
    date: "21/05/2026",
    image:
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=85",
  },
  {
    title: "Nên chọn nhà phố hay căn hộ cho gia đình trẻ?",
    category: "Kinh nghiệm mua nhà",
    date: "18/05/2026",
    image:
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=900&q=85",
  },
];

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

const quickTags = [
  { label: "Căn hộ cao cấp", params: { keyword: "căn hộ cao cấp", propertyType: "apartment" } },
  { label: "Villa hồ bơi", params: { keyword: "villa hồ bơi", propertyType: "villa" } },
  { label: "Nhà phố trung tâm", params: { keyword: "nhà phố", propertyType: "house" } },
  { label: "Đất nền đầu tư", params: { keyword: "đất nền", propertyType: "land" } },
];

const heroStats = [
  { value: "12K+", label: "tin đăng xác thực" },
  { value: "98%", label: "khách hàng hài lòng" },
  { value: "24h", label: "kết nối môi giới" },
];

const trustItems = [
  { title: "Tin đăng xác thực", description: "Dữ liệu được rà soát trước khi hiển thị.", icon: CheckCircle2 },
  { title: "Hỗ trợ 24/7", description: "Đội ngũ tư vấn luôn sẵn sàng kết nối.", icon: Headphones },
  { title: "Minh bạch pháp lý", description: "Thông tin pháp lý rõ ràng, dễ kiểm tra.", icon: FileCheck2 },
  { title: "Đa dạng bất động sản", description: "Căn hộ, nhà phố, biệt thự và đất nền.", icon: Layers3 },
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

const getPostedTime = (property, index = 0) => {
  const createdAt = property?.createdAt || property?.updatedAt;
  if (!createdAt) return index < 2 ? "Đăng 2 giờ trước" : `Đăng ${index + 2} giờ trước`;

  const diffMs = Date.now() - new Date(createdAt).getTime();
  if (Number.isNaN(diffMs) || diffMs < 0) return "Mới đăng hôm nay";

  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));
  if (diffMinutes < 60) return `Đăng ${diffMinutes} phút trước`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Đăng ${diffHours} giờ trước`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays <= 7) return `Đăng ${diffDays} ngày trước`;

  return new Date(createdAt).toLocaleDateString("vi-VN");
};

function PropertySpecs({ property, compact = false }) {
  return (
    <div className={`flex items-center ${compact ? "gap-2" : "gap-3"} text-xs font-semibold text-slate-700`}>
      <span className="flex items-center gap-1">
        <Square className="h-3.5 w-3.5" />
        {formatArea(property.area)}
      </span>
      <span className="flex items-center gap-1">
        <BedDouble className="h-3.5 w-3.5" />
        {property.bedrooms || "-"}
      </span>
      <span className="flex items-center gap-1">
        <Bath className="h-3.5 w-3.5" />
        {property.bathrooms || "-"}
      </span>
    </div>
  );
}

function PropertyCard({ property, large = false, badge, postedTime }) {
  return (
    <Link
      to={`/properties/${property.propertyId}`}
      className={`group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${
        large ? "lg:row-span-2" : ""
      }`}
    >
      <div className={`relative overflow-hidden ${large ? "h-80 lg:h-[430px]" : "h-48"}`}>
        <img
          src={getPropertyImage(property)}
          alt={property.title}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
        <span className="absolute left-3 top-3 rounded-sm bg-white/92 px-3 py-1 text-xs font-bold text-slate-900">
          {badge || getPropertyTypeLabel(property.propertyType)}
        </span>
        {postedTime && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-sm bg-[#d7b56d] px-2.5 py-1 text-xs font-black text-slate-950">
            <Clock3 className="h-3.5 w-3.5" />
            {postedTime}
          </span>
        )}
        <span className="absolute bottom-3 left-3 rounded-sm bg-white px-2.5 py-1 text-xs font-semibold text-slate-900">
          {property.province || "Đà Nẵng"}
        </span>
      </div>
      <div className={large ? "p-5" : "p-4"}>
        <h3 className={`${large ? "text-xl" : "text-base"} line-clamp-2 font-extrabold leading-snug text-slate-950`}>
          {property.title}
        </h3>
        <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-slate-600">
          <MapPin className="h-4 w-4 shrink-0" />
          <span className="line-clamp-1">{property.address || `${property.district || ""}, ${property.province || ""}`}</span>
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-lg font-extrabold text-slate-950">{formatPrice(property.price)}</p>
          <PropertySpecs property={property} compact={!large} />
        </div>
      </div>
    </Link>
  );
}

function SkeletonCard({ large = false }) {
  return (
    <div className={`overflow-hidden rounded-lg border border-slate-200 bg-white ${large ? "lg:row-span-2" : ""}`}>
      <div className={`shimmer ${large ? "h-80 lg:h-[430px]" : "h-48"} bg-slate-200`} />
      <div className="space-y-4 p-4">
        <div className="shimmer h-5 w-4/5 rounded bg-slate-200" />
        <div className="shimmer h-4 w-2/3 rounded bg-slate-200" />
        <div className="flex justify-between gap-4">
          <div className="shimmer h-5 w-24 rounded bg-slate-200" />
          <div className="shimmer h-5 w-32 rounded bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

export default function Homepage() {
  const navigate = useNavigate();
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const [showStickySearch, setShowStickySearch] = useState(false);
  const [filters, setFilters] = useState({
    keyword: "",
    province: "",
    priceRange: "0",
  });

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await api.get(
          "/properties?status=published&size=10&sortBy=createdAt&sortDirection=DESC"
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

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length);
    }, 5200);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const onScroll = () => setShowStickySearch(window.scrollY > 620);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
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

  const newProperties = useMemo(() => featuredProperties.slice(0, 4), [featuredProperties]);
  const featuredGrid = useMemo(() => featuredProperties.slice(0, 5), [featuredProperties]);

  const updateFilter = (name, value) => {
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const navigateWithParams = (entries) => {
    const params = new URLSearchParams();
    Object.entries(entries).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    navigate(`/properties${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const handleSearch = (event) => {
    event.preventDefault();
    const selectedRange = priceRanges[Number(filters.priceRange)];

    navigateWithParams({
      keyword: filters.keyword.trim(),
      province: filters.province,
      minPrice: selectedRange?.minPrice,
      maxPrice: selectedRange?.maxPrice,
    });
  };

  const activeHero = heroSlides[activeSlide];

  const searchFields = (
    <>
      <label className="relative block">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
        <input
          value={filters.keyword}
          onChange={(event) => updateFilter("keyword", event.target.value)}
          className="h-14 w-full rounded-lg border border-white/70 bg-white/[0.92] pl-12 pr-4 text-base font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#d7b56d] focus:ring-4 focus:ring-[#d7b56d]/20"
          placeholder="Nhập địa điểm, dự án hoặc từ khóa"
        />
      </label>

      <select
        value={filters.province}
        onChange={(event) => updateFilter("province", event.target.value)}
        className="h-14 rounded-lg border border-white/70 bg-white/[0.92] px-4 text-base font-bold text-slate-800 outline-none transition focus:border-[#d7b56d] focus:ring-4 focus:ring-[#d7b56d]/20"
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
        className="h-14 rounded-lg border border-white/70 bg-white/[0.92] px-4 text-base font-bold text-slate-800 outline-none transition focus:border-[#d7b56d] focus:ring-4 focus:ring-[#d7b56d]/20"
      >
        {priceRanges.map((range, index) => (
          <option key={range.label} value={index}>
            {range.label}
          </option>
        ))}
      </select>

      <button
        type="submit"
        className="inline-flex h-14 items-center justify-center gap-2 rounded-lg bg-[#d7b56d] px-7 text-base font-black text-slate-950 shadow-lg shadow-black/15 transition hover:-translate-y-0.5 hover:bg-[#edcd82]"
      >
        Tìm kiếm
        <ArrowRight className="h-4 w-4" />
      </button>
    </>
  );

  return (
    <div className="bg-[#f7f4ef] text-slate-950">
      <AnimatePresence>
        {showStickySearch && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed left-0 right-0 top-16 z-40 hidden border-b border-slate-200 bg-white/92 shadow-lg shadow-slate-950/10 backdrop-blur-xl lg:block"
          >
            <form onSubmit={handleSearch} className="mx-auto grid max-w-7xl grid-cols-[1.5fr_1fr_1fr_auto] gap-3 px-8 py-3">
              {searchFields}
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="relative isolate min-h-[720px] overflow-hidden bg-slate-950 lg:min-h-[760px]">
        <AnimatePresence mode="wait">
          <motion.img
            key={activeHero.image}
            src={activeHero.image}
            alt={activeHero.title}
            className="absolute inset-0 h-full w-full object-cover"
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: "easeOut" }}
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(2,6,23,0.92)_0%,rgba(15,23,42,0.68)_42%,rgba(15,23,42,0.2)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(215,181,109,0.38),transparent_30%),linear-gradient(180deg,rgba(2,6,23,0.05),rgba(2,6,23,0.78))]" />

        <div className="relative mx-auto grid min-h-[720px] max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 lg:min-h-[760px] lg:grid-cols-[1.08fr_0.92fr] lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="pt-10 text-white lg:pt-0"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-[#f7d794] shadow-2xl shadow-black/20 backdrop-blur-md">
              <Sparkles className="h-4 w-4" />
              NhaDatPro Signature
            </div>

            <h1 className="mt-7 max-w-4xl text-4xl font-black leading-[1.04] text-white sm:text-6xl lg:text-7xl">
              Tìm đúng bất động sản, chạm đúng chuẩn sống.
            </h1>
            <p className="mt-6 max-w-2xl text-base font-semibold leading-8 text-white/80 sm:text-xl">
              Khám phá căn hộ, villa và nhà phố được chọn lọc với dữ liệu minh bạch, hình ảnh rõ nét và kết nối môi giới nhanh chóng.
            </p>

            <div className="mt-8 grid max-w-2xl grid-cols-3 overflow-hidden rounded-lg border border-white/15 bg-white/[0.08] backdrop-blur-md">
              {heroStats.map((stat) => (
                <div key={stat.label} className="border-r border-white/10 px-4 py-4 last:border-r-0 sm:px-6">
                  <p className="text-2xl font-black text-white sm:text-3xl">{stat.value}</p>
                  <p className="mt-1 text-xs font-bold text-white/60 sm:text-sm">{stat.label}</p>
                </div>
              ))}
            </div>

            <form
              onSubmit={handleSearch}
              className="mt-9 grid w-full max-w-5xl gap-3 rounded-2xl border border-white/25 bg-white/[0.16] p-3 shadow-2xl shadow-black/30 backdrop-blur-xl md:grid-cols-[1.5fr_1fr_1fr_auto]"
            >
              {searchFields}
            </form>

            <div className="mt-5 flex flex-wrap gap-2">
              {quickTags.map((tag) => (
                <button
                  key={tag.label}
                  type="button"
                  onClick={() => navigateWithParams(tag.params)}
                  className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-white/85 backdrop-blur-md transition hover:border-[#d7b56d]/70 hover:bg-[#d7b56d] hover:text-slate-950"
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 36 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
            className="relative hidden min-h-[520px] lg:block"
          >
            <div className="absolute right-0 top-10 w-[390px] overflow-hidden rounded-2xl border border-white/20 bg-white/[0.12] p-3 shadow-2xl shadow-black/30 backdrop-blur-xl">
              <img src={activeHero.image} alt={activeHero.title} className="h-72 w-full rounded-xl object-cover" />
              <div className="flex items-center justify-between px-2 py-4 text-white">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-[#f7d794]">{activeHero.label}</p>
                  <p className="mt-1 text-lg font-black">{activeHero.title}</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/properties")}
                  className="rounded-full bg-white p-3 text-slate-950 transition hover:bg-[#d7b56d]"
                  aria-label="Xem bất động sản"
                >
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="absolute bottom-6 right-14 flex gap-2">
              {heroSlides.map((slide, index) => (
                <button
                  key={slide.label}
                  type="button"
                  onClick={() => setActiveSlide(index)}
                  className={`h-2.5 rounded-full transition-all ${
                    index === activeSlide ? "w-10 bg-[#d7b56d]" : "w-2.5 bg-white/45 hover:bg-white"
                  }`}
                  aria-label={`Chuyển sang ${slide.label}`}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-9 flex items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-sm font-black uppercase tracking-[0.18em] text-[#9b7932]">Được quan tâm</p>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-950">Bất động sản nổi bật</h2>
              <p className="mt-3 text-base font-medium text-slate-600">
                Một bất động sản chủ đạo và các lựa chọn đáng chú ý bên cạnh để người dùng quét nhanh hơn.
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
            <div className="grid gap-5 lg:grid-cols-2">
              <SkeletonCard large />
              <div className="grid gap-5 sm:grid-cols-2">
                {[1, 2, 3, 4].map((item) => (
                  <SkeletonCard key={item} />
                ))}
              </div>
            </div>
          ) : featuredGrid.length > 0 ? (
            <div className="grid gap-5 lg:grid-cols-2">
              <PropertyCard property={featuredGrid[0]} large badge="Nổi bật" />
              <div className="grid gap-5 sm:grid-cols-2">
                {featuredGrid.slice(1, 5).map((property) => (
                  <PropertyCard key={property.propertyId} property={property} />
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-slate-300 bg-white p-12 text-center font-semibold text-slate-500">
              Chưa có bất động sản nào được duyệt trong hệ thống.
            </div>
          )}
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-9 flex items-end justify-between gap-4">
            <div>
              <p className="mb-2 inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-[#9b7932]">
                <Clock3 className="h-4 w-4" />
                Mới đăng hôm nay
              </p>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-950">Bất động sản mới đăng</h2>
              <p className="mt-3 text-base font-medium text-slate-600">
                Tin mới cập nhật liên tục để trang có cảm giác sống và đáng quay lại.
              </p>
            </div>
            <Link to="/properties?sortBy=createdAt&sortDirection=DESC" className="hidden text-sm font-black text-slate-950 hover:text-[#9b7932] sm:inline-flex">
              Xem tin mới
            </Link>
          </div>

          {loading ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <SkeletonCard key={item} />
              ))}
            </div>
          ) : newProperties.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {newProperties.map((property, index) => (
                <PropertyCard
                  key={property.propertyId}
                  property={property}
                  badge="NEW"
                  postedTime={getPostedTime(property, index)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-10 text-center font-semibold text-slate-500">
              Chưa có tin mới trong hôm nay.
            </div>
          )}
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="mb-2 inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-[#9b7932]">
                <Star className="h-4 w-4" />
                Bộ sưu tập cao cấp
              </p>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-950">Dự án nổi bật và cao cấp</h2>
            </div>
            <Link to="/properties?propertyType=villa" className="hidden text-sm font-black text-slate-950 hover:text-[#9b7932] sm:inline-flex">
              Khám phá dự án
            </Link>
          </div>

          <div className="flex gap-5 overflow-x-auto pb-3">
            {premiumProjects.map((project) => (
              <Link
                key={project.title}
                to={`/properties?keyword=${encodeURIComponent(project.type)}`}
                className="group relative h-[360px] min-w-[290px] overflow-hidden rounded-lg bg-slate-900 shadow-sm sm:min-w-[360px]"
              >
                <img src={project.image} alt={project.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/88 via-slate-950/18 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <span className="rounded-sm bg-[#d7b56d] px-3 py-1 text-xs font-black text-slate-950">{project.type}</span>
                  <h3 className="mt-4 text-2xl font-black">{project.title}</h3>
                  <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-white/75">
                    <MapPin className="h-4 w-4" />
                    {project.location}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
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

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="mb-2 text-sm font-black uppercase tracking-[0.18em] text-[#9b7932]">Vì sao chọn chúng tôi</p>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-950">
                Nền tảng được thiết kế để giao dịch bất động sản rõ ràng hơn.
              </h2>
              <p className="mt-4 text-base font-medium leading-7 text-slate-600">
                Từ khâu tìm kiếm, kiểm tra thông tin đến đặt lịch tư vấn, NhaDatPro tập trung vào trải nghiệm nhanh, minh bạch và đáng tin.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {trustItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-[#f4e7c8] text-[#8b6824]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-5 text-base font-black text-slate-950">{item.title}</h3>
                    <p className="mt-2 text-sm font-medium leading-6 text-slate-600">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-9 flex items-end justify-between gap-4">
            <div>
              <p className="mb-2 inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-[#9b7932]">
                <Newspaper className="h-4 w-4" />
                Cẩm nang thị trường
              </p>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-950">Tin tức và kinh nghiệm bất động sản</h2>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {blogPosts.map((post) => (
              <article key={post.title} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <img src={post.image} alt={post.title} className="h-56 w-full object-cover" />
                <div className="p-5">
                  <div className="flex items-center justify-between gap-3 text-xs font-bold text-slate-500">
                    <span>{post.category}</span>
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {post.date}
                    </span>
                  </div>
                  <h3 className="mt-4 line-clamp-2 text-lg font-black leading-snug text-slate-950">{post.title}</h3>
                  <button type="button" className="mt-5 inline-flex items-center gap-2 text-sm font-black text-[#8b6824]">
                    Đọc thêm
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-lg bg-slate-950 p-8 text-white shadow-2xl shadow-slate-950/20 sm:p-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#d7b56d]">Bắt đầu tìm kiếm</p>
              <h2 className="mt-3 max-w-3xl text-3xl font-black tracking-tight sm:text-5xl">
                Bạn đang tìm bất động sản phù hợp?
              </h2>
              <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-white/70">
                Khám phá hàng nghìn tin đăng được cập nhật ngay hôm nay hoặc đăng tin để tiếp cận khách hàng tiềm năng.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <Link to="/properties" className="inline-flex h-12 items-center justify-center rounded-md bg-[#d7b56d] px-6 text-sm font-black text-slate-950 transition hover:bg-[#edcd82]">
                Xem bất động sản
              </Link>
              <Link to="/broker/upload" className="inline-flex h-12 items-center justify-center rounded-md border border-white/20 px-6 text-sm font-black text-white transition hover:bg-white hover:text-slate-950">
                Đăng tin ngay
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
