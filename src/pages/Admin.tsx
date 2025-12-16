import { useState, useEffect } from 'react';
import {
  Package,
  DollarSign,
  ClipboardList,
  TrendingUp,
  Plus,
  Edit,
  Eye,
  CheckCircle,
  XCircle,
  Mail,
  Clock,
  Users,
  ListTodo,
} from 'lucide-react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import type { Product, ProductOffer, ProductSale, ProductHold, Category, Subcategory, Consignor, ProductImage } from '../lib/types';
import ConsignorManagement from '../components/ConsignorManagement';
import WorkflowTaskManagement from '../components/WorkflowTaskManagement';
import ConsignorReports from '../components/ConsignorReports';
import { ImageUploadManager, type ImageData } from '../components/ImageUploadManager';

export default function Admin() {
  const [activeTab, setActiveTab] = useState<'products' | 'offers' | 'sales' | 'holds' | 'consignors' | 'tasks' | 'reports'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [offers, setOffers] = useState<ProductOffer[]>([]);
  const [sales, setSales] = useState<ProductSale[]>([]);
  const [holds, setHolds] = useState<ProductHold[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [consignors, setConsignors] = useState<Consignor[]>([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productImages, setProductImages] = useState<ImageData[]>([]);
  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);

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
    featured_image_url: '',
    consignor: '',
    consignor_id: '',
    workflow_stage: 'research' as const,
    is_featured: false,
    category_id: '',
    subcategory_id: '',
  });

  useEffect(() => {
    fetchAdminData();
    fetchCategories();
    fetchConsignors();
  }, []);

  useEffect(() => {
    if (productForm.category_id) {
      const filtered = subcategories.filter((s) => s.category_id === productForm.category_id);
      setFilteredSubcategories(filtered);
    } else {
      setFilteredSubcategories([]);
    }
  }, [productForm.category_id, subcategories]);

  const fetchAdminData = async () => {
    try {
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: offersData } = await supabase
        .from('product_offers')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: salesData } = await supabase
        .from('product_sales')
        .select('*')
        .order('sale_date', { ascending: false });

      const { data: holdsData } = await supabase
        .from('product_holds')
        .select('*')
        .eq('is_active', true)
        .order('hold_date', { ascending: false });

      setProducts(productsData || []);
      setOffers(offersData || []);
      setSales(salesData || []);
      setHolds(holdsData || []);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });

      const { data: subcategoriesData } = await supabase
        .from('subcategories')
        .select('*')
        .order('display_order', { ascending: true });

      setCategories(categoriesData || []);
      setSubcategories(subcategoriesData || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchConsignors = async () => {
    try {
      const { data: consignorsData } = await supabase
        .from('consignors')
        .select('*')
        .eq('is_active', true)
        .order('last_name', { ascending: true });

      setConsignors(consignorsData || []);
    } catch (error) {
      console.error('Error fetching consignors:', error);
    }
  };

  const generateSKU = async (consignorId: string, categoryId: string): Promise<string> => {
    try {
      const consignor = consignors.find((c) => c.id === consignorId);
      if (!consignor) return '';

      const { data, error } = await supabase.rpc('generate_sku', {
        consignor_code_input: consignor.consignor_code,
        category_id_input: categoryId,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error generating SKU:', error);
      return '';
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
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
        featured_image_url: productForm.featured_image_url || null,
        consignor: productForm.consignor || null,
        consignor_id: productForm.consignor_id || null,
        workflow_stage: productForm.workflow_stage,
        is_featured: productForm.is_featured,
        category_id: productForm.category_id || null,
        subcategory_id: productForm.subcategory_id || null,
        status: 'available' as const,
      };

      let productId: string;

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        productId = editingProduct.id;

        // Delete existing product images that are not in the new list
        const existingImageIds = existingImages.map(img => img.id);
        const newImageIds = productImages.filter(img => img.id).map(img => img.id);
        const imagesToDelete = existingImageIds.filter(id => !newImageIds.includes(id));

        if (imagesToDelete.length > 0) {
          await supabase.from('product_images').delete().in('id', imagesToDelete);
        }

        alert('Product updated successfully!');
      } else {
        const { data, error } = await supabase.from('products').insert(productData).select().single();

        if (error) throw error;
        if (!data) throw new Error('Failed to create product');

        productId = data.id;
        alert('Product created successfully!');
      }

      // Save new product images
      const newImages = productImages.filter(img => img.isNew);
      if (newImages.length > 0) {
        const imageInserts = newImages.map(img => ({
          product_id: productId,
          image_url: img.url,
          display_order: img.displayOrder,
        }));

        const { error: imagesError } = await supabase.from('product_images').insert(imageInserts);
        if (imagesError) throw imagesError;
      }

      // Update display order for existing images
      const existingToUpdate = productImages.filter(img => img.id && !img.isNew);
      for (const img of existingToUpdate) {
        await supabase
          .from('product_images')
          .update({ display_order: img.displayOrder })
          .eq('id', img.id);
      }

      resetForm();
      fetchAdminData();
    } catch (error: any) {
      console.error('Error saving product:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      alert(`Error saving product: ${errorMessage}`);
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
      featured_image_url: '',
      consignor: '',
      consignor_id: '',
      workflow_stage: 'research',
      is_featured: false,
      category_id: '',
      subcategory_id: '',
    });
    setEditingProduct(null);
    setShowAddProduct(false);
    setProductImages([]);
    setExistingImages([]);
  };

  const handleEditProduct = async (product: Product) => {
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
      featured_image_url: product.featured_image_url || '',
      consignor: product.consignor || '',
      consignor_id: product.consignor_id || '',
      workflow_stage: product.workflow_stage,
      is_featured: product.is_featured,
      category_id: product.category_id || '',
      subcategory_id: product.subcategory_id || '',
    });

    // Load existing images
    try {
      const { data: images } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', product.id)
        .order('display_order', { ascending: true });

      if (images) {
        setExistingImages(images);
      }
    } catch (error) {
      console.error('Error loading product images:', error);
    }

    setShowAddProduct(true);
  };

  const handleUpdateOfferStatus = async (offerId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('product_offers')
        .update({ status })
        .eq('id', offerId);

      if (error) throw error;
      alert(`Offer ${status} successfully!`);
      fetchAdminData();
    } catch (error) {
      console.error('Error updating offer:', error);
      alert('Error updating offer. Please try again.');
    }
  };

  const handleExtendHold = async (holdId: string) => {
    try {
      const hold = holds.find((h) => h.id === holdId);
      if (!hold) return;

      const currentHoldUntil = new Date(hold.hold_until);
      const newHoldUntil = new Date(currentHoldUntil);
      newHoldUntil.setDate(newHoldUntil.getDate() + 30);

      const { error } = await supabase
        .from('product_holds')
        .update({ hold_until: newHoldUntil.toISOString() })
        .eq('id', holdId);

      if (error) throw error;
      alert('Hold extended for 30 days successfully!');
      fetchAdminData();
    } catch (error) {
      console.error('Error extending hold:', error);
      alert('Error extending hold. Please try again.');
    }
  };

  const calculateDaysUntilExpiration = (holdUntil: string) => {
    const expiration = new Date(holdUntil);
    const today = new Date();
    const diffTime = expiration.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const stats = {
    totalProducts: products.length,
    availableProducts: products.filter((p) => p.status === 'available').length,
    soldProducts: products.filter((p) => p.status === 'sold').length,
    pendingOffers: offers.filter((o) => o.status === 'pending').length,
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="text-2xl tracking-wider">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-normal tracking-[0.08em] mb-8">ADMIN DASHBOARD</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white p-6 border-2 border-gray-300">
            <div className="flex items-center justify-between mb-2">
              <Package className="w-8 h-8 text-gray-600" />
              <span className="text-3xl font-medium">{stats.totalProducts}</span>
            </div>
            <p className="text-sm tracking-[0.06em] text-gray-600">TOTAL PRODUCTS</p>
          </div>

          <div className="bg-white p-6 border-2 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <span className="text-3xl font-medium">{stats.availableProducts}</span>
            </div>
            <p className="text-sm tracking-[0.06em] text-gray-600">AVAILABLE</p>
          </div>

          <div className="bg-white p-6 border-2 border-gray-500">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-gray-600" />
              <span className="text-3xl font-medium">{stats.soldProducts}</span>
            </div>
            <p className="text-sm tracking-[0.06em] text-gray-600">SOLD</p>
          </div>

          <div className="bg-white p-6 border-2 border-yellow-500">
            <div className="flex items-center justify-between mb-2">
              <ClipboardList className="w-8 h-8 text-yellow-600" />
              <span className="text-3xl font-medium">{stats.pendingOffers}</span>
            </div>
            <p className="text-sm tracking-[0.06em] text-gray-600">PENDING OFFERS</p>
          </div>
        </div>

        <div className="flex gap-4 mb-8 border-b-2 border-gray-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-6 py-3 tracking-[0.06em] whitespace-nowrap ${
              activeTab === 'products'
                ? 'border-b-4 border-black text-black'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            INVENTORY
          </button>
          <button
            onClick={() => setActiveTab('consignors')}
            className={`px-6 py-3 tracking-[0.06em] whitespace-nowrap ${
              activeTab === 'consignors'
                ? 'border-b-4 border-black text-black'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            CONSIGNORS
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-6 py-3 tracking-[0.06em] whitespace-nowrap ${
              activeTab === 'tasks'
                ? 'border-b-4 border-black text-black'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            TASKS
          </button>
          <button
            onClick={() => setActiveTab('offers')}
            className={`px-6 py-3 tracking-[0.06em] whitespace-nowrap ${
              activeTab === 'offers'
                ? 'border-b-4 border-black text-black'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            OFFERS
          </button>
          <button
            onClick={() => setActiveTab('sales')}
            className={`px-6 py-3 tracking-[0.06em] whitespace-nowrap ${
              activeTab === 'sales'
                ? 'border-b-4 border-black text-black'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            SALES
          </button>
          <button
            onClick={() => setActiveTab('holds')}
            className={`px-6 py-3 tracking-[0.06em] whitespace-nowrap ${
              activeTab === 'holds'
                ? 'border-b-4 border-black text-black'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            ON HOLD
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-6 py-3 tracking-[0.06em] whitespace-nowrap ${
              activeTab === 'reports'
                ? 'border-b-4 border-black text-black'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            REPORTS
          </button>
        </div>

        {activeTab === 'products' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-normal tracking-[0.08em]">INVENTORY MANAGEMENT</h2>
              <button
                onClick={() => {
                  resetForm();
                  setShowAddProduct(true);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-black text-white hover:bg-gray-800 transition tracking-[0.06em]"
              >
                <Plus className="w-5 h-5" />
                ADD PRODUCT
              </button>
            </div>

            {showAddProduct && (
              <div className="mb-8 p-6 bg-gray-50 border-2 border-gray-300">
                <h3 className="text-xl font-normal tracking-[0.08em] mb-6">
                  {editingProduct ? 'EDIT PRODUCT' : 'NEW PRODUCT'}
                </h3>
                <form onSubmit={handleSaveProduct} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      required
                      placeholder="SKU *"
                      value={productForm.sku}
                      onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                      className="px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Title *"
                      value={productForm.title}
                      onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                      className="px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
                    />
                  </div>

                  <input
                    type="text"
                    placeholder="Short Description"
                    value={productForm.short_description}
                    onChange={(e) =>
                      setProductForm({ ...productForm, short_description: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
                  />

                  <textarea
                    placeholder="Full Description"
                    value={productForm.full_description}
                    onChange={(e) =>
                      setProductForm({ ...productForm, full_description: e.target.value })
                    }
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      type="text"
                      placeholder="Designer"
                      value={productForm.designer}
                      onChange={(e) =>
                        setProductForm({ ...productForm, designer: e.target.value })
                      }
                      className="px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
                    />
                    <input
                      type="text"
                      placeholder="Maker"
                      value={productForm.maker}
                      onChange={(e) => setProductForm({ ...productForm, maker: e.target.value })}
                      className="px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
                    />
                    <input
                      type="text"
                      placeholder="Material"
                      value={productForm.material}
                      onChange={(e) =>
                        setProductForm({ ...productForm, material: e.target.value })
                      }
                      className="px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Dimensions</label>
                    <textarea
                      placeholder="Enter detailed dimensions (e.g., Height: 42 Inches, Width: 25 Inches, etc.)"
                      value={productForm.dimensions}
                      onChange={(e) =>
                        setProductForm({ ...productForm, dimensions: e.target.value })
                      }
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Crate / Box Size</label>
                    <textarea
                      placeholder="Crated Size:&#10;- Length: &#10;- Width: &#10;- Height: &#10;- Weight: "
                      value={productForm.crate_size}
                      onChange={(e) =>
                        setProductForm({ ...productForm, crate_size: e.target.value })
                      }
                      rows={5}
                      className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="number"
                      required
                      step="0.01"
                      placeholder="Price *"
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                      className="px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Sale Price"
                      value={productForm.sale_price}
                      onChange={(e) =>
                        setProductForm({ ...productForm, sale_price: e.target.value })
                      }
                      className="px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2 tracking-[0.06em]">
                      PRODUCT IMAGES
                    </label>
                    <ImageUploadManager
                      key={editingProduct?.id || 'new-product'}
                      productSku={productForm.sku || 'temp-sku'}
                      productId={editingProduct?.id}
                      featuredImageUrl={productForm.featured_image_url}
                      existingImages={existingImages}
                      onImagesChange={(images, featuredUrl) => {
                        setProductImages(images);
                        setProductForm({ ...productForm, featured_image_url: featuredUrl || '' });
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select
                      value={productForm.consignor_id}
                      onChange={(e) =>
                        setProductForm({ ...productForm, consignor_id: e.target.value })
                      }
                      className="px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
                    >
                      <option value="">Select Consignor</option>
                      {consignors.map((consignor) => (
                        <option key={consignor.id} value={consignor.id}>
                          {consignor.consignor_code} - {consignor.first_name} {consignor.last_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {productForm.consignor_id && productForm.category_id && !editingProduct && (
                    <div className="p-4 bg-blue-50 border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium mb-1">Auto-Generate SKU</p>
                          <p className="text-xs text-gray-600">
                            Click to generate a unique SKU for this product
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            const sku = await generateSKU(
                              productForm.consignor_id,
                              productForm.category_id
                            );
                            if (sku) {
                              setProductForm({ ...productForm, sku });
                            }
                          }}
                          className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition tracking-[0.06em]"
                        >
                          GENERATE SKU
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <select
                      value={productForm.workflow_stage}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          workflow_stage: e.target.value as any,
                        })
                      }
                      className="px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
                    >
                      <option value="research">Research</option>
                      <option value="descriptions">Descriptions</option>
                      <option value="photos">Photos</option>
                      <option value="ready">Ready</option>
                      <option value="listed">Listed</option>
                    </select>

                    <select
                      value={productForm.category_id}
                      onChange={(e) => {
                        setProductForm({
                          ...productForm,
                          category_id: e.target.value,
                          subcategory_id: '',
                        });
                      }}
                      className="px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
                    >
                      <option value="">Select Category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>

                    <select
                      value={productForm.subcategory_id}
                      onChange={(e) =>
                        setProductForm({ ...productForm, subcategory_id: e.target.value })
                      }
                      disabled={!productForm.category_id}
                      className="px-4 py-3 border border-gray-300 focus:outline-none focus:border-black disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">Select Subcategory</option>
                      {filteredSubcategories.map((subcategory) => (
                        <option key={subcategory.id} value={subcategory.id}>
                          {subcategory.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <div className="flex items-center gap-6 px-4">
                      <label className="flex items-center gap-2 cursor-pointer">
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

                      <label className="flex items-center gap-2 cursor-pointer">
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
                    <th className="px-4 py-3 text-left text-sm font-medium tracking-[0.04em]">SKU</th>
                    <th className="px-4 py-3 text-left text-sm font-medium tracking-[0.04em]">TITLE</th>
                    <th className="px-4 py-3 text-left text-sm font-medium tracking-[0.04em]">PRICE</th>
                    <th className="px-4 py-3 text-left text-sm font-medium tracking-[0.04em]">STATUS</th>
                    <th className="px-4 py-3 text-left text-sm font-medium tracking-[0.04em]">
                      WORKFLOW
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium tracking-[0.04em]">
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{product.sku}</td>
                      <td className="px-4 py-3 text-sm">{product.title}</td>
                      <td className="px-4 py-3 text-sm">${product.price.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 text-xs font-medium tracking-[0.06em] ${
                            product.status === 'available'
                              ? 'bg-green-100 text-green-800'
                              : product.status === 'on_hold'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {product.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{product.workflow_stage}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="p-2 hover:bg-gray-200 rounded transition"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <a
                            href={`/product/${product.id}`}
                            className="p-2 hover:bg-gray-200 rounded transition"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'offers' && (
          <div>
            <h2 className="text-2xl font-normal tracking-[0.08em] mb-6">PENDING OFFERS</h2>

            {offers.length === 0 ? (
              <div className="text-center py-12 text-gray-600 font-light lowercase">no offers yet.</div>
            ) : (
              <div className="space-y-4">
                {offers.map((offer) => {
                  const product = products.find((p) => p.id === offer.product_id);
                  return (
                    <div key={offer.id} className="p-6 bg-white border-2 border-gray-300">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-bold text-lg mb-1">
                            {product?.title || 'Unknown Product'}
                          </h3>
                          <p className="text-sm text-gray-600">SKU: {product?.sku}</p>
                        </div>
                        <span
                          className={`px-3 py-1 text-xs font-bold ${
                            offer.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : offer.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {offer.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm">
                            <span className="font-medium">Customer:</span> {offer.customer_name}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Email:</span> {offer.customer_email}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Phone:</span> {offer.customer_phone}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm">
                            <span className="font-medium">Offer Amount:</span> ${offer.offer_amount.toLocaleString()}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Original Price:</span> ${product?.price.toLocaleString()}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Submitted:</span> {new Date(offer.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {offer.message && (
                        <div className="mb-4">
                          <p className="text-sm font-medium mb-1">Message:</p>
                          <p className="text-sm text-gray-700">{offer.message}</p>
                        </div>
                      )}

                      {offer.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateOfferStatus(offer.id, 'approved')}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 transition"
                          >
                            <CheckCircle className="w-4 h-4" />
                            APPROVE
                          </button>
                          <button
                            onClick={() => handleUpdateOfferStatus(offer.id, 'rejected')}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white hover:bg-red-700 transition"
                          >
                            <XCircle className="w-4 h-4" />
                            REJECT
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'sales' && (
          <div>
            <h2 className="text-2xl font-normal tracking-[0.08em] mb-6">SALES TRACKING</h2>

            {sales.length === 0 ? (
              <div className="text-center py-12 text-gray-600 font-light lowercase">no sales recorded yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-3 text-left text-sm font-bold tracking-wider">
                        PRODUCT
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-bold tracking-wider">
                        SALE PRICE
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-bold tracking-wider">
                        PLATFORM
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-bold tracking-wider">
                        SALE DATE
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-bold tracking-wider">
                        CONSIGNOR PAID
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map((sale) => {
                      const product = products.find((p) => p.id === sale.product_id);
                      return (
                        <tr key={sale.id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">
                            <div>
                              <p className="font-bold">{product?.title || 'Unknown'}</p>
                              <p className="text-xs text-gray-600 font-light">{product?.sku}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm font-bold">
                            ${sale.sale_price.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm font-light">{sale.sold_on_platform}</td>
                          <td className="px-4 py-3 text-sm font-light">
                            {new Date(sale.sale_date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {sale.consignor_paid ? (
                              <span className="text-green-600 font-bold">YES</span>
                            ) : (
                              <span className="text-red-600 font-bold">NO</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'consignors' && <ConsignorManagement />}

        {activeTab === 'tasks' && <WorkflowTaskManagement />}

        {activeTab === 'reports' && <ConsignorReports />}

        {activeTab === 'holds' && (
          <div>
            <h2 className="text-2xl font-normal tracking-[0.08em] mb-6">ITEMS ON HOLD</h2>

            {holds.length === 0 ? (
              <div className="text-center py-12 text-gray-600 font-light lowercase">no items on hold.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-3 text-left text-sm font-bold tracking-wider">
                        SKU
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-bold tracking-wider">
                        TITLE
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-bold tracking-wider">
                        CUSTOMER
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-bold tracking-wider">
                        HOLD DATE
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-bold tracking-wider">
                        DAYS LEFT
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-bold tracking-wider">
                        ACTIONS
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {holds.map((hold) => {
                      const product = products.find((p) => p.id === hold.product_id);
                      const daysLeft = calculateDaysUntilExpiration(hold.hold_until);
                      return (
                        <tr key={hold.id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-light">{product?.sku}</td>
                          <td className="px-4 py-3 text-sm">
                            <p className="font-bold">{product?.title || 'Unknown'}</p>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div>
                              <p className="font-bold">{hold.customer_name}</p>
                              <p className="text-xs text-gray-600 font-light">{hold.customer_email}</p>
                              <p className="text-xs text-gray-600 font-light">{hold.customer_phone}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm font-light">
                            {new Date(hold.hold_date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={`px-2 py-1 text-xs font-bold ${
                                daysLeft <= 7
                                  ? 'bg-red-100 text-red-800'
                                  : daysLeft <= 14
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                              }`}
                            >
                              {daysLeft} DAYS
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleExtendHold(hold.id)}
                                className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 transition text-xs font-bold tracking-wider"
                                title="Extend hold for 30 days"
                              >
                                <Clock className="w-4 h-4" />
                                EXTEND
                              </button>
                              <a
                                href={`mailto:${hold.customer_email}?subject=Regarding Your Hold on ${product?.title || 'Item'} (${product?.sku})&body=Hi ${hold.customer_name},%0D%0A%0D%0AThis is regarding your hold on ${product?.title || 'the item'} (SKU: ${product?.sku}).%0D%0A%0D%0ABest regards,%0D%0AWarehouse 414`}
                                className="p-2 hover:bg-gray-200 rounded transition"
                                title="Email customer"
                              >
                                <Mail className="w-4 h-4" />
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
