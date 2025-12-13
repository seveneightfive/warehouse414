import { useState, useEffect, useRef, useCallback } from 'react';
import { Filter, X, ChevronRight, Home } from 'lucide-react';
import Layout from '../components/Layout';
import ProductCard from '../components/ProductCard';
import { supabase } from '../lib/supabase';
import type { Product, Category, Subcategory } from '../lib/types';

const ITEMS_PER_PAGE = 60;

export default function Shop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<Subcategory | null>(null);

  const observerTarget = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState({
    status: 'all' as 'all' | 'available' | 'sold',
    onSale: false,
    designer: '',
    material: '',
    priceMin: '',
    priceMax: '',
  });

  useEffect(() => {
    initializeFromURL();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchSubcategories(selectedCategory.id);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, selectedSubcategory, filters, searchQuery]);

  useEffect(() => {
    updateDisplayedProducts();
  }, [products, currentPage]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loadingMore, displayedProducts]);

  const initializeFromURL = () => {
    const params = new URLSearchParams(window.location.search);
    const categorySlug = params.get('category');
    const subcategorySlug = params.get('subcategory');

    if (categorySlug) {
      fetchCategoryBySlug(categorySlug, subcategorySlug);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchCategoryBySlug = async (categorySlug: string, subcategorySlug?: string | null) => {
    try {
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', categorySlug)
        .maybeSingle();

      if (categoryError) throw categoryError;
      if (categoryData) {
        setSelectedCategory(categoryData);

        const { data: subcategoriesData } = await supabase
          .from('subcategories')
          .select('*')
          .eq('category_id', categoryData.id)
          .order('display_order', { ascending: true });

        setSubcategories(subcategoriesData || []);

        if (subcategorySlug) {
          const subcategory = subcategoriesData?.find((s) => s.slug === subcategorySlug);
          if (subcategory && subcategory.slug !== 'all') {
            setSelectedSubcategory(subcategory);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching category:', error);
    }
  };

  const fetchSubcategories = async (categoryId: string) => {
    try {
      const { data, error } = await supabase
        .from('subcategories')
        .select('*')
        .eq('category_id', categoryId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setSubcategories(data || []);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    setCurrentPage(1);

    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          category:categories(name, slug),
          subcategory:subcategories(name, slug)
        `)
        .eq('workflow_stage', 'listed');

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory.id);
      }

      if (selectedSubcategory) {
        query = query.eq('subcategory_id', selectedSubcategory.id);
      }

      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.onSale) {
        query = query.eq('is_on_sale', true);
      }

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,short_description.ilike.%${searchQuery}%,designer.ilike.%${searchQuery}%,maker.ilike.%${searchQuery}%`);
      }

      if (filters.designer) {
        query = query.ilike('designer', `%${filters.designer}%`);
      }

      if (filters.material) {
        query = query.ilike('material', `%${filters.material}%`);
      }

      if (filters.priceMin) {
        const min = parseFloat(filters.priceMin);
        query = query.gte('price', min);
      }

      if (filters.priceMax) {
        const max = parseFloat(filters.priceMax);
        query = query.lte('price', max);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const updateDisplayedProducts = () => {
    const endIndex = currentPage * ITEMS_PER_PAGE;
    const newDisplayed = products.slice(0, endIndex);
    setDisplayedProducts(newDisplayed);
    setHasMore(endIndex < products.length);
  };

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      setTimeout(() => {
        setCurrentPage((prev) => prev + 1);
        setLoadingMore(false);
      }, 300);
    }
  }, [loadingMore, hasMore]);

  const handleSubcategoryChange = (subcategory: Subcategory) => {
    if (subcategory.slug === 'all') {
      setSelectedSubcategory(null);
      updateURL(selectedCategory?.slug, null);
    } else {
      setSelectedSubcategory(subcategory);
      updateURL(selectedCategory?.slug, subcategory.slug);
    }
  };

  const updateURL = (categorySlug?: string, subcategorySlug?: string | null) => {
    const params = new URLSearchParams(window.location.search);

    if (categorySlug) {
      params.set('category', categorySlug);
    } else {
      params.delete('category');
    }

    if (subcategorySlug) {
      params.set('subcategory', subcategorySlug);
    } else {
      params.delete('subcategory');
    }

    const newURL = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
    window.history.pushState({}, '', newURL);
  };

  const resetFilters = () => {
    setFilters({
      status: 'all',
      onSale: false,
      designer: '',
      material: '',
      priceMin: '',
      priceMax: '',
    });
    setSearchQuery('');
  };

  const handleProductClick = (productId: string) => {
    window.location.href = `/product/${productId}`;
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="text-2xl tracking-wider">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout onSearch={setSearchQuery}>
      <div className="container mx-auto px-4 py-12">
        {selectedCategory && (
          <div className="mb-6 flex items-center gap-2 text-sm">
            <a href="/" className="flex items-center gap-1 text-gray-600 hover:text-black transition">
              <Home className="w-4 h-4" />
              <span>Home</span>
            </a>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <a href="/shop" className="text-gray-600 hover:text-black transition">
              Shop
            </a>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="font-bold">{selectedCategory.name}</span>
            {selectedSubcategory && (
              <>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <span className="font-bold">{selectedSubcategory.name}</span>
              </>
            )}
          </div>
        )}

        {selectedCategory && subcategories.length > 0 && (
          <div className="mb-8 overflow-x-auto">
            <div className="flex gap-2 pb-2">
              {subcategories.map((subcategory) => (
                <button
                  key={subcategory.id}
                  onClick={() => handleSubcategoryChange(subcategory)}
                  className={`
                    px-6 py-2 whitespace-nowrap font-bold tracking-wider transition-all
                    ${
                      (!selectedSubcategory && subcategory.slug === 'all') ||
                      selectedSubcategory?.id === subcategory.id
                        ? 'bg-black text-white'
                        : 'bg-white text-black border-2 border-black hover:bg-gray-100'
                    }
                  `}
                >
                  {subcategory.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-wider mb-2">
              {selectedCategory ? selectedCategory.name.toUpperCase() : 'SHOP'}
            </h1>
            <p className="text-gray-600 font-light lowercase">
              showing {displayedProducts.length} of {products.length} {products.length === 1 ? 'item' : 'items'}
            </p>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border-2 border-black hover:bg-black hover:text-white transition"
          >
            <Filter className="w-5 h-5" />
            <span className="tracking-wider">FILTERS</span>
          </button>
        </div>

        {showFilters && (
          <div className="mb-8 p-6 bg-gray-50 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold tracking-wider">FILTERS</h2>
              <button
                onClick={() => setShowFilters(false)}
                className="p-1 hover:bg-gray-200 rounded transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-bold mb-2 tracking-wider lowercase">status</label>
                <select
                  value={filters.status}
                  onChange={(e) =>
                    setFilters({ ...filters, status: e.target.value as any })
                  }
                  className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:border-black"
                >
                  <option value="all">All Items</option>
                  <option value="available">Available</option>
                  <option value="sold">Sold</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 tracking-wider lowercase">designer</label>
                <input
                  type="text"
                  value={filters.designer}
                  onChange={(e) => setFilters({ ...filters, designer: e.target.value })}
                  placeholder="Filter by designer"
                  className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 tracking-wider lowercase">material</label>
                <input
                  type="text"
                  value={filters.material}
                  onChange={(e) => setFilters({ ...filters, material: e.target.value })}
                  placeholder="Filter by material"
                  className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 tracking-wider lowercase">min price</label>
                <input
                  type="number"
                  value={filters.priceMin}
                  onChange={(e) => setFilters({ ...filters, priceMin: e.target.value })}
                  placeholder="Minimum price"
                  className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 tracking-wider lowercase">max price</label>
                <input
                  type="number"
                  value={filters.priceMax}
                  onChange={(e) => setFilters({ ...filters, priceMax: e.target.value })}
                  placeholder="Maximum price"
                  className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:border-black"
                />
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.onSale}
                    onChange={(e) => setFilters({ ...filters, onSale: e.target.checked })}
                    className="w-5 h-5"
                  />
                  <span className="text-sm font-bold tracking-wider lowercase">on sale only</span>
                </label>
              </div>
            </div>

            <button
              onClick={resetFilters}
              className="mt-6 px-6 py-2 text-sm tracking-wider underline hover:no-underline transition font-light lowercase"
            >
              reset all filters
            </button>
          </div>
        )}

        {products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-gray-600 font-light lowercase">no products found matching your criteria.</p>
            <button
              onClick={resetFilters}
              className="mt-4 px-6 py-3 bg-black text-white hover:bg-gray-800 transition tracking-wider"
            >
              CLEAR FILTERS
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onClick={() => handleProductClick(product.id)}
                />
              ))}
            </div>

            {hasMore && (
              <div ref={observerTarget} className="flex justify-center py-12">
                {loadingMore && (
                  <div className="text-xl tracking-wider animate-pulse font-light lowercase">loading more items...</div>
                )}
              </div>
            )}

            {!hasMore && displayedProducts.length > 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600 font-light lowercase">you've reached the end of the catalog</p>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
