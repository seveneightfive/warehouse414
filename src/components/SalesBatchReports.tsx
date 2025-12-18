import { useState, useEffect } from 'react';
import { FileText, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Product, SalesBatch } from '../lib/types';

interface ProductWithBatch extends Product {
  sales_batch?: SalesBatch | null;
}

export default function SalesBatchReports() {
  const [salesBatches, setSalesBatches] = useState<SalesBatch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [batchProducts, setBatchProducts] = useState<ProductWithBatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBatches();
  }, []);

  useEffect(() => {
    if (selectedBatch) {
      fetchBatchProducts(selectedBatch);
    }
  }, [selectedBatch]);

  const fetchBatches = async () => {
    try {
      const { data } = await supabase
        .from('sales_batches')
        .select('*')
        .order('submission_date', { ascending: false });

      setSalesBatches(data || []);
      if (data && data.length > 0) {
        setSelectedBatch(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatchProducts = async (batchId: string) => {
    try {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('sales_batch_id', batchId)
        .order('sku', { ascending: true });

      setBatchProducts(data || []);
    } catch (error) {
      console.error('Error fetching batch products:', error);
    }
  };

  const generatePDF = () => {
    const batch = salesBatches.find((b) => b.id === selectedBatch);
    if (!batch) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Sales Batch Report - ${batch.title}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              line-height: 1.6;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 3px solid #000;
              padding-bottom: 20px;
            }
            .header h1 {
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 10px;
              letter-spacing: 2px;
            }
            .header .subtitle {
              font-size: 16px;
              color: #666;
            }
            .summary {
              margin-bottom: 30px;
              padding: 20px;
              background: #f5f5f5;
              border-left: 4px solid #000;
            }
            .summary h2 {
              font-size: 18px;
              margin-bottom: 10px;
            }
            .summary p {
              margin: 5px 0;
            }
            .section {
              margin-bottom: 40px;
              page-break-inside: avoid;
            }
            .section h2 {
              font-size: 20px;
              margin-bottom: 15px;
              padding-bottom: 10px;
              border-bottom: 2px solid #000;
              letter-spacing: 1px;
            }
            .role-section {
              margin-bottom: 30px;
              padding: 15px;
              border: 2px solid #ddd;
            }
            .role-section h3 {
              font-size: 16px;
              margin-bottom: 10px;
              color: #000;
              font-weight: bold;
            }
            .role-assignee {
              font-size: 14px;
              color: #666;
              margin-bottom: 15px;
              font-style: italic;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 12px;
              text-align: left;
              font-size: 13px;
            }
            th {
              background: #000;
              color: white;
              font-weight: bold;
              letter-spacing: 1px;
            }
            tr:nth-child(even) {
              background: #f9f9f9;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #000;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
            @media print {
              body { padding: 20px; }
              .section { page-break-inside: avoid; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>SALES BATCH REPORT</h1>
            <div class="subtitle">Warehouse 414</div>
          </div>

          <div class="summary">
            <h2>Batch Information</h2>
            <p><strong>Batch Title:</strong> ${batch.title}</p>
            <p><strong>Submission Date:</strong> ${new Date(batch.submission_date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}</p>
            <p><strong>Total Products:</strong> ${batchProducts.length}</p>
            <p><strong>Report Generated:</strong> ${new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}</p>
          </div>

          <div class="section">
            <h2>WORKFLOW BY ROLE</h2>

            <div class="role-section">
              <h3>PREPARATION STAGE</h3>
              <div class="role-assignee">Assigned to: Andrew</div>
              <table>
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Product Title</th>
                    <th>Due Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${batchProducts
                    .map(
                      (p) => `
                    <tr>
                      <td>${p.sku}</td>
                      <td>${p.title}</td>
                      <td>${p.prep_due_date ? new Date(p.prep_due_date).toLocaleDateString() : 'N/A'}</td>
                      <td>${p.workflow_stage === 'preparation' ? 'In Progress' : p.workflow_stage === 'photo' || p.workflow_stage === 'edit' || p.workflow_stage === 'for_submission' ? 'Complete' : 'Pending'}</td>
                    </tr>
                  `
                    )
                    .join('')}
                </tbody>
              </table>
            </div>

            <div class="role-section">
              <h3>PHOTO STAGE</h3>
              <div class="role-assignee">Assigned to: Alijah</div>
              <table>
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Product Title</th>
                    <th>Due Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${batchProducts
                    .map(
                      (p) => `
                    <tr>
                      <td>${p.sku}</td>
                      <td>${p.title}</td>
                      <td>${p.photo_due_date ? new Date(p.photo_due_date).toLocaleDateString() : 'N/A'}</td>
                      <td>${p.workflow_stage === 'photo' ? 'In Progress' : p.workflow_stage === 'edit' || p.workflow_stage === 'for_submission' ? 'Complete' : 'Pending'}</td>
                    </tr>
                  `
                    )
                    .join('')}
                </tbody>
              </table>
            </div>

            <div class="role-section">
              <h3>EDIT STAGE</h3>
              <div class="role-assignee">Assigned to: Michelle</div>
              <table>
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Product Title</th>
                    <th>Due Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${batchProducts
                    .map(
                      (p) => `
                    <tr>
                      <td>${p.sku}</td>
                      <td>${p.title}</td>
                      <td>${p.edit_due_date ? new Date(p.edit_due_date).toLocaleDateString() : 'N/A'}</td>
                      <td>${p.workflow_stage === 'edit' ? 'In Progress' : p.workflow_stage === 'for_submission' ? 'Complete' : 'Pending'}</td>
                    </tr>
                  `
                    )
                    .join('')}
                </tbody>
              </table>
            </div>

            <div class="role-section">
              <h3>SUBMISSION STAGE</h3>
              <div class="role-assignee">Assigned to: Chris</div>
              <table>
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Product Title</th>
                    <th>Submission Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${batchProducts
                    .map(
                      (p) => `
                    <tr>
                      <td>${p.sku}</td>
                      <td>${p.title}</td>
                      <td>${p.submission_due_date ? new Date(p.submission_due_date).toLocaleDateString() : 'N/A'}</td>
                      <td>${p.workflow_stage === 'for_submission' ? 'Ready for Submission' : p.workflow_status === 'complete' ? 'Complete' : 'Not Ready'}</td>
                    </tr>
                  `
                    )
                    .join('')}
                </tbody>
              </table>
            </div>
          </div>

          <div class="section">
            <h2>ALL PRODUCTS IN BATCH</h2>
            <table>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Title</th>
                  <th>Price</th>
                  <th>Current Stage</th>
                  <th>Prep Due</th>
                  <th>Photo Due</th>
                  <th>Edit Due</th>
                  <th>Submit</th>
                </tr>
              </thead>
              <tbody>
                ${batchProducts
                  .map(
                    (p) => `
                  <tr>
                    <td>${p.sku}</td>
                    <td>${p.title}</td>
                    <td>$${p.price.toLocaleString()}</td>
                    <td>${p.workflow_stage.toUpperCase()}</td>
                    <td>${p.prep_due_date ? new Date(p.prep_due_date).toLocaleDateString() : '-'}</td>
                    <td>${p.photo_due_date ? new Date(p.photo_due_date).toLocaleDateString() : '-'}</td>
                    <td>${p.edit_due_date ? new Date(p.edit_due_date).toLocaleDateString() : '-'}</td>
                    <td>${p.submission_due_date ? new Date(p.submission_due_date).toLocaleDateString() : '-'}</td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
          </div>

          <div class="footer">
            <p>Warehouse 414 - Sales Batch Report</p>
            <p>This report was generated automatically from the Admin Dashboard</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (salesBatches.length === 0) {
    return (
      <div className="text-center py-12 text-gray-600">
        No sales batches found. Create a batch in the Sales Batch tab to generate reports.
      </div>
    );
  }

  const selectedBatchData = salesBatches.find((b) => b.id === selectedBatch);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-normal tracking-[0.08em]">SALES BATCH REPORTS</h2>
        <button
          onClick={generatePDF}
          disabled={!selectedBatch || batchProducts.length === 0}
          className="flex items-center gap-2 px-6 py-3 bg-black text-white hover:bg-gray-800 transition tracking-[0.06em] disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <Download className="w-5 h-5" />
          EXPORT PDF
        </button>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2 tracking-[0.06em]">SELECT BATCH</label>
        <select
          value={selectedBatch}
          onChange={(e) => setSelectedBatch(e.target.value)}
          className="font-calibri w-full md:w-96 px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
        >
          {salesBatches.map((batch) => (
            <option key={batch.id} value={batch.id}>
              {batch.title} - {new Date(batch.submission_date).toLocaleDateString()}
            </option>
          ))}
        </select>
      </div>

      {selectedBatchData && (
        <div className="space-y-6">
          <div className="p-6 bg-gray-50 border-2 border-gray-300">
            <h3 className="text-lg font-medium mb-4">Batch Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Batch Title</p>
                <p className="font-medium">{selectedBatchData.title}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Submission Date</p>
                <p className="font-medium">
                  {new Date(selectedBatchData.submission_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="font-medium">{batchProducts.length}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 border-2 border-yellow-500 bg-yellow-50">
              <h4 className="font-medium mb-2">Preparation (Andrew)</h4>
              <p className="text-2xl font-bold">
                {batchProducts.filter((p) => p.workflow_stage === 'preparation').length}
              </p>
              <p className="text-sm text-gray-600">in progress</p>
            </div>

            <div className="p-4 border-2 border-green-500 bg-green-50">
              <h4 className="font-medium mb-2">Photo (Alijah)</h4>
              <p className="text-2xl font-bold">
                {batchProducts.filter((p) => p.workflow_stage === 'photo').length}
              </p>
              <p className="text-sm text-gray-600">in progress</p>
            </div>

            <div className="p-4 border-2 border-blue-500 bg-blue-50">
              <h4 className="font-medium mb-2">Edit (Michelle)</h4>
              <p className="text-2xl font-bold">
                {batchProducts.filter((p) => p.workflow_stage === 'edit').length}
              </p>
              <p className="text-sm text-gray-600">in progress</p>
            </div>

            <div className="p-4 border-2 border-gray-500 bg-gray-50">
              <h4 className="font-medium mb-2">For Submission (Chris)</h4>
              <p className="text-2xl font-bold">
                {batchProducts.filter((p) => p.workflow_stage === 'for_submission').length}
              </p>
              <p className="text-sm text-gray-600">ready</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-3 text-left text-sm font-medium">SKU</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">TITLE</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">STAGE</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">PREP DUE</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">PHOTO DUE</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">EDIT DUE</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">SUBMIT</th>
                </tr>
              </thead>
              <tbody>
                {batchProducts.map((product) => (
                  <tr key={product.id} className="border-b border-gray-200">
                    <td className="font-calibri px-4 py-3 text-sm">{product.sku}</td>
                    <td className="font-calibri px-4 py-3 text-sm">{product.title}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs font-medium tracking-[0.06em] ${
                          product.workflow_stage === 'preparation'
                            ? 'bg-yellow-100 text-yellow-800'
                            : product.workflow_stage === 'photo'
                            ? 'bg-green-100 text-green-800'
                            : product.workflow_stage === 'edit'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {product.workflow_stage.toUpperCase()}
                      </span>
                    </td>
                    <td className="font-calibri px-4 py-3 text-sm">
                      {product.prep_due_date
                        ? new Date(product.prep_due_date).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="font-calibri px-4 py-3 text-sm">
                      {product.photo_due_date
                        ? new Date(product.photo_due_date).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="font-calibri px-4 py-3 text-sm">
                      {product.edit_due_date
                        ? new Date(product.edit_due_date).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="font-calibri px-4 py-3 text-sm">
                      {product.submission_due_date
                        ? new Date(product.submission_due_date).toLocaleDateString()
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
