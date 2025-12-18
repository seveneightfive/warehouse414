import { useState, useEffect } from 'react';
import { Calendar, Plus, FileText, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Product, SalesBatch } from '../lib/types';

interface ProductWithBatch extends Product {
  sales_batch?: SalesBatch | null;
}

export default function SalesBatchManagement() {
  const [inventoryProducts, setInventoryProducts] = useState<Product[]>([]);
  const [salesBatches, setSalesBatches] = useState<SalesBatch[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateBatch, setShowCreateBatch] = useState(false);
  const [batchForm, setBatchForm] = useState({
    title: '',
    submission_date: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'inventory')
        .eq('workflow_status', 'active')
        .is('sales_batch_id', null)
        .order('created_at', { ascending: false });

      const { data: batchesData } = await supabase
        .from('sales_batches')
        .select('*')
        .order('submission_date', { ascending: false });

      setInventoryProducts(productsData || []);
      setSalesBatches(batchesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const getNextWednesday = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilWednesday = (3 - dayOfWeek + 7) % 7 || 7;
    const nextWednesday = new Date(today);
    nextWednesday.setDate(today.getDate() + daysUntilWednesday);
    return nextWednesday.toISOString().split('T')[0];
  };

  const isWednesday = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.getDay() === 3;
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedProducts.length < 3 || selectedProducts.length > 6) {
      alert('Please select between 3 and 6 products for the batch.');
      return;
    }

    if (!isWednesday(batchForm.submission_date)) {
      alert('Submission date must be a Wednesday.');
      return;
    }

    try {
      const { data: batch, error: batchError } = await supabase
        .from('sales_batches')
        .insert({
          title: batchForm.title,
          submission_date: batchForm.submission_date,
        })
        .select()
        .single();

      if (batchError) throw batchError;

      const { error: productsError } = await supabase
        .from('products')
        .update({
          sales_batch_id: batch.id,
          workflow_stage: 'scheduled',
        })
        .in('id', selectedProducts);

      if (productsError) throw productsError;

      await supabase.rpc('calculate_workflow_due_dates', {
        batch_id_input: batch.id,
      });

      alert('Sales batch created successfully!');
      setBatchForm({ title: '', submission_date: '' });
      setSelectedProducts([]);
      setShowCreateBatch(false);
      fetchData();
    } catch (error: any) {
      console.error('Error creating batch:', error);
      alert(`Error creating batch: ${error.message}`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-normal tracking-[0.08em]">SALES BATCH SCHEDULING</h2>
        <button
          onClick={() => setShowCreateBatch(true)}
          className="flex items-center gap-2 px-6 py-3 bg-black text-white hover:bg-gray-800 transition tracking-[0.06em]"
        >
          <Plus className="w-5 h-5" />
          CREATE BATCH
        </button>
      </div>

      {showCreateBatch && (
        <div className="mb-8 p-6 bg-gray-50 border-2 border-gray-300">
          <h3 className="text-xl font-normal tracking-[0.08em] mb-6">NEW SALES BATCH</h3>
          <form onSubmit={handleCreateBatch} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 tracking-[0.06em]">
                BATCH TITLE
              </label>
              <input
                type="text"
                required
                placeholder="e.g., MCM Scandinavian Modern Week"
                value={batchForm.title}
                onChange={(e) => setBatchForm({ ...batchForm, title: e.target.value })}
                className="font-calibri w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 tracking-[0.06em]">
                SUBMISSION DATE (Wednesday Only)
              </label>
              <input
                type="date"
                required
                min={getNextWednesday()}
                value={batchForm.submission_date}
                onChange={(e) => setBatchForm({ ...batchForm, submission_date: e.target.value })}
                className="font-calibri w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
              />
              {batchForm.submission_date && !isWednesday(batchForm.submission_date) && (
                <p className="text-red-600 text-sm mt-1">Selected date must be a Wednesday</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 tracking-[0.06em]">
                SELECT PRODUCTS (3-6 products)
              </label>
              <p className="text-sm text-gray-600 mb-4">
                Selected: {selectedProducts.length} / 6 products
              </p>

              <div className="max-h-96 overflow-y-auto border border-gray-300">
                <table className="w-full">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium">SELECT</th>
                      <th className="px-4 py-2 text-left text-sm font-medium">SKU</th>
                      <th className="px-4 py-2 text-left text-sm font-medium">TITLE</th>
                      <th className="px-4 py-2 text-left text-sm font-medium">PRICE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryProducts.map((product) => (
                      <tr
                        key={product.id}
                        className={`border-b border-gray-200 ${
                          selectedProducts.includes(product.id) ? 'bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className="px-4 py-2">
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(product.id)}
                            onChange={() => handleProductSelect(product.id)}
                            disabled={
                              selectedProducts.length >= 6 && !selectedProducts.includes(product.id)
                            }
                            className="w-5 h-5"
                          />
                        </td>
                        <td className="font-calibri px-4 py-2 text-sm">{product.sku}</td>
                        <td className="font-calibri px-4 py-2 text-sm">{product.title}</td>
                        <td className="font-calibri px-4 py-2 text-sm">
                          ${product.price.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={
                  selectedProducts.length < 3 ||
                  selectedProducts.length > 6 ||
                  !isWednesday(batchForm.submission_date)
                }
                className="px-6 py-3 bg-black text-white tracking-[0.06em] hover:bg-gray-800 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                CREATE BATCH
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateBatch(false);
                  setSelectedProducts([]);
                  setBatchForm({ title: '', submission_date: '' });
                }}
                className="px-6 py-3 border-2 border-gray-300 tracking-[0.06em] hover:border-black transition"
              >
                CANCEL
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="mb-8">
        <h3 className="text-xl font-normal tracking-[0.08em] mb-4">SCHEDULED BATCHES</h3>
        {salesBatches.length === 0 ? (
          <div className="text-center py-12 text-gray-600">No sales batches scheduled yet.</div>
        ) : (
          <div className="space-y-4">
            {salesBatches.map((batch) => (
              <BatchCard key={batch.id} batch={batch} onUpdate={fetchData} />
            ))}
          </div>
        )}
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-normal tracking-[0.08em] mb-4">
          INVENTORY PRODUCTS AVAILABLE ({inventoryProducts.length})
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          These products are in inventory status and can be scheduled into a sales batch.
        </p>
      </div>
    </div>
  );
}

function BatchCard({ batch, onUpdate }: { batch: SalesBatch; onUpdate: () => void }) {
  const [products, setProducts] = useState<ProductWithBatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBatchProducts();
  }, [batch.id]);

  const fetchBatchProducts = async () => {
    try {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('sales_batch_id', batch.id)
        .order('created_at', { ascending: false });

      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching batch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getWorkflowStageColor = (stage: string) => {
    switch (stage) {
      case 'scheduled':
        return 'bg-gray-200 text-gray-800';
      case 'preparation':
        return 'bg-yellow-100 text-yellow-800';
      case 'photo':
        return 'bg-green-100 text-green-800';
      case 'edit':
        return 'bg-blue-100 text-blue-800';
      case 'for_submission':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 bg-white border-2 border-gray-300">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="text-lg font-medium tracking-[0.06em] mb-1">{batch.title}</h4>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>Submission Date: {formatDate(batch.submission_date)}</span>
          </div>
        </div>
        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium tracking-[0.06em]">
          {products.length} PRODUCTS
        </span>
      </div>

      {loading ? (
        <div className="text-center py-4 text-gray-600">Loading products...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left text-sm font-medium">SKU</th>
                <th className="px-4 py-2 text-left text-sm font-medium">TITLE</th>
                <th className="px-4 py-2 text-left text-sm font-medium">STAGE</th>
                <th className="px-4 py-2 text-left text-sm font-medium">PREP DUE</th>
                <th className="px-4 py-2 text-left text-sm font-medium">PHOTO DUE</th>
                <th className="px-4 py-2 text-left text-sm font-medium">EDIT DUE</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-gray-200">
                  <td className="font-calibri px-4 py-2 text-sm">{product.sku}</td>
                  <td className="font-calibri px-4 py-2 text-sm">{product.title}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-1 text-xs font-medium tracking-[0.06em] ${getWorkflowStageColor(
                        product.workflow_stage
                      )}`}
                    >
                      {product.workflow_stage.toUpperCase()}
                    </span>
                  </td>
                  <td className="font-calibri px-4 py-2 text-sm">
                    {product.prep_due_date
                      ? new Date(product.prep_due_date).toLocaleDateString()
                      : '-'}
                  </td>
                  <td className="font-calibri px-4 py-2 text-sm">
                    {product.photo_due_date
                      ? new Date(product.photo_due_date).toLocaleDateString()
                      : '-'}
                  </td>
                  <td className="font-calibri px-4 py-2 text-sm">
                    {product.edit_due_date
                      ? new Date(product.edit_due_date).toLocaleDateString()
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
