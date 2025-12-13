import type { Product, Category, Consignor } from '../lib/types';

export interface PDFOptions {
  includePrice: boolean;
}

export function generateProductPDF(product: Product, options: PDFOptions): string {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${product.title} - Spec Sheet</title>
  <style>
    @import url('https://fonts.cdnfonts.com/css/agency-fb');
    @import url('https://fonts.cdnfonts.com/css/kabel');

    body {
      font-family: 'Kabel', Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
      color: #000;
    }
    .header {
      text-align: center;
      border-bottom: 4px solid #000;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .logo {
      font-family: 'Agency FB', Arial Narrow, sans-serif;
      font-size: 32px;
      font-weight: bold;
      letter-spacing: 3px;
    }
    .tagline {
      font-family: 'Kabel', Arial, sans-serif;
      font-size: 14px;
      margin-top: 10px;
      text-transform: lowercase;
    }
    h1, h2, h3, h4, h5, h6 {
      font-family: 'Agency FB', Arial Narrow, sans-serif;
      font-weight: bold;
    }
    .product-image {
      width: 100%;
      max-height: 400px;
      object-fit: cover;
      margin: 20px 0;
      border: 1px solid #ddd;
    }
    .product-title {
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .product-description {
      font-size: 14px;
      line-height: 1.6;
      color: #333;
      margin-bottom: 20px;
    }
    .specs-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    .specs-table td {
      padding: 10px;
      border-bottom: 1px solid #ddd;
    }
    .specs-table td:first-child {
      font-weight: bold;
      width: 150px;
    }
    .price {
      font-size: 24px;
      font-weight: bold;
      margin: 20px 0;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #000;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">WAREHOUSE 414</div>
    <p class="tagline">unique, one-of-a-kind high style furnishings</p>
  </div>

  ${product.featured_image_url ? `
  <img src="${product.featured_image_url}" alt="${product.title}" class="product-image" />
  ` : ''}

  <h1 class="product-title">${product.title}</h1>

  ${product.short_description ? `
  <p class="product-description">${product.short_description}</p>
  ` : ''}

  <table class="specs-table">
    <tbody>
      <tr>
        <td>SKU</td>
        <td>${product.sku}</td>
      </tr>
      ${product.designer ? `
      <tr>
        <td>Designer</td>
        <td>${product.designer}</td>
      </tr>
      ` : ''}
      ${product.maker ? `
      <tr>
        <td>Maker</td>
        <td>${product.maker}</td>
      </tr>
      ` : ''}
      ${product.material ? `
      <tr>
        <td>Material</td>
        <td>${product.material}</td>
      </tr>
      ` : ''}
      ${product.dimensions ? `
      <tr>
        <td>Dimensions</td>
        <td>${product.dimensions}</td>
      </tr>
      ` : ''}
    </tbody>
  </table>

  ${options.includePrice ? `
  <div class="price">
    Price: $${product.price.toLocaleString()}
    ${product.is_on_sale && product.sale_price ? `
      <span style="color: #dc2626; margin-left: 10px;">SALE: $${product.sale_price.toLocaleString()}</span>
    ` : ''}
  </div>
  ` : ''}

  ${product.full_description ? `
  <div style="margin-top: 30px;">
    <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">Description</h2>
    <p class="product-description">${product.full_description.replace(/\n/g, '<br>')}</p>
  </div>
  ` : ''}

  <div class="footer">
    <div class="stripes" style="margin-bottom: 10px;"></div>
    <p>WAREHOUSE 414</p>
    <p>Contact: sales@warehouse414.com</p>
    <p>Also available on 1stDibs, Charish, and eBay</p>
  </div>
</body>
</html>
  `.trim();

  return html;
}

export function downloadPDF(html: string, filename: string) {
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

interface ProductWithDetails extends Product {
  consignor_details?: Consignor | null;
  category?: { name: string; slug: string } | null;
  days_in_stage?: number;
}

export function generateWeeklyTaskListPDF(
  products: ProductWithDetails[],
  categories: Category[],
  consignors: Consignor[]
) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const stages = [
    { key: 'research', label: 'Research' },
    { key: 'descriptions', label: 'Descriptions' },
    { key: 'photos', label: 'Photos' },
    { key: 'ready', label: 'Ready' },
    { key: 'listed', label: 'Listed' },
  ];

  const groupedProducts = stages.map((stage) => ({
    stage: stage.label,
    products: products.filter((p) => p.workflow_stage === stage.key),
  }));

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Weekly Task List - ${today}</title>
  <style>
    @import url('https://fonts.cdnfonts.com/css/agency-fb');
    @import url('https://fonts.cdnfonts.com/css/kabel');

    body {
      font-family: 'Kabel', Arial, sans-serif;
      max-width: 1000px;
      margin: 0 auto;
      padding: 40px;
      color: #000;
    }
    .header {
      text-align: center;
      border-bottom: 4px solid #000;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .logo {
      font-family: 'Agency FB', Arial Narrow, sans-serif;
      font-size: 32px;
      font-weight: bold;
      letter-spacing: 3px;
    }
    .report-title {
      font-family: 'Agency FB', Arial Narrow, sans-serif;
      font-size: 24px;
      font-weight: bold;
      margin-top: 15px;
    }
    .report-date {
      font-size: 14px;
      color: #666;
      margin-top: 5px;
    }
    .stage-section {
      margin: 30px 0;
      page-break-inside: avoid;
    }
    .stage-header {
      font-family: 'Agency FB', Arial Narrow, sans-serif;
      font-size: 20px;
      font-weight: bold;
      background: #f3f4f6;
      padding: 10px 15px;
      border-left: 4px solid #000;
      margin-bottom: 15px;
    }
    .products-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .products-table thead {
      background: #e5e7eb;
    }
    .products-table th {
      font-family: 'Agency FB', Arial Narrow, sans-serif;
      font-weight: bold;
      text-align: left;
      padding: 8px;
      border-bottom: 2px solid #000;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .products-table td {
      padding: 8px;
      border-bottom: 1px solid #ddd;
      font-size: 11px;
    }
    .products-table tr:hover {
      background: #f9fafb;
    }
    .sku-cell {
      font-weight: bold;
      font-family: monospace;
    }
    .days-badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 10px;
      font-weight: bold;
    }
    .days-green {
      background: #d1fae5;
      color: #065f46;
    }
    .days-yellow {
      background: #fef3c7;
      color: #92400e;
    }
    .days-red {
      background: #fee2e2;
      color: #991b1b;
    }
    .summary {
      margin-top: 30px;
      padding: 20px;
      background: #f9fafb;
      border: 2px solid #000;
    }
    .summary-title {
      font-family: 'Agency FB', Arial Narrow, sans-serif;
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .summary-item {
      margin: 5px 0;
      font-size: 12px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #000;
      text-align: center;
      font-size: 11px;
      color: #666;
    }
    .no-products {
      text-align: center;
      color: #666;
      font-style: italic;
      padding: 20px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">WAREHOUSE 414</div>
    <div class="report-title">WEEKLY TASK LIST</div>
    <div class="report-date">${today}</div>
  </div>

  <div class="summary">
    <div class="summary-title">SUMMARY</div>
    ${groupedProducts
      .map(
        (group) =>
          `<div class="summary-item"><strong>${group.stage}:</strong> ${group.products.length} items</div>`
      )
      .join('')}
    <div class="summary-item"><strong>TOTAL:</strong> ${products.length} items</div>
  </div>

  ${groupedProducts
    .map((group) => {
      if (group.products.length === 0) {
        return `
        <div class="stage-section">
          <div class="stage-header">${group.stage.toUpperCase()} (0 items)</div>
          <div class="no-products">No products in this stage</div>
        </div>
      `;
      }

      return `
      <div class="stage-section">
        <div class="stage-header">${group.stage.toUpperCase()} (${group.products.length} items)</div>
        <table class="products-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>TITLE</th>
              <th>CONSIGNOR</th>
              <th>CATEGORY</th>
              <th>DAYS IN STAGE</th>
            </tr>
          </thead>
          <tbody>
            ${group.products
              .map((product) => {
                const daysInStage = product.days_in_stage || 0;
                const daysBadgeClass =
                  daysInStage > 14
                    ? 'days-red'
                    : daysInStage > 7
                    ? 'days-yellow'
                    : 'days-green';

                const consignorText = product.consignor_details
                  ? `${product.consignor_details.consignor_code} - ${product.consignor_details.first_name} ${product.consignor_details.last_name}`
                  : product.consignor || '-';

                return `
              <tr>
                <td class="sku-cell">${product.sku}</td>
                <td>${product.title}</td>
                <td>${consignorText}</td>
                <td>${product.category?.name || '-'}</td>
                <td><span class="days-badge ${daysBadgeClass}">${daysInStage} days</span></td>
              </tr>
            `;
              })
              .join('')}
          </tbody>
        </table>
      </div>
    `;
    })
    .join('')}

  <div class="footer">
    <p>WAREHOUSE 414 - Internal Task List</p>
    <p>Generated on ${today}</p>
  </div>
</body>
</html>
  `.trim();

  downloadPDF(html, `weekly-task-list-${new Date().toISOString().split('T')[0]}`);
}
