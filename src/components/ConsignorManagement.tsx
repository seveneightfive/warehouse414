import { useState, useEffect } from 'react';
import { Plus, Edit, Package, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Consignor, Product } from '../lib/types';

export default function ConsignorManagement() {
  const [consignors, setConsignors] = useState<Consignor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingConsignor, setEditingConsignor] = useState<Consignor | null>(null);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [viewingConsignor, setViewingConsignor] = useState<Consignor | null>(null);
  const [consignorProducts, setConsignorProducts] = useState<Product[]>([]);

  const [form, setForm] = useState({
    consignor_code: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
    is_active: true,
  });

  useEffect(() => {
    fetchConsignors();
  }, []);

  const fetchConsignors = async () => {
    try {
      const { data: consignorsData } = await supabase
        .from('consignors')
        .select('*')
        .order('last_name', { ascending: true });

      if (consignorsData) {
        setConsignors(consignorsData);

        const counts: Record<string, number> = {};
        for (const consignor of consignorsData) {
          const { count } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('consignor_id', consignor.id);
          counts[consignor.id] = count || 0;
        }
        setProductCounts(counts);
      }
    } catch (error) {
      console.error('Error fetching consignors:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateConsignorCode = async (lastName: string): Promise<string> => {
    const { data, error } = await supabase.rpc('generate_consignor_code', {
      last_name_input: lastName,
    });

    if (error) {
      console.error('Error generating consignor code:', error);
      return '';
    }

    return data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let consignorCode = form.consignor_code;

      if (!editingConsignor) {
        consignorCode = await generateConsignorCode(form.last_name);
        if (!consignorCode) {
          alert('Error generating consignor code. Please try again.');
          return;
        }
      }

      const consignorData = {
        first_name: form.first_name,
        last_name: form.last_name,
        consignor_code: consignorCode,
        email: form.email || null,
        phone: form.phone || null,
        address: form.address || null,
        notes: form.notes || null,
        is_active: form.is_active,
      };

      if (editingConsignor) {
        const { error } = await supabase
          .from('consignors')
          .update(consignorData)
          .eq('id', editingConsignor.id);

        if (error) throw error;
        alert('Consignor updated successfully!');
      } else {
        const { error } = await supabase.from('consignors').insert(consignorData);

        if (error) throw error;
        alert(`Consignor created successfully! Code: ${consignorCode}`);
      }

      resetForm();
      fetchConsignors();
    } catch (error) {
      console.error('Error saving consignor:', error);
      alert('Error saving consignor. Please try again.');
    }
  };

  const resetForm = () => {
    setForm({
      consignor_code: '',
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      address: '',
      notes: '',
      is_active: true,
    });
    setEditingConsignor(null);
    setShowForm(false);
  };

  const handleEdit = (consignor: Consignor, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingConsignor(consignor);
    setForm({
      consignor_code: consignor.consignor_code,
      first_name: consignor.first_name,
      last_name: consignor.last_name,
      email: consignor.email || '',
      phone: consignor.phone || '',
      address: consignor.address || '',
      notes: consignor.notes || '',
      is_active: consignor.is_active,
    });
    setShowForm(true);
  };

  const handleViewConsignor = async (consignor: Consignor) => {
    setViewingConsignor(consignor);
    try {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('consignor_id', consignor.id)
        .order('created_at', { ascending: false });

      setConsignorProducts(data || []);
    } catch (error) {
      console.error('Error fetching consignor products:', error);
    }
  };

  const handleBackToList = () => {
    setViewingConsignor(null);
    setConsignorProducts([]);
  };

  if (loading) {
    return <div className="text-center py-12">Loading consignors...</div>;
  }

  if (viewingConsignor) {
    const inventoryProducts = consignorProducts.filter(p => p.status === 'inventory');
    const availableProducts = consignorProducts.filter(p => p.status === 'available');
    const soldProducts = consignorProducts.filter(p => p.status === 'sold');

    return (
      <div>
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={handleBackToList}
            className="p-2 hover:bg-gray-100 rounded transition"
            title="Back to list"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-normal tracking-[0.08em]">
            {viewingConsignor.first_name} {viewingConsignor.last_name} ({viewingConsignor.consignor_code})
          </h2>
        </div>

        <div className="space-y-8">
          <div>
            <h3 className="text-xl font-normal tracking-[0.08em] mb-4 pb-2 border-b-2 border-gray-300">
              INVENTORY ({inventoryProducts.length})
            </h3>
            {inventoryProducts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="font-calibri px-4 py-3 text-left text-sm font-medium tracking-[0.04em]">TITLE</th>
                      <th className="font-calibri px-4 py-3 text-left text-sm font-medium tracking-[0.04em]">ACQUISITION DATE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryProducts.map((product) => (
                      <tr key={product.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="font-calibri px-4 py-3 text-sm">{product.title}</td>
                        <td className="font-calibri px-4 py-3 text-sm">
                          {product.created_at ? new Date(product.created_at).toLocaleDateString() : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No inventory items</p>
            )}
          </div>

          <div>
            <h3 className="text-xl font-normal tracking-[0.08em] mb-4 pb-2 border-b-2 border-gray-300">
              AVAILABLE ({availableProducts.length})
            </h3>
            {availableProducts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="font-calibri px-4 py-3 text-left text-sm font-medium tracking-[0.04em]">SKU</th>
                      <th className="font-calibri px-4 py-3 text-left text-sm font-medium tracking-[0.04em]">TITLE</th>
                      <th className="font-calibri px-4 py-3 text-left text-sm font-medium tracking-[0.04em]">POSTED DATE</th>
                      <th className="font-calibri px-4 py-3 text-left text-sm font-medium tracking-[0.04em]">PRICE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {availableProducts.map((product) => (
                      <tr key={product.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="font-calibri px-4 py-3 text-sm font-medium">{product.sku}</td>
                        <td className="font-calibri px-4 py-3 text-sm">{product.title}</td>
                        <td className="font-calibri px-4 py-3 text-sm">
                          {product.created_at ? new Date(product.created_at).toLocaleDateString() : '-'}
                        </td>
                        <td className="font-calibri px-4 py-3 text-sm">${product.price?.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No available products</p>
            )}
          </div>

          <div>
            <h3 className="text-xl font-normal tracking-[0.08em] mb-4 pb-2 border-b-2 border-gray-300">
              SOLD ({soldProducts.length})
            </h3>
            {soldProducts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="font-calibri px-4 py-3 text-left text-sm font-medium tracking-[0.04em]">TITLE</th>
                      <th className="font-calibri px-4 py-3 text-left text-sm font-medium tracking-[0.04em]">SOLD PRICE</th>
                      <th className="font-calibri px-4 py-3 text-left text-sm font-medium tracking-[0.04em]">DATE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {soldProducts.map((product) => (
                      <tr key={product.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="font-calibri px-4 py-3 text-sm">{product.title}</td>
                        <td className="font-calibri px-4 py-3 text-sm">${product.price?.toFixed(2)}</td>
                        <td className="font-calibri px-4 py-3 text-sm">
                          {product.updated_at ? new Date(product.updated_at).toLocaleDateString() : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No sold products</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-normal tracking-[0.08em]">CONSIGNOR MANAGEMENT</h2>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-black text-white hover:bg-gray-800 transition tracking-[0.06em]"
        >
          <Plus className="w-5 h-5" />
          ADD CONSIGNOR
        </button>
      </div>

      {showForm && (
        <div className="mb-8 p-6 bg-gray-50 border-2 border-gray-300">
          <h3 className="text-xl font-normal tracking-[0.08em] mb-6">
            {editingConsignor ? 'EDIT CONSIGNOR' : 'NEW CONSIGNOR'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {editingConsignor && (
              <div>
                <label className="font-calibri block text-sm font-medium mb-2">Consignor Code</label>
                <input
                  type="text"
                  required
                  placeholder="Consignor Code"
                  value={form.consignor_code}
                  onChange={(e) => setForm({ ...form, consignor_code: e.target.value })}
                  className="font-calibri w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                required
                placeholder="First Name *"
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                className="font-calibri px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
              />
              <input
                type="text"
                required
                placeholder="Last Name *"
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                className="font-calibri px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="font-calibri px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
              />
              <input
                type="tel"
                placeholder="Phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="font-calibri px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
              />
            </div>

            <textarea
              placeholder="Address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              rows={3}
              className="font-calibri w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
            />

            <div className="flex items-center gap-2 mb-4">
              <label className="flex items-center gap-2 cursor-pointer px-4 py-3">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="w-5 h-5"
                />
                <span className="font-calibri text-sm font-medium tracking-[0.06em]">ACTIVE</span>
              </label>
            </div>

            <textarea
              placeholder="Notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="font-calibri w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
            />

            <div className="flex gap-4">
              <button
                type="submit"
                className="px-6 py-3 bg-black text-white tracking-[0.06em] hover:bg-gray-800 transition"
              >
                {editingConsignor ? 'UPDATE CONSIGNOR' : 'CREATE CONSIGNOR'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 border-2 border-gray-300 tracking-[0.06em] hover:border-black transition"
              >
                CANCEL
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="font-calibri px-4 py-3 text-left text-sm font-medium tracking-[0.04em]">CODE</th>
              <th className="font-calibri px-4 py-3 text-left text-sm font-medium tracking-[0.04em]">NAME</th>
              <th className="font-calibri px-4 py-3 text-left text-sm font-medium tracking-[0.04em]">EMAIL</th>
              <th className="font-calibri px-4 py-3 text-left text-sm font-medium tracking-[0.04em]">PHONE</th>
              <th className="font-calibri px-4 py-3 text-left text-sm font-medium tracking-[0.04em]">PRODUCTS</th>
              <th className="font-calibri px-4 py-3 text-left text-sm font-medium tracking-[0.04em]">STATUS</th>
              <th className="font-calibri px-4 py-3 text-left text-sm font-medium tracking-[0.04em]">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {consignors.map((consignor) => (
              <tr
                key={consignor.id}
                className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                onClick={() => handleViewConsignor(consignor)}
              >
                <td className="font-calibri px-4 py-3 text-sm font-medium">{consignor.consignor_code}</td>
                <td className="font-calibri px-4 py-3 text-sm">
                  {consignor.first_name} {consignor.last_name}
                </td>
                <td className="font-calibri px-4 py-3 text-sm">{consignor.email || '-'}</td>
                <td className="font-calibri px-4 py-3 text-sm">{consignor.phone || '-'}</td>
                <td className="font-calibri px-4 py-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    <span>{productCounts[consignor.id] || 0}</span>
                  </div>
                </td>
                <td className="font-calibri px-4 py-3 text-sm">
                  <span
                    className={`px-2 py-1 text-xs font-medium tracking-[0.06em] ${
                      consignor.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {consignor.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </td>
                <td className="font-calibri px-4 py-3 text-sm">
                  <button
                    onClick={(e) => handleEdit(consignor, e)}
                    className="p-2 hover:bg-gray-200 rounded transition"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {consignors.length === 0 && (
        <div className="text-center py-12 text-gray-600">
          No consignors yet. Click "Add Consignor" to get started.
        </div>
      )}
    </div>
  );
}
