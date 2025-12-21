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
    sku: '',
  });
  const [consignorCode, setConsignorCode] = useState<string>('');

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

  const generateSKU = async (consignorCode: string, categoryId: string): Promise<string> => {
    try {
      console.log('Generating SKU with:', { consignorCode, categoryId });
      const { data, error: err } = await supabase.rpc('generate_sku', {
        consignor_code_input: consignorCode,
        category_id_input: categoryId,
      });

      if (err) {
        console.error('SKU generation error:', err);
        throw err;
      }
      console.log('Generated SKU:', data);
      return data || '';
    } catch (err) {
      console.error('Error generating SKU:', err);
      return '';
    }
  };

  const fetchConsignorCode = async (consignorId: string): Promise<string> => {
    try {
      console.log('Fetching consignor code for:', consignorId);
      const { data, error: err } = await supabase
        .from('consignors')
        .select('consignor_code')
        .eq('id', consignorId)
        .single();

      if (err) {
        console.error('Consignor fetch error:', err);
        throw err;
      }
      console.log('Fetched consignor code:', data?.consignor_code);
      return data?.consignor_code || '';
    } catch (err) {
      console.error('Error fetching consignor code:', err);
      return '';
    }
  };

  const updateSKUIfReady = async (consignorId: string, categoryId: string, currentConsignorCode?: string) => {
    if (consignorId && categoryId) {
      const code = currentConsignorCode || await fetchConsignorCode(consignorId);
      if (code) {
        const newSku = await generateSKU(code, categoryId);
        setFormData(prev => ({ ...prev, sku: newSku }));
      }
    }
  };

  const handleCategoryChange = async (categoryId: string) => {
    setFormData(prev => ({ ...prev, category_id: categoryId }));
    if (categoryId && formData.consignor_id && consignorCode) {
      await updateSKUIfReady(formData.consignor_id, categoryId, consignorCode);
    } else if (!categoryId) {
      setFormData(prev => ({ ...prev, sku: '' }));
    }
  };

  const handleConsignorChange = async (consignorId: string) => {
    setFormData(prev => ({ ...prev, consignor_id: consignorId }));
    if (consignorId) {
      const code = await fetchConsignorCode(consignorId);
      setConsignorCode(code);
      if (code && formData.category_id) {
        await updateSKUIfReady(consignorId, formData.category_id, code);
      }
    } else {
      setConsignorCode('');
      setFormData(prev => ({ ...prev, sku: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      console.log('Form submission started with data:', formData);

      if (!formData.title || !formData.category_id || !formData.consignor_id || !formData.sku) {
        setError('Please fill in all required fields');
        setSubmitting(false);
        return;
      }

      const productData = {
        sku: formData.sku,
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

      console.log('Attempting to insert product:', productData);

      const { data, error: err } = await supabase
        .from('products')
        .insert(productData)
        .select();

      if (err) {
        console.error('Insert error details:', err);
        throw err;
      }

      console.log('Successfully inserted product:', data);

      setSuccess(`Inventory item "${formData.title}" added successfully!`);
      setFormData({ title: '', category_id: '', consignor_id: '', purchase_price: '', sku: '' });
      setConsignorCode('');

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
              required
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              className="font-calibri w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
              placeholder="Auto-generated or enter manually"
            />
            <p className="text-xs text-gray-500 mt-1">Auto-generated (editable)</p>
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
            onChange={handleConsignorChange}
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
              setFormData({ title: '', category_id: '', consignor_id: '', purchase_price: '', sku: '' });
              setConsignorCode('');
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
