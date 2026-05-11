import { useState, useEffect } from "react";
import { Search, Building2, Users, Target } from "lucide-react";
import Button from "../../components/Button";
import PropertyCard from "../../components/PropertyCard";
import { Link } from "react-router-dom";
import api from "../../services/api";

export default function Homepage() {
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await api.get('/properties?size=3');
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

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-slate-900 text-white h-[500px] flex items-center">
        <div className="absolute inset-0 overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" 
            alt="Hero Background" 
            className="w-full h-full object-cover opacity-30"
          />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">
            Find Your Dream <span className="text-red-500">Property</span> Today
          </h1>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
            Discover the perfect home or investment opportunity from our exclusive portfolio of premium real estate.
          </p>
          <div className="bg-white p-2 rounded-lg max-w-3xl mx-auto flex flex-col md:flex-row shadow-lg">
            <input 
              type="text" 
              placeholder="Enter location, property type, or keywords..." 
              className="flex-1 px-4 py-3 text-slate-800 focus:outline-none rounded-md"
            />
            <Button className="mt-2 md:mt-0 md:ml-2 flex items-center justify-center">
              <Search className="h-5 w-5 mr-2" />
              Search
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <div className="bg-red-50 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
                <Building2 className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-3xl font-bold text-slate-800 mb-2">500+</h3>
              <p className="text-slate-500 font-medium">Premium Properties</p>
            </div>
            <div className="p-6">
              <div className="bg-red-50 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-3xl font-bold text-slate-800 mb-2">2,500+</h3>
              <p className="text-slate-500 font-medium">Happy Customers</p>
            </div>
            <div className="p-6">
              <div className="bg-red-50 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
                <Target className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-3xl font-bold text-slate-800 mb-2">99%</h3>
              <p className="text-slate-500 font-medium">Success Rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-bold text-slate-800 mb-2">Featured Properties</h2>
              <p className="text-slate-600">Explore our hand-picked selection of top real estate listings.</p>
            </div>
            <Link to="/properties" className="text-red-600 font-medium hover:text-red-700 hover:underline hidden sm:block">
              View All Properties &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              <div className="col-span-1 md:col-span-2 lg:col-span-3 flex justify-center py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
              </div>
            ) : featuredProperties.length > 0 ? (
              featuredProperties.map(property => (
                <PropertyCard key={property.id} property={property} />
              ))
            ) : (
              <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-10 text-slate-500">
                No featured properties available.
              </div>
            )}
          </div>
          <div className="mt-10 text-center sm:hidden">
            <Link to="/properties" className="text-red-600 font-medium hover:text-red-700 hover:underline">
              View All Properties &rarr;
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
