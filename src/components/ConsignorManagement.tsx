import { useState, useEffect } from 'react';
import { Plus, Edit, UserCheck, UserX, Package } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Consignor } from '../lib/types';

export default function ConsignorManagement() {
  const [consignors, setConsignors] = useState<Consignor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingConsignor, setEditingConsignor] = useState<Consignor | null>(null);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    commission_rate: '50',
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
      const consignorCode = await generateConsignorCode(form.last_name);

      if (!consignorCode) {
        alert('Error generating consignor code. Please try again.');
        return;
      }

      const consignorData = {
        first_name: form.first_name,
        last_name: form.last_name,
        consignor_code: consignorCode,
        email: form.email || null,
        phone: form.phone || null,
        address: form.address || null,
        commission_rate: parseFloat(form.commission_rate),
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
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      address: '',
      commission_rate: '50',
      notes: '',
      is_active: true,
    });
    setEditingConsignor(null);
    setShowForm(false);
  };

  const handleEdit = (consignor: Consignor) => {
    setEditingConsignor(consignor);
    setForm({
      first_name: consignor.first_name,
      last_name: consignor.last_name,
      email: consignor.email || '',
      phone: consignor.phone || '',
      address: consignor.address || '',
      commission_rate: consignor.commission_rate.toString(),
      notes: consignor.notes || '',
      is_active: consignor.is_active,
    });
    setShowForm(true);
  };

  const toggleActive = async (consignor: Consignor) => {
    try {
      const { error } = await supabase
        .from('consignors')
        .update({ is_active: !consignor.is_active })
        .eq('id', consignor.id);

      if (error) throw error;
      fetchConsignors();
    } catch (error) {
      console.error('Error toggling consignor status:', error);
      alert('Error updating consignor status. Please try again.');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading consignors...</div>;
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                required
                placeholder="First Name *"
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                className="px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
              />
              <input
                type="text"
                required
                placeholder="Last Name *"
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                className="px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
              />
              <input
                type="tel"
                placeholder="Phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
              />
            </div>

            <textarea
              placeholder="Address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Commission Rate (%)</label>
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  step="0.01"
                  value={form.commission_rate}
                  onChange={(e) => setForm({ ...form, commission_rate: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer px-4 py-3">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="w-5 h-5"
                  />
                  <span className="text-sm font-medium tracking-[0.06em]">ACTIVE</span>
                </label>
              </div>
            </div>

            <textarea
              placeholder="Notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
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
              <th className="px-4 py-3 text-left text-sm font-medium tracking-[0.04em]">CODE</th>
              <th className="px-4 py-3 text-left text-sm font-medium tracking-[0.04em]">NAME</th>
              <th className="px-4 py-3 text-left text-sm font-medium tracking-[0.04em]">EMAIL</th>
              <th className="px-4 py-3 text-left text-sm font-medium tracking-[0.04em]">PHONE</th>
              <th className="px-4 py-3 text-left text-sm font-medium tracking-[0.04em]">
                COMMISSION
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium tracking-[0.04em]">PRODUCTS</th>
              <th className="px-4 py-3 text-left text-sm font-medium tracking-[0.04em]">STATUS</th>
              <th className="px-4 py-3 text-left text-sm font-medium tracking-[0.04em]">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {consignors.map((consignor) => (
              <tr key={consignor.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium">{consignor.consignor_code}</td>
                <td className="px-4 py-3 text-sm">
                  {consignor.first_name} {consignor.last_name}
                </td>
                <td className="px-4 py-3 text-sm">{consignor.email || '-'}</td>
                <td className="px-4 py-3 text-sm">{consignor.phone || '-'}</td>
                <td className="px-4 py-3 text-sm">{consignor.commission_rate}%</td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    <span>{productCounts[consignor.id] || 0}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">
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
                <td className="px-4 py-3 text-sm">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(consignor)}
                      className="p-2 hover:bg-gray-200 rounded transition"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleActive(consignor)}
                      className="p-2 hover:bg-gray-200 rounded transition"
                      title={consignor.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {consignor.is_active ? (
                        <UserX className="w-4 h-4 text-red-600" />
                      ) : (
                        <UserCheck className="w-4 h-4 text-green-600" />
                      )}
                    </button>
                  </div>
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
