import type { Product } from '../lib/types';

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
