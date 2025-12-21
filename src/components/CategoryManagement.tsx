import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Category, Subcategory } from '../lib/types';

interface CategoryFormData {
  name: string;
  slug: string;
  icon_name: string;
  display_order: number;
}

interface SubcategoryFormData {
  name: string;
  slug: string;
  display_order: number;
  category_id: string;
}

export default function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryFormData>({
    name: '',
    slug: '',
    icon_name: '',
    display_order: 1,
  });

  const [showSubcategoryForm, setShowSubcategoryForm] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [subcategoryForm, setSubcategoryForm] = useState<SubcategoryFormData>({
    name: '',
    slug: '',
    display_order: 0,
    category_id: '',
  });

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [categoriesResult, subcategoriesResult] = await Promise.all([
        supabase.from('categories').select('*').order('display_order', { ascending: true }),
        supabase.from('subcategories').select('*').order('display_order', { ascending: true }),
      ]);

      setCategories(categoriesResult.data || []);
      setSubcategories(subcategoriesResult.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      name: '',
      slug: '',
      icon_name: '',
      display_order: categories.length + 1,
    });
    setEditingCategory(null);
    setShowCategoryForm(false);
  };

  const resetSubcategoryForm = () => {
    setSubcategoryForm({
      name: '',
      slug: '',
      display_order: 0,
      category_id: '',
    });
    setEditingSubcategory(null);
    setShowSubcategoryForm(false);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update(categoryForm)
          .eq('id', editingCategory.id);

        if (error) throw error;
        alert('Category updated successfully!');
      } else {
        const { error } = await supabase
          .from('categories')
          .insert([categoryForm]);

        if (error) throw error;
        alert('Category created successfully!');
      }

      resetCategoryForm();
      fetchData();
    } catch (error: any) {
      console.error('Error saving category:', error);
      alert(`Error saving category: ${error.message}`);
    }
  };

  const handleSubcategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingSubcategory) {
        const { error } = await supabase
          .from('subcategories')
          .update({
            name: subcategoryForm.name,
            slug: subcategoryForm.slug,
            display_order: subcategoryForm.display_order,
          })
          .eq('id', editingSubcategory.id);

        if (error) throw error;
        alert('Subcategory updated successfully!');
      } else {
        const { error } = await supabase
          .from('subcategories')
          .insert([subcategoryForm]);

        if (error) throw error;
        alert('Subcategory created successfully!');
      }

      resetSubcategoryForm();
      fetchData();
    } catch (error: any) {
      console.error('Error saving subcategory:', error);
      alert(`Error saving subcategory: ${error.message}`);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      slug: category.slug,
      icon_name: category.icon_name,
      display_order: category.display_order,
    });
    setShowCategoryForm(true);
  };

  const handleEditSubcategory = (subcategory: Subcategory) => {
    setEditingSubcategory(subcategory);
    setSubcategoryForm({
      name: subcategory.name,
      slug: subcategory.slug,
      display_order: subcategory.display_order,
      category_id: subcategory.category_id,
    });
    setShowSubcategoryForm(true);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? This will also delete all associated subcategories and unlink products.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;
      alert('Category deleted successfully!');
      fetchData();
    } catch (error: any) {
      console.error('Error deleting category:', error);
      alert(`Error deleting category: ${error.message}`);
    }
  };

  const handleDeleteSubcategory = async (subcategoryId: string) => {
    if (!confirm('Are you sure you want to delete this subcategory? Products using it will be unlinked.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('subcategories')
        .delete()
        .eq('id', subcategoryId);

      if (error) throw error;
      alert('Subcategory deleted successfully!');
      fetchData();
    } catch (error: any) {
      console.error('Error deleting subcategory:', error);
      alert(`Error deleting subcategory: ${error.message}`);
    }
  };

  const handleAddSubcategory = (categoryId: string) => {
    const categorySubcategories = subcategories.filter(s => s.category_id === categoryId);
    setSubcategoryForm({
      name: '',
      slug: '',
      display_order: categorySubcategories.length,
      category_id: categoryId,
    });
    setShowSubcategoryForm(true);
  };

  const getCategorySubcategories = (categoryId: string) => {
    return subcategories.filter(s => s.category_id === categoryId);
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-normal tracking-[0.08em]">CATEGORY MANAGEMENT</h2>
        <button
          onClick={() => {
            resetCategoryForm();
            setShowCategoryForm(true);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-black text-white hover:bg-gray-800 transition tracking-[0.06em]"
        >
          <Plus className="w-5 h-5" />
          ADD CATEGORY
        </button>
      </div>

      {showCategoryForm && (
        <div className="mb-8 p-6 bg-gray-50 border-2 border-gray-300">
          <h3 className="text-xl font-normal tracking-[0.08em] mb-6">
            {editingCategory ? 'EDIT CATEGORY' : 'NEW CATEGORY'}
          </h3>
          <form onSubmit={handleCategorySubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 tracking-[0.06em]">NAME *</label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="font-calibri w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 tracking-[0.06em]">SLUG *</label>
                <input
                  type="text"
                  required
                  value={categoryForm.slug}
                  onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  className="font-calibri w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
                  placeholder="lowercase-with-dashes"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 tracking-[0.06em]">ICON NAME *</label>
                <input
                  type="text"
                  required
                  value={categoryForm.icon_name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, icon_name: e.target.value })}
                  className="font-calibri w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
                  placeholder="Lucide icon name (e.g., Package)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 tracking-[0.06em]">DISPLAY ORDER *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={categoryForm.display_order}
                  onChange={(e) => setCategoryForm({ ...categoryForm, display_order: parseInt(e.target.value) })}
                  className="font-calibri w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-3 bg-black text-white tracking-[0.06em] hover:bg-gray-800 transition"
              >
                <Save className="w-4 h-4" />
                {editingCategory ? 'UPDATE CATEGORY' : 'CREATE CATEGORY'}
              </button>
              <button
                type="button"
                onClick={resetCategoryForm}
                className="flex items-center gap-2 px-6 py-3 border-2 border-gray-300 tracking-[0.06em] hover:border-black transition"
              >
                <X className="w-4 h-4" />
                CANCEL
              </button>
            </div>
          </form>
        </div>
      )}

      {showSubcategoryForm && (
        <div className="mb-8 p-6 bg-blue-50 border-2 border-blue-300">
          <h3 className="text-xl font-normal tracking-[0.08em] mb-6">
            {editingSubcategory ? 'EDIT SUBCATEGORY' : 'NEW SUBCATEGORY'}
          </h3>
          <form onSubmit={handleSubcategorySubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 tracking-[0.06em]">CATEGORY *</label>
                <select
                  required
                  value={subcategoryForm.category_id}
                  onChange={(e) => setSubcategoryForm({ ...subcategoryForm, category_id: e.target.value })}
                  className="font-calibri w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
                  disabled={!!editingSubcategory}
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
                <label className="block text-sm font-medium mb-2 tracking-[0.06em]">NAME *</label>
                <input
                  type="text"
                  required
                  value={subcategoryForm.name}
                  onChange={(e) => setSubcategoryForm({ ...subcategoryForm, name: e.target.value })}
                  className="font-calibri w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 tracking-[0.06em]">SLUG *</label>
                <input
                  type="text"
                  required
                  value={subcategoryForm.slug}
                  onChange={(e) => setSubcategoryForm({ ...subcategoryForm, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  className="font-calibri w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
                  placeholder="lowercase-with-dashes"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 tracking-[0.06em]">DISPLAY ORDER *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={subcategoryForm.display_order}
                  onChange={(e) => setSubcategoryForm({ ...subcategoryForm, display_order: parseInt(e.target.value) })}
                  className="font-calibri w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-3 bg-black text-white tracking-[0.06em] hover:bg-gray-800 transition"
              >
                <Save className="w-4 h-4" />
                {editingSubcategory ? 'UPDATE SUBCATEGORY' : 'CREATE SUBCATEGORY'}
              </button>
              <button
                type="button"
                onClick={resetSubcategoryForm}
                className="flex items-center gap-2 px-6 py-3 border-2 border-gray-300 tracking-[0.06em] hover:border-black transition"
              >
                <X className="w-4 h-4" />
                CANCEL
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {categories.map((category) => {
          const isExpanded = expandedCategories.has(category.id);
          const categorySubcategories = getCategorySubcategories(category.id);

          return (
            <div key={category.id} className="bg-white border border-gray-300 overflow-hidden">
              <div className="flex items-center justify-between p-4 bg-gray-100">
                <div className="flex items-center gap-4 flex-1">
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="text-gray-600 hover:text-black transition"
                  >
                    {isExpanded ? '▼' : '▶'}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-lg tracking-[0.06em]">{category.name}</span>
                      <span className="text-sm text-gray-500">({category.slug})</span>
                      <span className="text-sm text-gray-500">Icon: {category.icon_name}</span>
                      <span className="text-xs bg-gray-200 px-2 py-1 rounded">Order: {category.display_order}</span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {categorySubcategories.length} subcategory(ies)
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAddSubcategory(category.id)}
                    className="p-2 hover:bg-gray-200 rounded transition"
                    title="Add Subcategory"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEditCategory(category)}
                    className="p-2 hover:bg-gray-200 rounded transition"
                    title="Edit Category"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="p-2 hover:bg-gray-200 rounded transition"
                    title="Delete Category"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="p-4 bg-gray-50">
                  <h4 className="text-sm font-medium tracking-[0.06em] mb-3">SUBCATEGORIES</h4>
                  {categorySubcategories.length === 0 ? (
                    <div className="text-sm text-gray-600 italic">No subcategories yet.</div>
                  ) : (
                    <div className="space-y-2">
                      {categorySubcategories.map((subcategory) => (
                        <div
                          key={subcategory.id}
                          className="flex items-center justify-between p-3 bg-white border border-gray-200"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-medium">{subcategory.name}</span>
                            <span className="text-sm text-gray-500">({subcategory.slug})</span>
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                              Order: {subcategory.display_order}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditSubcategory(subcategory)}
                              className="p-2 hover:bg-gray-100 rounded transition"
                              title="Edit Subcategory"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSubcategory(subcategory.id)}
                              className="p-2 hover:bg-gray-100 rounded transition"
                              title="Delete Subcategory"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-12 text-gray-600">
          No categories yet. Click "Add Category" to get started.
        </div>
      )}
    </div>
  );
}
