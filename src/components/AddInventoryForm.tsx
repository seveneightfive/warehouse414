import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Category, Consignor } from '../lib/types';
import QuickConsignorSelector from './QuickConsignorSelector';

export default function AddInventoryForm() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    category_id: '',
    consignor_id: '',
    purchase_price: '',
  });

  const [sku, setSku] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error: err } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (err) throw err;
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const generateSKU = async (categoryId: string): Promise<string> => {
    try {
      const { data, error: err } = await supabase.rpc('generate_sku', {
        category_id_input: categoryId,
      });

      if (err) throw err;
      return data || '';
    } catch (err) {
      console.error('Error generating SKU:', err);
      return '';
    }
  };

  const handleCategoryChange = async (categoryId: string) => {
    setFormData({ ...formData, category_id: categoryId });
    if (categoryId) {
      const newSku = await generateSKU(categoryId);
      setSku(newSku);
    } else {
      setSku('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      if (!formData.title || !formData.category_id || !formData.consignor_id) {
        setError('Please fill in all required fields');
        setSubmitting(false);
        return;
      }

      const productData = {
        sku: sku,
        title: formData.title,
        category_id: formData.category_id,
        consignor_id: formData.consignor_id,
        purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : null,
        price: 0,
        status: 'inventory' as const,
        workflow_stage: 'received' as const,
        workflow_status: 'active',
        is_on_sale: false,
        is_featured: false,
        short_description: null,
        full_description: null,
        maker: null,
        designer: null,
        material: null,
        dimensions: null,
        crate_size: null,
        sale_price: null,
        featured_image_url: null,
        consignor: null,
        sales_batch_id: null,
        prep_due_date: null,
        photo_due_date: null,
        edit_due_date: null,
        submission_due_date: null,
        subcategory_id: null,
      };

      const { error: err } = await supabase
        .from('products')
        .insert(productData);

      if (err) throw err;

      setSuccess(`Inventory item "${formData.title}" added successfully!`);
      setFormData({ title: '', category_id: '', consignor_id: '', purchase_price: '' });
      setSku('');

      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error('Error adding inventory:', err);
      setError('Failed to add inventory item. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Plus className="w-6 h-6" />
        <h2 className="text-2xl font-normal tracking-[0.08em]">ADD INVENTORY</h2>
      </div>

      <form onSubmit={handleSubmit} className="bg-gray-50 border-2 border-gray-300 p-8 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 border border-green-200 text-green-800 text-sm">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2 tracking-[0.06em]">
              CATEGORY *
            </label>
            <select
              required
              value={formData.category_id}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="font-calibri w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
            >
              <option value="">Select Category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 tracking-[0.06em]">
              SKU *
            </label>
            <input
              type="text"
              value={sku}
              disabled
              className="font-calibri w-full px-4 py-3 border border-gray-300 bg-gray-100 text-gray-600"
            />
            <p className="text-xs text-gray-500 mt-1">Auto-generated</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 tracking-[0.06em]">
            TITLE *
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="font-calibri w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
            placeholder="Product title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 tracking-[0.06em]">
            CONSIGNOR *
          </label>
          <QuickConsignorSelector
            value={formData.consignor_id}
            onChange={(consignorId) => setFormData({ ...formData, consignor_id: consignorId })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 tracking-[0.06em]">
            PURCHASE PRICE
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={formData.purchase_price}
            onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
            className="font-calibri w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
            placeholder="Optional"
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 bg-black text-white tracking-[0.06em] hover:bg-gray-800 transition disabled:opacity-50"
          >
            {submitting ? 'ADDING...' : 'ADD INVENTORY'}
          </button>
          <button
            type="button"
            onClick={() => {
              setFormData({ title: '', category_id: '', consignor_id: '', purchase_price: '' });
              setSku('');
              setError(null);
            }}
            className="px-6 py-3 border-2 border-gray-300 tracking-[0.06em] hover:border-black transition"
          >
            CLEAR
          </button>
        </div>
      </form>
    </div>
  );
}
