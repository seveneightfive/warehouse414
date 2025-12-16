# Database Security Fixes

## Applied Fixes (via Migration)

The following security issues have been automatically resolved through the database migration:

### 1. Performance - Missing Foreign Key Indexes
- ✅ Added index on `cross_listings.product_id`
- ✅ Added index on `hold_interest_notifications.product_id`
- ✅ Added index on `pdf_downloads.product_id`
- ✅ Added index on `product_holds.product_id`
- ✅ Added index on `product_images.product_id`
- ✅ Added index on `product_offers.product_id`
- ✅ Added index on `product_sales.product_id`

### 2. Performance - Duplicate Index
- ✅ Removed duplicate index `idx_products_workflow_stage` (kept `idx_products_workflow`)

### 3. Security - Multiple Permissive Policies
- ✅ Consolidated RLS policies to single policy per action for:
  - categories
  - subcategories
  - products
  - product_images
  - product_offers
  - product_holds
  - cross_listings
  - reviews

### 4. Security - Function Search Path Mutability
- ✅ Fixed `update_updated_at_column()` function
- ✅ Fixed `generate_consignor_code()` function
- ✅ Fixed `generate_sku()` function
- ✅ Fixed `update_workflow_stage_timestamp()` function
- ✅ Fixed `update_consignor_timestamp()` function

All functions now use `SET search_path = public, pg_temp` to prevent search path hijacking.

## Remaining Issues (Require Manual Configuration)

The following issues require manual configuration in the Supabase dashboard and cannot be fixed via SQL migrations:

### 1. Unused Indexes
Several indexes are flagged as unused. These are intentionally created for future query optimization:
- `idx_products_status` - For filtering products by status
- `idx_products_featured` - For querying featured products
- `idx_product_offers_status` - For filtering offers by status
- `idx_cross_listings_active` - For querying active cross listings
- `idx_consignors_active` - For querying active consignors
- `idx_products_consignor_id` - For consignor-specific queries
- `idx_products_workflow` - For workflow stage filtering
- `idx_sku_counters_category` - For SKU generation
- `idx_products_category` - For category-based queries
- `idx_products_subcategory` - For subcategory-based queries
- `idx_subcategories_category` - For category-subcategory relationships
- `idx_subcategories_display_order` - For ordered subcategory display

**Action**: These indexes are important for application performance as usage grows. Monitor query performance and keep these indexes.

### 2. Auth DB Connection Strategy
**Issue**: Auth server uses fixed connection count (10) instead of percentage-based allocation.

**Action**: Update in Supabase Dashboard:
1. Go to Project Settings → Database
2. Change Auth connection pooling from fixed number to percentage-based
3. Recommended: 10-15% of available connections

### 3. Leaked Password Protection
**Issue**: Password breach detection via HaveIBeenPwned.org is disabled.

**Action**: Enable in Supabase Dashboard:
1. Go to Authentication → Settings
2. Enable "Leaked Password Protection"
3. This checks user passwords against known compromised password databases

## Security Best Practices Applied

1. **Row Level Security (RLS)**: All tables have RLS enabled with proper policies
2. **Least Privilege**: Public users can only read public data; authenticated users have full CRUD access
3. **Function Security**: All functions use SECURITY DEFINER with immutable search_path
4. **Index Coverage**: All foreign keys now have covering indexes for optimal query performance
5. **Policy Consolidation**: Single policy per action prevents policy conflicts and improves security clarity

## Monitoring Recommendations

1. Regularly review unused indexes after application usage grows
2. Monitor query performance using Supabase's built-in query analyzer
3. Audit RLS policies periodically to ensure they match business requirements
4. Keep the HaveIBeenPwned integration enabled for password security
