import { createContext, useContext, useRef, ReactNode } from 'react';
import type { Product, Category, Subcategory } from '../lib/types';

interface ShopFilters {
  status: 'all' | 'available' | 'sold';
  onSale: boolean;
  designer: string;
  material: string;
  priceMin: string;
  priceMax: string;
}

interface ShopState {
  products: Product[];
  displayedProducts: Product[];
  currentPage: number;
  searchQuery: string;
  showFilters: boolean;
  categories: Category[];
  subcategories: Subcategory[];
  selectedCategory: Category | null;
  selectedSubcategory: Subcategory | null;
  filters: ShopFilters;
  scrollPosition: number;
}

interface ShopStateContextType {
  saveState: (state: Omit<ShopState, 'scrollPosition'>) => void;
  getState: () => ShopState | null;
  clearState: () => void;
}

const ShopStateContext = createContext<ShopStateContextType | undefined>(undefined);

const STORAGE_KEY = 'warehouse414_shop_state';

export function ShopStateProvider({ children }: { children: ReactNode }) {
  const stateRef = useRef<ShopState | null>(null);

  const saveState = (state: Omit<ShopState, 'scrollPosition'>) => {
    const fullState: ShopState = {
      ...state,
      scrollPosition: window.scrollY || document.documentElement.scrollTop,
    };

    stateRef.current = fullState;

    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(fullState));
    } catch (error) {
      console.error('Failed to save shop state:', error);
    }
  };

  const getState = (): ShopState | null => {
    if (stateRef.current) {
      return stateRef.current;
    }

    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        stateRef.current = parsed;
        return parsed;
      }
    } catch (error) {
      console.error('Failed to retrieve shop state:', error);
    }

    return null;
  };

  const clearState = () => {
    stateRef.current = null;
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear shop state:', error);
    }
  };

  return (
    <ShopStateContext.Provider value={{ saveState, getState, clearState }}>
      {children}
    </ShopStateContext.Provider>
  );
}

export function useShopState() {
  const context = useContext(ShopStateContext);
  if (context === undefined) {
    throw new Error('useShopState must be used within a ShopStateProvider');
  }
  return context;
}
