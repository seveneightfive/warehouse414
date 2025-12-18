import { useState, useEffect } from 'react';
import { ShoppingCart, DollarSign, Clock, FileText, X, ChevronRight } from 'lucide-react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import type { Product, ProductImage, ProductHold } from '../lib/types';
import { generateProductPDF, downloadPDF } from '../utils/pdfGenerator';

interface ProductDetailProps {
  productId: string;
}

export default function ProductDetail({ productId }: ProductDetailProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [activeHold, setActiveHold] = useState<ProductHold | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showPDFModal, setShowPDFModal] = useState(false);

  const [purchaseForm, setPurchaseForm] = useState({
    name: '',
    email: '',
    phone: '',
    needsShipping: false,
    shippingAddress: '',
  });

  const [holdForm, setHoldForm] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const [offerForm, setOfferForm] = useState({
    name: '',
    email: '',
    phone: '',
    amount: '',
    message: '',
  });

  const [pdfForm, setPdfForm] = useState({
    email: '',
    includePrice: true,
  });

  useEffect(() => {
    fetchProductData();
  }, [productId]);

  const fetchProductData = async () => {
    try {
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(name, slug),
          subcategory:subcategories(name, slug)
        `)
        .eq('id', productId)
        .maybeSingle();

      if (productError) throw productError;
      setProduct(productData);
      if (productData.featured_image_url) {
        setSelectedImage(productData.featured_image_url);
      }

      const { data: imagesData } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .order('display_order');

      setImages(imagesData || []);

      if (productData.status === 'on_hold') {
        const { data: holdData } = await supabase
          .from('product_holds')
          .select('*')
          .eq('product_id', productId)
          .eq('is_active', true)
          .single();

        setActiveHold(holdData);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseInquiry = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!product) return;

    try {
      const displayPrice = product.is_on_sale && product.sale_price ? product.sale_price : product.price;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-purchase-inquiry`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productTitle: product.title,
            productSku: product.sku,
            productPrice: displayPrice,
            customerName: purchaseForm.name,
            customerEmail: purchaseForm.email,
            customerPhone: purchaseForm.phone,
            needsShipping: purchaseForm.needsShipping,
            shippingAddress: purchaseForm.shippingAddress,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to send purchase inquiry');
      }

      const holdUntil = new Date();
      holdUntil.setDate(holdUntil.getDate() + 45);

      const { error: holdError } = await supabase.from('product_holds').insert({
        product_id: productId,
        customer_name: purchaseForm.name,
        customer_email: purchaseForm.email,
        customer_phone: purchaseForm.phone,
        hold_date: new Date().toISOString(),
        hold_until: holdUntil.toISOString(),
        is_active: true,
      });

      if (holdError) throw holdError;

      const { error: updateError } = await supabase
        .from('products')
        .update({ status: 'on_hold' })
        .eq('id', productId);

      if (updateError) throw updateError;

      alert('Thank you! You will receive a personalized invoice in your email to safely facilitate payment. For questions, call 785-232-8008');
      setShowPurchaseModal(false);
      setPurchaseForm({ name: '', email: '', phone: '', needsShipping: false, shippingAddress: '' });
      fetchProductData();
    } catch (error) {
      console.error('Error submitting purchase inquiry:', error);
      alert('Error submitting your inquiry. Please try again or call us at 785-232-8008');
    }
  };

  const handlePlaceHold = async (e: React.FormEvent) => {
    e.preventDefault();

    const holdUntil = new Date();
    holdUntil.setDate(holdUntil.getDate() + 45);

    try {
      const { error: holdError } = await supabase.from('product_holds').insert({
        product_id: productId,
        customer_name: holdForm.name,
        customer_email: holdForm.email,
        customer_phone: holdForm.phone,
        hold_date: new Date().toISOString(),
        hold_until: holdUntil.toISOString(),
        is_active: true,
      });

      if (holdError) throw holdError;

      const { error: updateError } = await supabase
        .from('products')
        .update({ status: 'on_hold' })
        .eq('id', productId);

      if (updateError) throw updateError;

      alert('Hold placed successfully! You have 45 days to complete your purchase.');
      setShowHoldModal(false);
      setHoldForm({ name: '', email: '', phone: '' });
      fetchProductData();
    } catch (error) {
      console.error('Error placing hold:', error);
      alert('Error placing hold. Please try again.');
    }
  };

  const handleMakeOffer = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase.from('product_offers').insert({
        product_id: productId,
        customer_name: offerForm.name,
        customer_email: offerForm.email,
        customer_phone: offerForm.phone,
        offer_amount: parseFloat(offerForm.amount),
        message: offerForm.message,
        status: 'pending',
      });

      if (error) throw error;

      alert(
        'Offer submitted successfully! Our team will review and contact you at ' +
          offerForm.email
      );
      setShowOfferModal(false);
      setOfferForm({ name: '', email: '', phone: '', amount: '', message: '' });
    } catch (error) {
      console.error('Error submitting offer:', error);
      alert('Error submitting offer. Please try again.');
    }
  };

  const handleDownloadPDF = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!product) return;

    try {
      const { error } = await supabase.from('pdf_downloads').insert({
        product_id: productId,
        customer_email: pdfForm.email,
        include_price: pdfForm.includePrice,
      });

      if (error) throw error;

      const html = generateProductPDF(product, {
        includePrice: pdfForm.includePrice,
      });

      const filename = `${product.sku}-${product.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`;
      downloadPDF(html, filename);

      alert('PDF downloaded successfully! Thank you for your interest.');
      setShowPDFModal(false);
      setPdfForm({ email: '', includePrice: true });
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error processing request. Please try again.');
    }
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

  if (!product) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <a href="/shop" className="text-blue-600 hover:underline">
            Return to Shop
          </a>
        </div>
      </Layout>
    );
  }

  const displayPrice =
    product.is_on_sale && product.sale_price ? product.sale_price : product.price;

  const allImages = (() => {
    const imageUrls = new Set<string>();
    const imageList: string[] = [];

    if (product.featured_image_url) {
      imageUrls.add(product.featured_image_url);
      imageList.push(product.featured_image_url);
    }

    images.forEach((img) => {
      if (!imageUrls.has(img.image_url)) {
        imageUrls.add(img.image_url);
        imageList.push(img.image_url);
      }
    });

    return imageList;
  })();

  return (
    <Layout>
      <div className="font-jost">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-8">
            <a href="/" className="hover:text-black transition">Home</a>
            <ChevronRight className="w-4 h-4" />
            <a href="/shop" className="hover:text-black transition">Shop</a>
            <ChevronRight className="w-4 h-4" />
            {product.category && (
              <>
                <a
                  href={`/shop?category=${product.category.slug}`}
                  className="hover:text-black transition"
                >
                  {product.category.name}
                </a>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
            <span className="text-black">{product.title}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7">
              <div className="relative aspect-square bg-gray-100 mb-4">
                {selectedImage ? (
                  <img
                    src={selectedImage}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}

                {product.status === 'on_hold' && (
                  <div className="absolute top-4 right-4 bg-amber-600 text-white px-4 py-2 text-xs font-semibold uppercase">
                    On Hold
                  </div>
                )}

                {product.status === 'sold' && (
                  <div className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 text-xs font-semibold uppercase">
                    Sold
                  </div>
                )}

                {product.is_on_sale && product.status === 'available' && (
                  <div className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 text-xs font-semibold uppercase">
                    Sale
                  </div>
                )}

                {product.category && (
                  <a
                    href={`/shop?category=${product.category.slug}`}
                    className="absolute left-0 top-1/2 -translate-y-1/2 bg-black text-white px-3 py-16 hover:bg-gray-800 transition"
                    style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                  >
                    <span className="text-sm font-semibold tracking-widest uppercase">
                      {product.category.name}
                    </span>
                  </a>
                )}
              </div>

              {allImages.length > 1 && (
                <div className="grid grid-cols-5 gap-2">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(img)}
                      className={`aspect-square border-2 ${
                        selectedImage === img ? 'border-black' : 'border-gray-300'
                      } hover:border-black transition`}
                    >
                      <img
                        src={img}
                        alt={`View ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="lg:col-span-5">
              <div className="bg-black text-white px-6 py-3 mb-6">
                <h1 className="text-2xl font-normal">{product.title}</h1>
              </div>

              <div className="mb-6">
                <div className="text-3xl font-light mb-2">${displayPrice.toLocaleString()}</div>
                {product.is_on_sale && product.sale_price && (
                  <div className="text-lg text-gray-500 line-through">
                    ${product.price.toLocaleString()}
                  </div>
                )}
              </div>

              <div className="border border-gray-300 mb-6">
                <table className="w-full text-sm">
                  <tbody>
                    {product.maker && (
                      <tr className="border-b border-gray-300">
                        <td className="px-4 py-3 font-semibold bg-gray-50 w-1/3">Makes</td>
                        <td className="px-4 py-3">{product.maker}</td>
                      </tr>
                    )}
                    {(product.designer || product.style_period) && (
                      <tr className="border-b border-gray-300">
                        <td className="px-4 py-3 font-semibold bg-gray-50">Style / Period</td>
                        <td className="px-4 py-3">{product.designer || product.style_period || '-'}</td>
                      </tr>
                    )}
                    {product.material && (
                      <tr className="border-b border-gray-300">
                        <td className="px-4 py-3 font-semibold bg-gray-50">Materials</td>
                        <td className="px-4 py-3">{product.material}</td>
                      </tr>
                    )}
                    {product.circa && (
                      <tr className="border-b border-gray-300">
                        <td className="px-4 py-3 font-semibold bg-gray-50">Circa</td>
                        <td className="px-4 py-3">{product.circa}</td>
                      </tr>
                    )}
                    {product.dimensions && (
                      <tr className="border-b border-gray-300">
                        <td className="px-4 py-3 font-semibold bg-gray-50">Dimensions</td>
                        <td className="px-4 py-3">{product.dimensions}</td>
                      </tr>
                    )}
                    <tr>
                      <td className="px-4 py-3 font-semibold bg-gray-50">SKU</td>
                      <td className="px-4 py-3">{product.sku}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {product.short_description && (
                <div className="mb-6 text-gray-700 leading-relaxed">
                  {product.short_description}
                </div>
              )}

              {product.full_description && (
                <div className="mb-6 text-gray-700 leading-relaxed">
                  {product.full_description}
                </div>
              )}

              {product.status === 'available' && (
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <button
                    onClick={() => setShowPurchaseModal(true)}
                    className="px-4 py-3 bg-black text-white font-semibold text-sm hover:bg-gray-800 transition flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Purchase
                  </button>
                  <button
                    onClick={() => setShowOfferModal(true)}
                    className="px-4 py-3 border-2 border-black text-black font-semibold text-sm hover:bg-black hover:text-white transition flex items-center justify-center gap-2"
                  >
                    <DollarSign className="w-4 h-4" />
                    Make an Offer
                  </button>
                  <button
                    onClick={() => setShowHoldModal(true)}
                    className="px-4 py-3 border-2 border-black text-black font-semibold text-sm hover:bg-black hover:text-white transition flex items-center justify-center gap-2"
                  >
                    <Clock className="w-4 h-4" />
                    Place on Hold
                  </button>
                  <button
                    onClick={() => setShowPDFModal(true)}
                    className="px-4 py-3 border-2 border-black text-black font-semibold text-sm hover:bg-black hover:text-white transition flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Spec Sheet
                  </button>
                </div>
              )}

              {product.status === 'on_hold' && activeHold && (
                <div className="space-y-3 mb-6">
                  <div className="p-4 bg-amber-50 border border-amber-600">
                    <p className="font-semibold mb-1">Item On Hold</p>
                    <p className="text-sm text-gray-700">
                      This item is on hold until{' '}
                      {new Date(activeHold.hold_until).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPDFModal(true)}
                    className="w-full px-4 py-3 border-2 border-black text-black font-semibold text-sm hover:bg-black hover:text-white transition flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Download Spec Sheet
                  </button>
                </div>
              )}

              {product.status === 'sold' && (
                <div className="mb-6">
                  <button
                    onClick={() => setShowPDFModal(true)}
                    className="w-full px-4 py-3 border-2 border-black text-black font-semibold text-sm hover:bg-black hover:text-white transition flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Download Spec Sheet
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showPurchaseModal && (
        <Modal onClose={() => setShowPurchaseModal(false)} title="Purchase Inquiry">
          <form onSubmit={handlePurchaseInquiry} className="space-y-4">
            <p className="text-sm text-gray-600">
              Fill out the form below and you will receive a personalized invoice in your email to safely facilitate payment. For questions, call 785-232-8008
            </p>
            <input
              type="text"
              required
              placeholder="Full Name"
              value={purchaseForm.name}
              onChange={(e) => setPurchaseForm({ ...purchaseForm, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
            />
            <input
              type="email"
              required
              placeholder="Email Address"
              value={purchaseForm.email}
              onChange={(e) => setPurchaseForm({ ...purchaseForm, email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
            />
            <input
              type="tel"
              required
              placeholder="Phone Number"
              value={purchaseForm.phone}
              onChange={(e) => setPurchaseForm({ ...purchaseForm, phone: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
            />
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={purchaseForm.needsShipping}
                onChange={(e) =>
                  setPurchaseForm({ ...purchaseForm, needsShipping: e.target.checked })
                }
                className="mt-1 w-4 h-4"
              />
              <span className="text-sm">I need shipping for this item</span>
            </label>
            {purchaseForm.needsShipping && (
              <textarea
                required
                placeholder="Shipping Address"
                value={purchaseForm.shippingAddress}
                onChange={(e) =>
                  setPurchaseForm({ ...purchaseForm, shippingAddress: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
              />
            )}
            <button
              type="submit"
              className="w-full px-6 py-3 bg-black text-white font-semibold hover:bg-gray-800 transition"
            >
              Submit Purchase Inquiry
            </button>
          </form>
        </Modal>
      )}

      {showHoldModal && (
        <Modal onClose={() => setShowHoldModal(false)} title="Place Item on Hold">
          <form onSubmit={handlePlaceHold} className="space-y-4">
            <p className="text-sm text-gray-600">
              Place this item on hold for 45 days. We'll contact you to complete the purchase or extend the hold. For immediate assistance, call 785-232-8008
            </p>
            <input
              type="text"
              required
              placeholder="Full Name"
              value={holdForm.name}
              onChange={(e) => setHoldForm({ ...holdForm, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
            />
            <input
              type="email"
              required
              placeholder="Email Address"
              value={holdForm.email}
              onChange={(e) => setHoldForm({ ...holdForm, email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
            />
            <input
              type="tel"
              required
              placeholder="Phone Number"
              value={holdForm.phone}
              onChange={(e) => setHoldForm({ ...holdForm, phone: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
            />
            <button
              type="submit"
              className="w-full px-6 py-3 bg-black text-white font-semibold hover:bg-gray-800 transition"
            >
              Confirm Hold
            </button>
          </form>
        </Modal>
      )}

      {showOfferModal && (
        <Modal onClose={() => setShowOfferModal(false)} title="Make an Offer">
          <form onSubmit={handleMakeOffer} className="space-y-4">
            <p className="text-sm text-gray-600">
              Submit your offer and we'll review it. Our team will contact you within 24-48 hours.
            </p>
            <input
              type="text"
              required
              placeholder="Full Name"
              value={offerForm.name}
              onChange={(e) => setOfferForm({ ...offerForm, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
            />
            <input
              type="email"
              required
              placeholder="Email Address"
              value={offerForm.email}
              onChange={(e) => setOfferForm({ ...offerForm, email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
            />
            <input
              type="tel"
              required
              placeholder="Phone Number"
              value={offerForm.phone}
              onChange={(e) => setOfferForm({ ...offerForm, phone: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
            />
            <input
              type="number"
              required
              min="0"
              step="0.01"
              placeholder="Offer Amount ($)"
              value={offerForm.amount}
              onChange={(e) => setOfferForm({ ...offerForm, amount: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
            />
            <textarea
              placeholder="Additional message (optional)"
              value={offerForm.message}
              onChange={(e) => setOfferForm({ ...offerForm, message: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
            />
            <button
              type="submit"
              className="w-full px-6 py-3 bg-black text-white font-semibold hover:bg-gray-800 transition"
            >
              Submit Offer
            </button>
          </form>
        </Modal>
      )}

      {showPDFModal && (
        <Modal onClose={() => setShowPDFModal(false)} title="Download Spec Sheet">
          <form onSubmit={handleDownloadPDF} className="space-y-4">
            <p className="text-sm text-gray-600">
              Enter your email to receive the product specification sheet as a PDF.
            </p>
            <input
              type="email"
              required
              placeholder="Email Address"
              value={pdfForm.email}
              onChange={(e) => setPdfForm({ ...pdfForm, email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
            />
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={pdfForm.includePrice}
                onChange={(e) =>
                  setPdfForm({ ...pdfForm, includePrice: e.target.checked })
                }
                className="w-4 h-4"
              />
              <span className="text-sm">Include pricing information</span>
            </label>
            <button
              type="submit"
              className="w-full px-6 py-3 bg-black text-white font-semibold hover:bg-gray-800 transition"
            >
              Download PDF
            </button>
          </form>
        </Modal>
      )}
    </Layout>
  );
}

function Modal({
  children,
  onClose,
  title,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
