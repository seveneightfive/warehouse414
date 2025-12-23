import { Tag } from 'lucide-react';
import type { Product } from '../lib/types';

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
  const displayPrice = product.is_on_sale && product.sale_price
    ? product.sale_price
    : product.price;

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer bg-white border border-gray-200 hover:border-black transition-all duration-300"
    >
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {product.featured_image_url ? (
          <img
            src={product.featured_image_url}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No Image
          </div>
        )}

        {product.status === 'on_hold' && (
          <div className="absolute top-4 right-4 bg-yellow-500 text-black px-3 py-1 text-xs font-bold tracking-wider">
            ON HOLD
          </div>
        )}

        {product.status === 'sold' && (
          <div className="absolute top-4 right-4 bg-black text-white px-3 py-1 text-xs font-bold tracking-wider">
            SOLD
          </div>
        )}

        {product.is_on_sale && product.status === 'available' && (
          <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 text-xs font-bold tracking-wider flex items-center gap-1">
            <Tag className="w-3 h-3" />
            SALE
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-bold text-lg tracking-wide line-clamp-2 mb-2 group-hover:text-gray-600 transition">
          {product.title}
        </h3>

        <div className="flex items-center justify-between">
          <div>
            {product.is_on_sale && product.sale_price && (
              <div className="flex items-center gap-2">
                <span className="text-lg">${displayPrice.toLocaleString()}</span>
                <span className="text-sm text-gray-500 line-through">${product.price.toLocaleString()}</span>
              </div>
            )}
            {(!product.is_on_sale || !product.sale_price) && (
              <span className="text-lg">${displayPrice.toLocaleString()}</span>
            )}
          </div>

          {product.designer && (
            <span className="text-xs text-gray-500 tracking-wide font-light">
              {product.designer}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
