import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Designer } from '../lib/types';

interface DesignerFormData {
  name: string;
  about: string;
}

export default function DesignerManagement() {
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDesigner, setEditingDesigner] = useState<Designer | null>(null);
  const [form, setForm] = useState<DesignerFormData>({
    name: '',
    about: '',
  });

  useEffect(() => {
    fetchDesigners();
  }, []);

  const fetchDesigners = async () => {
    try {
      const { data: designersData, error } = await supabase
        .from('designers')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      const designersWithCount = await Promise.all(
        (designersData || []).map(async (designer) => {
          const { count } = await supabase
            .from('product_designer')
            .select('*', { count: 'exact', head: true })
            .eq('designer_id', designer.id);

          return {
            ...designer,
            product_count: count || 0,
          };
        })
      );

      setDesigners(designersWithCount);
    } catch (error) {
      console.error('Error fetching designers:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      about: '',
    });
    setEditingDesigner(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingDesigner) {
        const { error } = await supabase
          .from('designers')
          .update({
            name: form.name,
            about: form.about || null,
          })
          .eq('id', editingDesigner.id);

        if (error) throw error;
        alert('Designer updated successfully!');
      } else {
        const { error } = await supabase.from('designers').insert([
          {
            name: form.name,
            about: form.about || null,
          },
        ]);

        if (error) throw error;
        alert('Designer created successfully!');
      }

      resetForm();
      fetchDesigners();
    } catch (error: any) {
      console.error('Error saving designer:', error);
      alert(`Error saving designer: ${error.message}`);
    }
  };

  const handleEdit = (designer: Designer) => {
    setEditingDesigner(designer);
    setForm({
      name: designer.name,
      about: designer.about || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (designerId: string, productCount: number) => {
    if (productCount > 0) {
      if (
        !confirm(
          `This designer is associated with ${productCount} product(s). Deleting will remove all associations. Are you sure?`
        )
      ) {
        return;
      }
    } else {
      if (!confirm('Are you sure you want to delete this designer?')) {
        return;
      }
    }

    try {
      const { error } = await supabase.from('designers').delete().eq('id', designerId);

      if (error) throw error;
      alert('Designer deleted successfully!');
      fetchDesigners();
    } catch (error: any) {
      console.error('Error deleting designer:', error);
      alert(`Error deleting designer: ${error.message}`);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-normal tracking-[0.08em]">DESIGNER MANAGEMENT</h2>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-black text-white hover:bg-gray-800 transition tracking-[0.06em]"
        >
          <Plus className="w-5 h-5" />
          ADD DESIGNER
        </button>
      </div>

      {showForm && (
        <div className="mb-8 p-6 bg-gray-50 border-2 border-gray-300">
          <h3 className="text-xl font-normal tracking-[0.08em] mb-6">
            {editingDesigner ? 'EDIT DESIGNER' : 'NEW DESIGNER'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 tracking-[0.06em]">NAME *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="font-calibri w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
                placeholder="Designer's full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 tracking-[0.06em]">ABOUT</label>
              <textarea
                value={form.about}
                onChange={(e) => setForm({ ...form, about: e.target.value })}
                rows={6}
                className="font-calibri w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
                placeholder="Biography or description of the designer"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-3 bg-black text-white tracking-[0.06em] hover:bg-gray-800 transition"
              >
                <Save className="w-4 h-4" />
                {editingDesigner ? 'UPDATE DESIGNER' : 'CREATE DESIGNER'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="flex items-center gap-2 px-6 py-3 border-2 border-gray-300 tracking-[0.06em] hover:border-black transition"
              >
                <X className="w-4 h-4" />
                CANCEL
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-gray-300">
              <th className="font-calibri px-6 py-4 text-left text-sm font-medium tracking-[0.04em]">
                NAME
              </th>
              <th className="font-calibri px-6 py-4 text-left text-sm font-medium tracking-[0.04em]">
                ABOUT
              </th>
              <th className="font-calibri px-6 py-4 text-center text-sm font-medium tracking-[0.04em]">
                PRODUCTS
              </th>
              <th className="font-calibri px-6 py-4 text-center text-sm font-medium tracking-[0.04em]">
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody>
            {designers.map((designer) => (
              <tr key={designer.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="font-calibri px-6 py-4 text-sm font-medium">
                  {designer.name}
                </td>
                <td className="font-calibri px-6 py-4 text-sm text-gray-700">
                  {designer.about ? (
                    <div className="line-clamp-2">{designer.about}</div>
                  ) : (
                    <span className="text-gray-400 italic">No description</span>
                  )}
                </td>
                <td className="font-calibri px-6 py-4 text-sm text-center">
                  <span className="inline-flex items-center justify-center px-3 py-1 bg-blue-100 text-blue-800 font-medium rounded-full">
                    {designer.product_count || 0}
                  </span>
                </td>
                <td className="font-calibri px-6 py-4 text-sm">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleEdit(designer)}
                      className="p-2 hover:bg-gray-200 rounded transition"
                      title="Edit Designer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(designer.id, designer.product_count || 0)}
                      className="p-2 hover:bg-gray-200 rounded transition"
                      title="Delete Designer"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {designers.length === 0 && (
        <div className="text-center py-12 text-gray-600 bg-white">
          No designers yet. Click "Add Designer" to get started.
        </div>
      )}
    </div>
  );
}
