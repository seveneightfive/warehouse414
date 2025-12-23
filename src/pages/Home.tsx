import { useState, useEffect } from 'react';
import { Star, ArrowRight } from 'lucide-react';
import Layout from '../components/Layout';
import ProductCard from '../components/ProductCard';
import CategoryGrid from '../components/CategoryGrid';
import { supabase } from '../lib/supabase';
import type { Product, Review } from '../lib/types';

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      const { data: productsData } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(name, slug),
          subcategory:subcategories(name, slug)
        `)
        .eq('is_featured', true)
        .in('status', ['available', 'on_hold', 'sold'])
        .limit(6);

      setFeaturedProducts(productsData || []);

      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*')
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(6);

      setReviews(reviewsData || []);
    } catch (error) {
      console.error('Error fetching home data:', error);
    } finally {
      setLoading(false);
    }
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
    <Layout>
      <section className="bg-black text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-2xl md:text-3xl tracking-wide mb-8 font-['Kabel']">
            unique, one-of-a-kind high style furnishings
          </p>
          <a
            href="/shop"
            className="inline-block px-8 py-4 bg-white text-black font-bold tracking-wider hover:bg-gray-200 transition"
          >
            EXPLORE COLLECTION
          </a>
        </div>
      </section>

      <CategoryGrid />

      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold tracking-wider mb-4">FEATURED COLLECTION</h2>
          <p className="text-gray-600 text-lg font-light lowercase">
            curated pieces for the discerning collector
          </p>
        </div>

        {featuredProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onClick={() => handleProductClick(product.id)}
                />
              ))}
            </div>

            <div className="text-center">
              <a
                href="/shop"
                className="inline-flex items-center gap-2 px-8 py-3 border-2 border-black hover:bg-black hover:text-white transition font-bold tracking-wider"
              >
                VIEW ALL ITEMS
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg font-light">
              new featured items coming soon. check back later!
            </p>
            <a
              href="/shop"
              className="inline-block mt-4 px-8 py-3 bg-black text-white hover:bg-gray-800 transition font-bold tracking-wider"
            >
              BROWSE ALL ITEMS
            </a>
          </div>
        )}
      </section>

      <section className="bg-gray-50 py-16">

        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold tracking-wider mb-4">WHAT OUR CLIENTS SAY</h2>
            <p className="text-gray-600 text-lg font-light">
              trusted by collectors and designers worldwide
            </p>
          </div>

          {reviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white p-6 border border-gray-200 hover:border-black transition"
                >
                  <div className="flex items-center gap-1 mb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < review.rating
                            ? 'fill-black stroke-black'
                            : 'stroke-gray-300'
                        }`}
                      />
                    ))}
                  </div>

                  <p className="text-gray-700 mb-4 leading-relaxed font-light">
                    {review.review_text}
                  </p>

                  <p className="font-bold tracking-wider text-sm">{review.customer_name}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 font-light">no reviews yet. be the first to share your experience!</p>
            </div>
          )}
        </div>

      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold tracking-wider mb-4">OH, THE PLACES YOU'LL GO</h2>
          <p className="text-gray-600 text-lg mb-8 font-light">
            find us on your favorite marketplaces
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <a
            href="https://www.1stdibs.com/dealers/warehouse-414/?_ga=2.218083090.542038144.1661879061-207012027.1661280070"
            target="_blank"
            rel="noopener noreferrer"
            className="p-8 border-2 border-gray-300 hover:border-black transition text-center group"
          >
            <div className="text-2xl font-bold mb-2 group-hover:scale-105 transition">
              1stDibs
            </div>
            <p className="text-sm text-gray-600 font-light lowercase">luxury marketplace</p>
          </a>

          <a
            href="https://www.chairish.com/shop/warehouse414?_ga=2.146694704.542038144.1661879061-207012027.1661280070"
            target="_blank"
            rel="noopener noreferrer"
            className="p-8 border-2 border-gray-300 hover:border-black transition text-center group"
          >
            <div className="text-2xl font-bold mb-2 group-hover:scale-105 transition">
              Charish
            </div>
            <p className="text-sm text-gray-600 font-light lowercase">curated vintage</p>
          </a>

          <a
            href="https://www.ebay.com/str/warehouse414"
            target="_blank"
            rel="noopener noreferrer"
            className="p-8 border-2 border-gray-300 hover:border-black transition text-center group"
          >
            <div className="text-2xl font-bold mb-2 group-hover:scale-105 transition">
              eBay
            </div>
            <p className="text-sm text-gray-600 font-light lowercase">global marketplace</p>
          </a>
        </div>
      </section>
    </Layout>
  );
}
