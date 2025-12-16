import { useState, useEffect } from 'react';
import { Download, Tag, X, Mail, ChevronDown, ArrowLeft } from 'lucide-react';
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
  const [showInterestModal, setShowInterestModal] = useState(false);

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

  const [interestForm, setInterestForm] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

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

  const handleExpressInterest = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!product) return;

    try {
      const { error: dbError } = await supabase.from('hold_interest_notifications').insert({
        product_id: productId,
        customer_name: interestForm.name,
        customer_email: interestForm.email,
        customer_phone: interestForm.phone,
      });

      if (dbError) throw dbError;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-hold-interest-notification`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productTitle: product.title,
            productSku: product.sku,
            customerName: interestForm.name,
            customerEmail: interestForm.email,
            customerPhone: interestForm.phone,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to send notification');
      }

      alert('Thank you for your interest! We will contact you if this item becomes available.');
      setShowInterestModal(false);
      setInterestForm({ name: '', email: '', phone: '' });
    } catch (error) {
      console.error('Error submitting interest:', error);
      alert('Error submitting your interest. Please try again or call us at 785.232.8008');
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

  // Combine featured image with product images, ensuring no duplicates
  const allImages = (() => {
    const imageUrls = new Set<string>();
    const imageList: string[] = [];

    // Add featured image first if it exists
    if (product.featured_image_url) {
      imageUrls.add(product.featured_image_url);
      imageList.push(product.featured_image_url);
    }

    // Add other product images in order, skipping duplicates
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
      <div className="container mx-auto px-4 py-12">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 mb-6 text-black hover:text-gray-600 transition group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium tracking-wider">BACK TO SHOP</span>
        </button>

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
                <div className="absolute top-6 right-6 bg-red-900 text-white px-6 py-3 text-sm font-bold tracking-wider">
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
              <p className="text-lg text-gray-700 mb-6 font-light">{product.short_description}</p>
            )}

            <div className="space-y-3 mb-8 text-sm">
              {product.category && (
                <div className="flex">
                  <span className="font-bold w-32 tracking-wider lowercase">category:</span>
                  <span className="font-light">{product.category.name}</span>
                </div>
              )}
              {product.subcategory && product.subcategory.slug !== 'all' && (
                <div className="flex">
                  <span className="font-bold w-32 tracking-wider lowercase">subcategory:</span>
                  <span className="font-light">{product.subcategory.name}</span>
                </div>
              )}
              {product.designer && (
                <div className="flex">
                  <span className="font-bold w-32 tracking-wider lowercase">designer:</span>
                  <span className="font-light">{product.designer}</span>
                </div>
              )}
              {product.maker && (
                <div className="flex">
                  <span className="font-bold w-32 tracking-wider lowercase">maker:</span>
                  <span className="font-light">{product.maker}</span>
                </div>
              )}
              {product.material && (
                <div className="flex">
                  <span className="font-bold w-32 tracking-wider lowercase">material:</span>
                  <span className="font-light">{product.material}</span>
                </div>
              )}
              {product.dimensions && (
                <div className="flex">
                  <span className="font-bold w-32 tracking-wider lowercase">dimensions:</span>
                  <span className="font-light">{product.dimensions}</span>
                </div>
              )}
              <div className="flex">
                <span className="font-bold w-32 tracking-wider lowercase">sku:</span>
                <span className="font-light">{product.sku}</span>
              </div>
            </div>

            {product.full_description && (
              <div className="mb-8">
                <h2 className="text-xl font-bold tracking-wider mb-3">DESCRIPTION</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line font-light">
                  {product.full_description}
                </p>
              </div>
            )}

            <div className="space-y-3">
              {product.status === 'available' && (
                <>
                  <button
                    onClick={() => setShowHoldModal(true)}
                    className="w-full px-6 py-4 bg-red-900 text-white font-bold tracking-wider hover:bg-red-800 transition"
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
                <div className="space-y-3">
                  <div className="p-4 bg-red-50 border-2 border-red-900">
                    <p className="font-bold tracking-wider mb-2">ITEM ON HOLD</p>
                    <p className="text-sm font-light">
                      this item is on hold until{' '}
                      {new Date(activeHold.hold_until).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowInterestModal(true)}
                    className="w-full px-6 py-4 border-2 border-black text-black font-bold tracking-wider hover:bg-black hover:text-white transition flex items-center justify-center gap-2"
                  >
                    <Mail className="w-5 h-5" />
                    ARE YOU INTERESTED IN THIS ITEM? LET US KNOW
                  </button>
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

            {(product.dimensions || product.crate_size) && (
              <div className="mt-8 border-t pt-8">
                <h2 className="text-2xl font-light mb-6">additional information</h2>

                {product.dimensions && (
                  <div className="mb-4">
                    <button
                      onClick={() => setOpenAccordion(openAccordion === 'dimensions' ? null : 'dimensions')}
                      className="w-full bg-black text-white px-6 py-4 font-bold tracking-wider text-left flex items-center justify-between hover:bg-gray-800 transition"
                    >
                      dimensions
                      <ChevronDown
                        className={`w-5 h-5 transition-transform ${
                          openAccordion === 'dimensions' ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {openAccordion === 'dimensions' && (
                      <div className="border border-t-0 border-black p-6 bg-white">
                        <div className="font-light whitespace-pre-line">
                          {product.dimensions}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {product.crate_size && (
                  <div className="mb-4">
                    <button
                      onClick={() => setOpenAccordion(openAccordion === 'crate' ? null : 'crate')}
                      className="w-full bg-black text-white px-6 py-4 font-bold tracking-wider text-left flex items-center justify-between hover:bg-gray-800 transition"
                    >
                      crate / box size
                      <ChevronDown
                        className={`w-5 h-5 transition-transform ${
                          openAccordion === 'crate' ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {openAccordion === 'crate' && (
                      <div className="border border-t-0 border-black p-6 bg-white">
                        <div className="font-light whitespace-pre-line">
                          {product.crate_size}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showHoldModal && (
        <Modal onClose={() => setShowHoldModal(false)} title="PLACE ITEM ON HOLD">
          <form onSubmit={handlePlaceHold} className="space-y-4">
            <p className="text-sm text-gray-600 mb-4 font-light">
              place this item on hold for 45 days. we'll contact you to complete the purchase or extend the hold in a few weeks. if you need immediate assistance, please call 785.232.8008
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
              className="w-full px-6 py-3 bg-red-900 text-white font-bold tracking-wider hover:bg-red-800 transition"
            >
              CONFIRM HOLD
            </button>
          </form>
        </Modal>
      )}

      {showOfferModal && (
        <Modal onClose={() => setShowOfferModal(false)} title="MAKE AN OFFER">
          <form onSubmit={handleMakeOffer} className="space-y-4">
            <p className="text-sm text-gray-600 mb-4 font-light">
              submit your offer and we'll review it. our team will contact you within 24-48 hours.
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
            <p className="text-sm text-gray-600 mb-4 font-light">
              looking for something similar? let us know and we'll reach out if we find a match.
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
            <p className="text-sm text-gray-600 mb-4 font-light">
              enter your email to receive the product specification sheet as a pdf.
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
              <span className="text-sm font-light">include pricing information</span>
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

      {showInterestModal && (
        <Modal onClose={() => setShowInterestModal(false)} title="EXPRESS INTEREST">
          <form onSubmit={handleExpressInterest} className="space-y-4">
            <p className="text-sm text-gray-600 mb-4 font-light">
              interested in this item? let us know and we'll contact you if it becomes available.
            </p>
            <input
              type="text"
              required
              placeholder="Full Name"
              value={interestForm.name}
              onChange={(e) => setInterestForm({ ...interestForm, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
            />
            <input
              type="email"
              required
              placeholder="Email"
              value={interestForm.email}
              onChange={(e) => setInterestForm({ ...interestForm, email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
            />
            <input
              type="tel"
              required
              placeholder="Phone Number"
              value={interestForm.phone}
              onChange={(e) => setInterestForm({ ...interestForm, phone: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
            />
            <button
              type="submit"
              className="w-full px-6 py-3 bg-black text-white font-bold tracking-wider hover:bg-gray-800 transition"
            >
              NOTIFY ME
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
