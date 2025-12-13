import { useState, useEffect } from 'react';
import { Download, Tag, X } from 'lucide-react';
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

  const [showHoldModal, setShowHoldModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showSimilarModal, setShowSimilarModal] = useState(false);
  const [showPDFModal, setShowPDFModal] = useState(false);

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

  const [similarForm, setSimilarForm] = useState({
    name: '',
    email: '',
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

  const handleRequestSimilar = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailBody = `
Request for Similar Item

Product: ${product?.title}
SKU: ${product?.sku}

Customer Name: ${similarForm.name}
Customer Email: ${similarForm.email}
Message: ${similarForm.message}
    `.trim();

    console.log('Would send email to sales@warehouse414.com:', emailBody);
    alert(
      'Request submitted successfully! We will contact you at ' + similarForm.email
    );
    setShowSimilarModal(false);
    setSimilarForm({ name: '', email: '', message: '' });
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

  const allImages = [
    ...(product.featured_image_url ? [product.featured_image_url] : []),
    ...images.map((img) => img.image_url),
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
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
                <div className="absolute top-6 right-6 bg-yellow-500 text-black px-6 py-3 text-sm font-bold tracking-wider">
                  ON HOLD
                </div>
              )}

              {product.status === 'sold' && (
                <div className="absolute top-6 right-6 bg-black text-white px-6 py-3 text-sm font-bold tracking-wider">
                  SOLD
                </div>
              )}

              {product.is_on_sale && product.status === 'available' && (
                <div className="absolute top-6 right-6 bg-red-600 text-white px-6 py-3 text-sm font-bold tracking-wider flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  SALE
                </div>
              )}
            </div>

            {allImages.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`aspect-square border-2 ${
                      selectedImage === img ? 'border-black' : 'border-gray-200'
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

          <div>
            <h1 className="text-4xl font-bold tracking-wide mb-4">{product.title}</h1>

            <div className="h-1 bg-black mb-6"></div>

            <div className="mb-6">
              {product.is_on_sale && product.sale_price && (
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-bold">${displayPrice.toLocaleString()}</span>
                  <span className="text-xl text-gray-500 line-through">
                    ${product.price.toLocaleString()}
                  </span>
                  <span className="bg-red-600 text-white px-3 py-1 text-sm font-bold tracking-wider">
                    SALE
                  </span>
                </div>
              )}
              {(!product.is_on_sale || !product.sale_price) && (
                <span className="text-3xl font-bold">${displayPrice.toLocaleString()}</span>
              )}
            </div>

            {product.short_description && (
              <p className="text-lg text-gray-700 mb-6">{product.short_description}</p>
            )}

            <div className="space-y-3 mb-8 text-sm">
              {product.category && (
                <div className="flex">
                  <span className="font-bold w-32 tracking-wider">CATEGORY:</span>
                  <span>{product.category.name}</span>
                </div>
              )}
              {product.subcategory && product.subcategory.slug !== 'all' && (
                <div className="flex">
                  <span className="font-bold w-32 tracking-wider">SUBCATEGORY:</span>
                  <span>{product.subcategory.name}</span>
                </div>
              )}
              {product.designer && (
                <div className="flex">
                  <span className="font-bold w-32 tracking-wider">DESIGNER:</span>
                  <span>{product.designer}</span>
                </div>
              )}
              {product.maker && (
                <div className="flex">
                  <span className="font-bold w-32 tracking-wider">MAKER:</span>
                  <span>{product.maker}</span>
                </div>
              )}
              {product.material && (
                <div className="flex">
                  <span className="font-bold w-32 tracking-wider">MATERIAL:</span>
                  <span>{product.material}</span>
                </div>
              )}
              {product.dimensions && (
                <div className="flex">
                  <span className="font-bold w-32 tracking-wider">DIMENSIONS:</span>
                  <span>{product.dimensions}</span>
                </div>
              )}
              <div className="flex">
                <span className="font-bold w-32 tracking-wider">SKU:</span>
                <span>{product.sku}</span>
              </div>
            </div>

            {product.full_description && (
              <div className="mb-8">
                <h2 className="text-xl font-bold tracking-wider mb-3">DESCRIPTION</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {product.full_description}
                </p>
              </div>
            )}

            <div className="space-y-3">
              {product.status === 'available' && (
                <>
                  <button
                    onClick={() => setShowHoldModal(true)}
                    className="w-full px-6 py-4 bg-yellow-500 text-black font-bold tracking-wider hover:bg-yellow-600 transition"
                  >
                    PLACE ON HOLD (45 DAYS)
                  </button>
                  <button
                    onClick={() => setShowOfferModal(true)}
                    className="w-full px-6 py-4 bg-black text-white font-bold tracking-wider hover:bg-gray-800 transition"
                  >
                    MAKE AN OFFER
                  </button>
                </>
              )}

              {product.status === 'on_hold' && activeHold && (
                <div className="p-4 bg-yellow-50 border-2 border-yellow-500">
                  <p className="font-bold tracking-wider mb-2">ITEM ON HOLD</p>
                  <p className="text-sm">
                    This item is on hold until{' '}
                    {new Date(activeHold.hold_until).toLocaleDateString()}
                  </p>
                </div>
              )}

              {product.status === 'sold' && (
                <button
                  onClick={() => setShowSimilarModal(true)}
                  className="w-full px-6 py-4 bg-gray-800 text-white font-bold tracking-wider hover:bg-gray-900 transition"
                >
                  REQUEST SIMILAR ITEM
                </button>
              )}

              <button
                onClick={() => setShowPDFModal(true)}
                className="w-full px-6 py-4 border-2 border-black text-black font-bold tracking-wider hover:bg-black hover:text-white transition flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                DOWNLOAD SPEC SHEET
              </button>
            </div>
          </div>
        </div>
      </div>

      {showHoldModal && (
        <Modal onClose={() => setShowHoldModal(false)} title="PLACE ITEM ON HOLD">
          <form onSubmit={handlePlaceHold} className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Place this item on hold for 45 days. We'll contact you to complete the purchase.
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
              placeholder="Email"
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
              className="w-full px-6 py-3 bg-yellow-500 text-black font-bold tracking-wider hover:bg-yellow-600 transition"
            >
              CONFIRM HOLD
            </button>
          </form>
        </Modal>
      )}

      {showOfferModal && (
        <Modal onClose={() => setShowOfferModal(false)} title="MAKE AN OFFER">
          <form onSubmit={handleMakeOffer} className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
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
              placeholder="Email"
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
              className="w-full px-6 py-3 bg-black text-white font-bold tracking-wider hover:bg-gray-800 transition"
            >
              SUBMIT OFFER
            </button>
          </form>
        </Modal>
      )}

      {showSimilarModal && (
        <Modal onClose={() => setShowSimilarModal(false)} title="REQUEST SIMILAR ITEM">
          <form onSubmit={handleRequestSimilar} className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Looking for something similar? Let us know and we'll reach out if we find a match.
            </p>
            <input
              type="text"
              required
              placeholder="Full Name"
              value={similarForm.name}
              onChange={(e) => setSimilarForm({ ...similarForm, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
            />
            <input
              type="email"
              required
              placeholder="Email"
              value={similarForm.email}
              onChange={(e) => setSimilarForm({ ...similarForm, email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
            />
            <textarea
              required
              placeholder="What are you looking for?"
              value={similarForm.message}
              onChange={(e) => setSimilarForm({ ...similarForm, message: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
            />
            <button
              type="submit"
              className="w-full px-6 py-3 bg-black text-white font-bold tracking-wider hover:bg-gray-800 transition"
            >
              SUBMIT REQUEST
            </button>
          </form>
        </Modal>
      )}

      {showPDFModal && (
        <Modal onClose={() => setShowPDFModal(false)} title="DOWNLOAD SPEC SHEET">
          <form onSubmit={handleDownloadPDF} className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
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
                className="w-5 h-5"
              />
              <span className="text-sm">Include pricing information</span>
            </label>
            <button
              type="submit"
              className="w-full px-6 py-3 bg-black text-white font-bold tracking-wider hover:bg-gray-800 transition"
            >
              SEND PDF
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
            <h2 className="text-2xl font-bold tracking-wider">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
