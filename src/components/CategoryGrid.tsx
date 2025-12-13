import { useEffect, useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Category } from '../lib/types';

export default function CategoryGrid() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

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
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName];
    return Icon ? <Icon className="w-12 h-12" /> : null;
  };

  if (loading) {
    return null;
  }

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold tracking-wider mb-4">SHOP BY CATEGORY</h2>
        <p className="text-gray-600 text-lg">
          Explore our curated collection
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {categories.map((category, index) => (
          <a
            key={category.id}
            href={`/shop?category=${category.slug}`}
            className={`
              group relative overflow-hidden
              border-2 border-black
              transition-all duration-300
              hover:scale-105 hover:shadow-xl
              ${index % 2 === 0 ? 'bg-white text-black hover:bg-black hover:text-white' : 'bg-black text-white hover:bg-white hover:text-black'}
            `}
          >
            <div className="aspect-square flex flex-col items-center justify-center p-6 text-center">
              <div className="mb-4 transition-transform duration-300 group-hover:scale-110">
                {getIcon(category.icon_name)}
              </div>
              <h3 className="text-lg font-bold tracking-wider uppercase">
                {category.name}
              </h3>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
