import { useState, useEffect } from 'react';
import { Package, Users, BarChart3, Settings, Plus, CreditCard as Edit, Trash2, Eye, Calendar, FileText, Workflow } from 'lucide-react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import type { Product, Category, Subcategory } from '../lib/types';
import { ImageUploadManager, type ImageData } from '../components/ImageUploadManager';
import ConsignorManagement from '../components/ConsignorManagement';
import WorkflowTaskManagement from '../components/WorkflowTaskManagement';
import SalesBatchManagement from '../components/SalesBatchManagement';
import SalesBatchReports from '../components/SalesBatchReports';
import ConsignorReports from '../components/ConsignorReports';

type AdminTab = 
  | 'products' 
  | 'consignors' 
  | 'workflow' 
  | 'sales-batches' 
  | 'batch-reports' 
  | 'consignor-reports' 
  | 'categories';

export default function Admin() {
  const [activeTab, setActiveTab] = useState<AdminTab>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [productForm, setProductForm] = useState({
    sku: '',
    title: '',
    short_description: '',
    full_description: '',
    maker: '',
    designer: '',
    material: '',
    dimensions: '',
    crate_size: '',
    price: '',
    sale_price: '',
    is_on_sale: false,
    status: 'inventory' as const,
    featured_image_url: '',
    consignor: '',
    workflow_stage: 'research' as const,
    is_featured: false,
    category_id: '',
    subcategory_id: '',
  });

  const [productImages, setProductImages] = useState<ImageData[]>([]);
  const [featuredImageUrl, setFeaturedImageUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: productsData } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(name, slug),
          subcategory:subcategories(name, slug)
        `)
        .order('created_at', { ascending: false });

      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });

      const { data: subcategoriesData } = await supabase
        .from('subcategories')
        .select('*')
        .order('display_order', { ascending: true });

      setProducts(productsData || []);
      setCategories(categoriesData || []);
      setSubcategories(subcategoriesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSKU = async (categoryId: string): Promise<string> => {
    const { data, error } = await supabase.rpc('generate_sku', {
      category_id_input: categoryId,
    });

    if (error) {
      console.error('Error generating SKU:', error);
      return '';
    }

    return data;
  };

  const handleCategoryChange = async (categoryId: string) => {
    setProductForm({ ...productForm, category_id: categoryId, subcategory_id: '' });

    if (categoryId && !editingProduct) {
      const sku = await generateSKU(categoryId);
      setProductForm((prev) => ({ ...prev, sku }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const productData = {
        sku: productForm.sku,
        title: productForm.title,
        short_description: productForm.short_description || null,
        full_description: productForm.full_description || null,
        maker: productForm.maker || null,
        designer: productForm.designer || null,
        material: productForm.material || null,
        dimensions: productForm.dimensions || null,
        crate_size: productForm.crate_size || null,
        price: parseFloat(productForm.price),
        sale_price: productForm.sale_price ? parseFloat(productForm.sale_price) : null,
        is_on_sale: productForm.is_on_sale,
        status: productForm.status,
        featured_image_url: featuredImageUrl,
        consignor: productForm.consignor || null,
        workflow_stage: productForm.workflow_stage,
        is_featured: productForm.is_featured,
        category_id: productForm.category_id || null,
        subcategory_id: productForm.subcategory_id || null,
      };

      let productId: string;

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        productId = editingProduct.id;
        alert('Product updated successfully!');
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert(productData)
          .select()
          .single();

        if (error) throw error;
        productId = data.id;
        alert('Product created successfully!');
      }

      if (productImages.length > 0) {
        const existingImages = await supabase
          .from('product_images')
          .select('*')
          .eq('product_id', productId);

        if (existingImages.data) {
          await supabase
            .from('product_images')
            .delete()
            .eq('product_id', productId);
        }

        const imageInserts = productImages.map((img) => ({
          product_id: productId,
          image_url: img.url,
          display_order: img.displayOrder,
        }));

        const { error: imageError } = await supabase
          .from('product_images')
          .insert(imageInserts);

        if (imageError) {
          console.error('Error saving images:', imageError);
          alert('Product saved but there was an error saving images.');
        }
      }

      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error saving product. Please try again.');
    }
  };

  const resetForm = () => {
    setProductForm({
      sku: '',
      title: '',
      short_description: '',
      full_description: '',
      maker: '',
      designer: '',
      material: '',
      dimensions: '',
      crate_size: '',
      price: '',
      sale_price: '',
      is_on_sale: false,
      status: 'inventory',
      featured_image_url: '',
      consignor: '',
      workflow_stage: 'research',
      is_featured: false,
      category_id: '',
      subcategory_id: '',
    });
    setProductImages([]);
    setFeaturedImageUrl(null);
    setEditingProduct(null);
    setShowProductForm(false);
  };

  const handleEdit = async (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      sku: product.sku,
      title: product.title,
      short_description: product.short_description || '',
      full_description: product.full_description || '',
      maker: product.maker || '',
      designer: product.designer || '',
      material: product.material || '',
      dimensions: product.dimensions || '',
      crate_size: product.crate_size || '',
      price: product.price.toString(),
      sale_price: product.sale_price?.toString() || '',
      is_on_sale: product.is_on_sale,
      status: product.status,
      featured_image_url: product.featured_image_url || '',
      consignor: product.consignor || '',
      workflow_stage: product.workflow_stage,
      is_featured: product.is_featured,
      category_id: product.category_id || '',
      subcategory_id: product.subcategory_id || '',
    });

    setFeaturedImageUrl(product.featured_image_url);

    const { data: existingImages } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', product.id)
      .order('display_order');

    if (existingImages) {
      const imageData: ImageData[] = existingImages.map((img) => ({
        id: img.id,
        url: img.image_url,
        displayOrder: img.display_order,
      }));
      setProductImages(imageData);
    }

    setShowProductForm(true);
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase.from('products').delete().eq('id', productId);

      if (error) throw error;
      alert('Product deleted successfully!');
      fetchData();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Error deleting product. Please try again.');
    }
  };

  const handleImagesChange = (images: ImageData[], featured: string | null) => {
    setProductImages(images);
    setFeaturedImageUrl(featured);
  };

  const filteredSubcategories = subcategories.filter(
    (sub) => sub.category_id === productForm.category_id
  );

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="text-2xl tracking-wider">Loading admin panel...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between py-6">
              <h1 className="text-3xl font-normal tracking-[0.08em]">ADMIN DASHBOARD</h1>
              <div className="text-sm text-gray-600">
                Welcome to the admin panel
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-64 flex-shrink-0">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('products')}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition tracking-[0.06em] ${
                    activeTab === 'products'
                      ? 'bg-black text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Package className="w-5 h-5" />
                  PRODUCTS
                </button>

                <button
                  onClick={() => setActiveTab('consignors')}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition tracking-[0.06em] ${
                    activeTab === 'consignors'
                      ? 'bg-black text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Users className="w-5 h-5" />
                  CONSIGNORS
                </button>

                <button
                  onClick={() => setActiveTab('workflow')}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition tracking-[0.06em] ${
                    activeTab === 'workflow'
                      ? 'bg-black text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Workflow className="w-5 h-5" />
                  WORKFLOW
                </button>

                <button
                  onClick={() => setActiveTab('sales-batches')}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition tracking-[0.06em] ${
                    activeTab === 'sales-batches'
                      ? 'bg-black text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Calendar className="w-5 h-5" />
                  SALES BATCHES
                </button>

                <button
                  onClick={() => setActiveTab('batch-reports')}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition tracking-[0.06em] ${
                    activeTab === 'batch-reports'
                      ? 'bg-black text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                  BATCH REPORTS
                </button>

                <button
                  onClick={() => setActiveTab('consignor-reports')}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition tracking-[0.06em] ${
                    activeTab === 'consignor-reports'
                      ? 'bg-black text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <BarChart3 className="w-5 h-5" />
                  CONSIGNOR REPORTS
                </button>

                <button
                  onClick={() => setActiveTab('categories')}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition tracking-[0.06em] ${
                    activeTab === 'categories'
                      ? 'bg-black text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Settings className="w-5 h-5" />
                  CATEGORIES
                </button>
              </nav>
            </div>

            <div className="flex-1 bg-white p-8 shadow-sm">
              {activeTab === 'products' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-normal tracking-[0.08em]">PRODUCT MANAGEMENT</h2>
                    <button
                      onClick={() => {
                        resetForm();
                        setShowProductForm(true);
                      }}
                      className="flex items-center gap-2 px-6 py-3 bg-black text-white hover:bg-gray-800 transition tracking-[0.06em]"
                    >
                      <Plus className="w-5 h-5" />
                      ADD PRODUCT
                    </button>
                  </div>

                  {showProductForm && (
                    <div className="mb-8 p-6 bg-gray-50 border-2 border-gray-300">
                      <h3 className="text-xl font-normal tracking-[0.08em] mb-6">
                        {editingProduct ? 'EDIT PRODUCT' : 'NEW PRODUCT'}
                      </h3>
                      <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2 tracking-[0.06em]">
                              CATEGORY *
                            </label>
                            <select
                              required
                              value={productForm.category_id}
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
                              SUBCATEGORY
                            </label>
                            <select
                              value={productForm.subcategory_id}
                              onChange={(e) =>
                                setProductForm({ ...productForm, subcategory_id: e.target.value })
                              }
                              className="font-calibri w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
                              disabled={!productForm.category_id}
                            >
                              <option value="">Select Subcategory</option>
                              {filteredSubcategories.map((subcategory) => (
                                <option key={subcategory.id} value={subcategory.id}>
                                  {subcategory.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2 tracking-[0.06em]">
                              SKU *
                            </label>
                            <input
                              type="text"
                              required
                              value={productForm.sku}
                              onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                              className="font-calibri w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
                              readOnly={!editingProduct}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2 tracking-[0.06em]">
                              TITLE *
                            </label>
                            <input
                              type="text"
                              required
                              value={productForm.title}
                              onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                              className="font-calibri w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2 tracking-[0.06em]">
                            SHORT DESCRIPTION
                          </label>
                          <textarea
                            value={productForm.short_description}
                            onChange={(e) =>
                              setProductForm({ ...productForm, short_description: e.target.value })
                            }
                            rows={3}
                            className="font-calibri w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2 tracking-[0.06em]">
                            FULL DESCRIPTION
                          </label>
                          <textarea
                            value={productForm.full_description}
                            onChange={(e) =>
                              setProductForm({ ...productForm, full_description: e.target.value })
                            }
                            rows={6}
                            className="font-calibri w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2 tracking-[0.06em]">
                              MAKER
                            </label>
                            <input
                              type="text"
                              value={productForm.maker}
                              onChange={(e) => setProductForm({ ...productForm, maker: e.target.value })}
                              className="font-calibri w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2 tracking-[0.06em]">
                              DESIGNER
                            </label>
                            <input
                              type="text"
                              value={productForm.designer}
                              onChange={(e) =>
                                setProductForm({ ...productForm, designer: e.target.value })
                              }
                              className="font-calibri w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2 tracking-[0.06em]">
                              MATERIAL
                            </label>
                            <input
                              type="text"
                              value={productForm.material}
                              onChange={(e) =>
                                setProductForm({ ...productForm, material: e.target.value })
                              }
                              className="font-calibri w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2 tracking-[0.06em]">
                              DIMENSIONS
                            </label>
                            <input
                              type="text"
                              value={productForm.dimensions}
                              onChange={(e) =>
                                setProductForm({ ...productForm, dimensions: e.target.value })
                              }
                              className="font-calibri w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2 tracking-[0.06em]">
                            CRATE / BOX SIZE
                          </label>
                          <textarea
                            value={productForm.crate_size}
                            onChange={(e) =>
                              setProductForm({ ...productForm, crate_size: e.target.value })
                            }
                            rows={3}
                            className="font-calibri w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
                            placeholder="Dimensions for shipping crate or box"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2 tracking-[0.06em]">
                              PRICE *
                            </label>
                            <input
                              type="number"
                              required
                              min="0"
                              step="0.01"
                              value={productForm.price}
                              onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                              className="font-calibri w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2 tracking-[0.06em]">
                              SALE PRICE
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={productForm.sale_price}
                              onChange={(e) =>
                                setProductForm({ ...productForm, sale_price: e.target.value })
                              }
                              className="font-calibri w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
                            />
                          </div>

                          <div className="flex items-end">
                            <label className="flex items-center gap-2 cursor-pointer px-4 py-3">
                              <input
                                type="checkbox"
                                checked={productForm.is_on_sale}
                                onChange={(e) =>
                                  setProductForm({ ...productForm, is_on_sale: e.target.checked })
                                }
                                className="w-5 h-5"
                              />
                              <span className="text-sm font-medium tracking-[0.06em]">ON SALE</span>
                            </label>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2 tracking-[0.06em]">
                              STATUS
                            </label>
                            <select
                              value={productForm.status}
                              onChange={(e) =>
                                setProductForm({
                                  ...productForm,
                                  status: e.target.value as 'available' | 'on_hold' | 'sold' | 'inventory',
                                })
                              }
                              className="font-calibri w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
                            >
                              <option value="inventory">Inventory</option>
                              <option value="available">Available</option>
                              <option value="on_hold">On Hold</option>
                              <option value="sold">Sold</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2 tracking-[0.06em]">
                              WORKFLOW STAGE
                            </label>
                            <select
                              value={productForm.workflow_stage}
                              onChange={(e) =>
                                setProductForm({
                                  ...productForm,
                                  workflow_stage: e.target.value as
                                    | 'research'
                                    | 'descriptions'
                                    | 'photos'
                                    | 'ready'
                                    | 'listed',
                                })
                              }
                              className="font-calibri w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
                            >
                              <option value="research">Research</option>
                              <option value="descriptions">Descriptions</option>
                              <option value="photos">Photos</option>
                              <option value="ready">Ready</option>
                              <option value="listed">Listed</option>
                            </select>
                          </div>

                          <div className="flex items-end">
                            <label className="flex items-center gap-2 cursor-pointer px-4 py-3">
                              <input
                                type="checkbox"
                                checked={productForm.is_featured}
                                onChange={(e) =>
                                  setProductForm({ ...productForm, is_featured: e.target.checked })
                                }
                                className="w-5 h-5"
                              />
                              <span className="text-sm font-medium tracking-[0.06em]">FEATURED</span>
                            </label>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2 tracking-[0.06em]">
                            CONSIGNOR
                          </label>
                          <input
                            type="text"
                            value={productForm.consignor}
                            onChange={(e) =>
                              setProductForm({ ...productForm, consignor: e.target.value })
                            }
                            className="font-calibri w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-4 tracking-[0.06em]">
                            PRODUCT IMAGES
                          </label>
                          <ImageUploadManager
                            productSku={productForm.sku}
                            productId={editingProduct?.id}
                            featuredImageUrl={featuredImageUrl}
                            onImagesChange={handleImagesChange}
                          />
                        </div>

                        <div className="flex gap-4">
                          <button
                            type="submit"
                            className="px-6 py-3 bg-black text-white tracking-[0.06em] hover:bg-gray-800 transition"
                          >
                            {editingProduct ? 'UPDATE PRODUCT' : 'CREATE PRODUCT'}
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
                          <th className="font-calibri px-4 py-3 text-left text-sm font-medium tracking-[0.04em]">
                            SKU
                          </th>
                          <th className="font-calibri px-4 py-3 text-left text-sm font-medium tracking-[0.04em]">
                            TITLE
                          </th>
                          <th className="font-calibri px-4 py-3 text-left text-sm font-medium tracking-[0.04em]">
                            CATEGORY
                          </th>
                          <th className="font-calibri px-4 py-3 text-left text-sm font-medium tracking-[0.04em]">
                            PRICE
                          </th>
                          <th className="font-calibri px-4 py-3 text-left text-sm font-medium tracking-[0.04em]">
                            STATUS
                          </th>
                          <th className="font-calibri px-4 py-3 text-left text-sm font-medium tracking-[0.04em]">
                            WORKFLOW
                          </th>
                          <th className="font-calibri px-4 py-3 text-left text-sm font-medium tracking-[0.04em]">
                            ACTIONS
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((product) => (
                          <tr key={product.id} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="font-calibri px-4 py-3 text-sm font-medium">{product.sku}</td>
                            <td className="font-calibri px-4 py-3 text-sm">{product.title}</td>
                            <td className="font-calibri px-4 py-3 text-sm">
                              {product.category?.name || '-'}
                            </td>
                            <td className="font-calibri px-4 py-3 text-sm">
                              ${product.price.toLocaleString()}
                              {product.is_on_sale && product.sale_price && (
                                <span className="ml-2 text-red-600">
                                  (${product.sale_price.toLocaleString()})
                                </span>
                              )}
                            </td>
                            <td className="font-calibri px-4 py-3 text-sm">
                              <span
                                className={`px-2 py-1 text-xs font-medium tracking-[0.06em] ${
                                  product.status === 'available'
                                    ? 'bg-green-100 text-green-800'
                                    : product.status === 'on_hold'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : product.status === 'sold'
                                    ? 'bg-gray-100 text-gray-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {product.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="font-calibri px-4 py-3 text-sm">
                              <span
                                className={`px-2 py-1 text-xs font-medium tracking-[0.06em] ${
                                  product.workflow_stage === 'research'
                                    ? 'bg-blue-100 text-blue-800'
                                    : product.workflow_stage === 'descriptions'
                                    ? 'bg-purple-100 text-purple-800'
                                    : product.workflow_stage === 'photos'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : product.workflow_stage === 'ready'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {product.workflow_stage.toUpperCase()}
                              </span>
                            </td>
                            <td className="font-calibri px-4 py-3 text-sm">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => window.open(`/product/${product.id}`, '_blank')}
                                  className="p-2 hover:bg-gray-200 rounded transition"
                                  title="View"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleEdit(product)}
                                  className="p-2 hover:bg-gray-200 rounded transition"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(product.id)}
                                  className="p-2 hover:bg-gray-200 rounded transition"
                                  title="Delete"
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

                  {products.length === 0 && (
                    <div className="text-center py-12 text-gray-600">
                      No products yet. Click "Add Product" to get started.
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'consignors' && <ConsignorManagement />}
              {activeTab === 'workflow' && <WorkflowTaskManagement />}
              {activeTab === 'sales-batches' && <SalesBatchManagement />}
              {activeTab === 'batch-reports' && <SalesBatchReports />}
              {activeTab === 'consignor-reports' && <ConsignorReports />}

              {activeTab === 'categories' && (
                <div>
                  <h2 className="text-2xl font-normal tracking-[0.08em] mb-6">CATEGORY MANAGEMENT</h2>
                  <p className="text-gray-600">Category management functionality coming soon...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}