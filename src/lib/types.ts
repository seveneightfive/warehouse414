export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          icon_name: string;
          display_order: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['categories']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['categories']['Insert']>;
      };
      subcategories: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          slug: string;
          display_order: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['subcategories']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['subcategories']['Insert']>;
      };
      consignors: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          consignor_code: string;
          email: string | null;
          phone: string | null;
          address: string | null;
          commission_rate: number;
          notes: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['consignors']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['consignors']['Insert']>;
      };
      sku_counters: {
        Row: {
          id: string;
          category_id: string;
          current_count: number;
          last_updated: string;
        };
        Insert: Omit<Database['public']['Tables']['sku_counters']['Row'], 'id' | 'last_updated'>;
        Update: Partial<Database['public']['Tables']['sku_counters']['Insert']>;
      };
      sales_batches: {
        Row: {
          id: string;
          title: string;
          submission_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['sales_batches']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['sales_batches']['Insert']>;
      };
      products: {
        Row: {
          id: string;
          sku: string;
          title: string;
          short_description: string | null;
          full_description: string | null;
          maker: string | null;
          designer: string | null;
          material: string | null;
          dimensions: string | null;
          crate_size: string | null;
          price: number;
          sale_price: number | null;
          is_on_sale: boolean;
          status: 'available' | 'on_hold' | 'sold' | 'inventory';
          featured_image_url: string | null;
          consignor: string | null;
          consignor_id: string | null;
          workflow_stage: 'research' | 'descriptions' | 'photos' | 'ready' | 'listed' | 'preparation' | 'photo' | 'edit' | 'for_submission' | 'scheduled' | 'received';
          purchase_price: number | null;
          workflow_stage_updated_at: string | null;
          workflow_status: string;
          sales_batch_id: string | null;
          prep_due_date: string | null;
          photo_due_date: string | null;
          edit_due_date: string | null;
          submission_due_date: string | null;
          is_featured: boolean;
          category_id: string | null;
          subcategory_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['products']['Insert']>;
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          image_url: string;
          display_order: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['product_images']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['product_images']['Insert']>;
      };
      product_holds: {
        Row: {
          id: string;
          product_id: string;
          customer_name: string;
          customer_email: string;
          customer_phone: string;
          hold_date: string;
          hold_until: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['product_holds']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['product_holds']['Insert']>;
      };
      product_offers: {
        Row: {
          id: string;
          product_id: string;
          customer_name: string;
          customer_email: string;
          customer_phone: string;
          offer_amount: number;
          message: string | null;
          status: 'pending' | 'approved' | 'rejected';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['product_offers']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['product_offers']['Insert']>;
      };
      product_sales: {
        Row: {
          id: string;
          product_id: string;
          sale_price: number;
          sold_on_platform: string;
          sale_date: string;
          consignor_paid: boolean;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['product_sales']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['product_sales']['Insert']>;
      };
      cross_listings: {
        Row: {
          id: string;
          product_id: string;
          platform: string;
          platform_url: string | null;
          listed_date: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['cross_listings']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['cross_listings']['Insert']>;
      };
      reviews: {
        Row: {
          id: string;
          customer_name: string;
          review_text: string;
          rating: number;
          is_featured: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['reviews']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['reviews']['Insert']>;
      };
      pdf_downloads: {
        Row: {
          id: string;
          product_id: string;
          customer_email: string;
          include_price: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['pdf_downloads']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['pdf_downloads']['Insert']>;
      };
      designers: {
        Row: {
          id: string;
          name: string;
          about: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['designers']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['designers']['Insert']>;
      };
      product_designer: {
        Row: {
          id: string;
          product_id: string;
          designer_id: string;
          attribution_type: 'by' | 'in_the_style_of' | 'attributed_to';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['product_designer']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['product_designer']['Insert']>;
      };
    };
  };
};

export type AttributionType = 'by' | 'in_the_style_of' | 'attributed_to';

export type Category = Database['public']['Tables']['categories']['Row'];
export type Subcategory = Database['public']['Tables']['subcategories']['Row'];
export type Consignor = Database['public']['Tables']['consignors']['Row'];
export type SKUCounter = Database['public']['Tables']['sku_counters']['Row'];
export type SalesBatch = Database['public']['Tables']['sales_batches']['Row'];
export type Product = Database['public']['Tables']['products']['Row'] & {
  category?: { name: string; slug: string } | null;
  subcategory?: { name: string; slug: string } | null;
  consignor_details?: Consignor | null;
  designer_info?: {
    designer: Designer;
    attribution_type: AttributionType;
  } | null;
};
export type ProductImage = Database['public']['Tables']['product_images']['Row'];
export type ProductHold = Database['public']['Tables']['product_holds']['Row'];
export type ProductOffer = Database['public']['Tables']['product_offers']['Row'];
export type ProductSale = Database['public']['Tables']['product_sales']['Row'];
export type CrossListing = Database['public']['Tables']['cross_listings']['Row'];
export type Review = Database['public']['Tables']['reviews']['Row'];
export type PDFDownload = Database['public']['Tables']['pdf_downloads']['Row'];
export type Designer = Database['public']['Tables']['designers']['Row'] & {
  product_count?: number;
};
export type ProductDesigner = Database['public']['Tables']['product_designer']['Row'];
