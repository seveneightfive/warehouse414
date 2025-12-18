import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Consignor } from '../lib/types';

interface QuickConsignorSelectorProps {
  value: string;
  onChange: (consignorId: string) => void;
  onConsignorAdded?: (consignor: Consignor) => void;
}

export default function QuickConsignorSelector({ value, onChange, onConsignorAdded }: QuickConsignorSelectorProps) {
  const [consignors, setConsignors] = useState<Consignor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    consignor_code: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConsignors();
  }, []);

  const fetchConsignors = async () => {
    try {
      const { data, error: err } = await supabase
        .from('consignors')
        .select('*')
        .eq('is_active', true)
        .order('first_name', { ascending: true });

      if (err) throw err;
      setConsignors(data || []);
    } catch (err) {
      console.error('Error fetching consignors:', err);
      setError('Failed to load consignors');
    } finally {
      setLoading(false);
    }
  };

  const handleAddConsignor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (!formData.first_name || !formData.consignor_code) {
        setError('Name and Code are required');
        setSubmitting(false);
        return;
      }

      const { data, error: err } = await supabase
        .from('consignors')
        .insert({
          first_name: formData.first_name,
          last_name: formData.last_name || '',
          consignor_code: formData.consignor_code,
          commission_rate: 0,
          is_active: true,
        })
        .select()
        .single();

      if (err) throw err;

      const newConsignor = data as Consignor;
      setConsignors([...consignors, newConsignor]);
      onChange(newConsignor.id);

      if (onConsignorAdded) {
        onConsignorAdded(newConsignor);
      }

      setFormData({ first_name: '', last_name: '', consignor_code: '' });
      setShowAddForm(false);
    } catch (err) {
      console.error('Error adding consignor:', err);
      setError('Failed to add consignor');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Loading consignors...</div>;
  }

  return (
    <div className="space-y-3">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="font-calibri w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
        disabled={showAddForm}
      >
        <option value="">Select Consignor</option>
        {consignors.map((consignor) => (
          <option key={consignor.id} value={consignor.id}>
            {consignor.first_name} {consignor.last_name} ({consignor.consignor_code})
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={() => setShowAddForm(!showAddForm)}
        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition"
      >
        <Plus className="w-4 h-4" />
        {showAddForm ? 'Cancel' : 'Add New Consignor'}
      </button>

      {showAddForm && (
        <div className="p-4 bg-gray-50 border border-gray-200 space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1 tracking-[0.06em]">
              FIRST NAME *
            </label>
            <input
              type="text"
              required
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              className="font-calibri w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black text-sm"
              placeholder="First name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 tracking-[0.06em]">
              LAST NAME
            </label>
            <input
              type="text"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              className="font-calibri w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black text-sm"
              placeholder="Last name (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 tracking-[0.06em]">
              CONSIGNOR CODE *
            </label>
            <input
              type="text"
              required
              value={formData.consignor_code}
              onChange={(e) => setFormData({ ...formData, consignor_code: e.target.value })}
              className="font-calibri w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black text-sm"
              placeholder="e.g., CONS001"
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 border border-red-200">
              {error}
            </div>
          )}

          <button
            onClick={handleAddConsignor}
            disabled={submitting}
            className="w-full px-4 py-2 bg-black text-white text-sm hover:bg-gray-800 transition disabled:opacity-50"
          >
            {submitting ? 'Adding...' : 'Add Consignor'}
          </button>
        </div>
      )}
    </div>
  );
}
