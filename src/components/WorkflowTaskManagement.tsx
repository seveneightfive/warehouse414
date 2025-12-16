import { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Product, Consignor, Category } from '../lib/types';
import { generateWeeklyTaskListPDF } from '../utils/pdfGenerator';

type WorkflowStage = 'research' | 'descriptions' | 'photos' | 'ready' | 'listed';

interface ProductWithDetails extends Product {
  consignor_details?: Consignor | null;
  category?: { name: string; slug: string } | null;
  days_in_stage?: number;
}

export default function WorkflowTaskManagement() {
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [consignors, setConsignors] = useState<Consignor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState<WorkflowStage | 'all'>('all');
  const [selectedConsignor, setSelectedConsignor] = useState<string>('all');

  const stages: { key: WorkflowStage; label: string; color: string }[] = [
    { key: 'research', label: 'Research', color: 'bg-blue-100 text-blue-800' },
    { key: 'descriptions', label: 'Descriptions', color: 'bg-purple-100 text-purple-800' },
    { key: 'photos', label: 'Photos', color: 'bg-yellow-100 text-yellow-800' },
    { key: 'ready', label: 'Ready', color: 'bg-green-100 text-green-800' },
    { key: 'listed', label: 'Listed', color: 'bg-gray-100 text-gray-800' },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: productsData } = await supabase
        .from('products')
        .select('*, category:categories(name, slug)')
        .order('workflow_stage_updated_at', { ascending: true });

      const { data: consignorsData } = await supabase
        .from('consignors')
        .select('*')
        .eq('is_active', true)
        .order('last_name', { ascending: true });

      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (productsData) {
        const productsWithConsignors = await Promise.all(
          productsData.map(async (product) => {
            if (product.consignor_id) {
              const { data: consignorData } = await supabase
                .from('consignors')
                .select('*')
                .eq('id', product.consignor_id)
                .maybeSingle();

              const daysInStage = product.workflow_stage_updated_at
                ? Math.floor(
                    (new Date().getTime() -
                      new Date(product.workflow_stage_updated_at).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                : 0;

              return {
                ...product,
                consignor_details: consignorData,
                days_in_stage: daysInStage,
              };
            }
            return {
              ...product,
              days_in_stage: product.workflow_stage_updated_at
                ? Math.floor(
                    (new Date().getTime() -
                      new Date(product.workflow_stage_updated_at).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                : 0,
            };
          })
        );

        setProducts(productsWithConsignors);
      }

      setConsignors(consignorsData || []);
      setCategories(categoriesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStageChange = async (productId: string, newStage: WorkflowStage) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ workflow_stage: newStage })
        .eq('id', productId);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error updating workflow stage:', error);
      alert('Error updating workflow stage. Please try again.');
    }
  };

  const filteredProducts = products.filter((product) => {
    if (selectedStage !== 'all' && product.workflow_stage !== selectedStage) {
      return false;
    }
    if (selectedConsignor !== 'all' && product.consignor_id !== selectedConsignor) {
      return false;
    }
    return true;
  });

  const getStageCount = (stage: WorkflowStage) => {
    return products.filter((p) => p.workflow_stage === stage).length;
  };

  const handleExportPDF = () => {
    generateWeeklyTaskListPDF(filteredProducts, categories, consignors);
  };

  if (loading) {
    return <div className="text-center py-12">Loading workflow data...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-normal tracking-[0.08em]">WORKFLOW TASK MANAGEMENT</h2>
        <button
          onClick={handleExportPDF}
          className="flex items-center gap-2 px-6 py-3 bg-black text-white hover:bg-gray-800 transition tracking-[0.06em]"
        >
          <FileText className="w-5 h-5" />
          EXPORT TASK LIST (PDF)
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {stages.map((stage) => (
          <div
            key={stage.key}
            className={`p-4 border-2 ${
              selectedStage === stage.key ? 'border-black' : 'border-gray-300'
            } cursor-pointer hover:border-black transition`}
            onClick={() => setSelectedStage(stage.key)}
          >
            <div className="text-center">
              <div className="text-3xl font-medium mb-2">{getStageCount(stage.key)}</div>
              <div className="text-sm tracking-[0.06em]">{stage.label.toUpperCase()}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-6 flex gap-4">
        <select
          value={selectedStage}
          onChange={(e) => setSelectedStage(e.target.value as WorkflowStage | 'all')}
          className="font-calibri px-4 py-2 border border-gray-300 focus:outline-none focus:border-black"
        >
          <option value="all">All Stages</option>
          {stages.map((stage) => (
            <option key={stage.key} value={stage.key}>
              {stage.label}
            </option>
          ))}
        </select>

        <select
          value={selectedConsignor}
          onChange={(e) => setSelectedConsignor(e.target.value)}
          className="font-calibri px-4 py-2 border border-gray-300 focus:outline-none focus:border-black"
        >
          <option value="all">All Consignors</option>
          {consignors.map((consignor) => (
            <option key={consignor.id} value={consignor.id}>
              {consignor.consignor_code} - {consignor.first_name} {consignor.last_name}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="font-calibri px-4 py-3 text-left text-sm font-medium tracking-[0.04em]">SKU</th>
              <th className="font-calibri px-4 py-3 text-left text-sm font-medium tracking-[0.04em]">TITLE</th>
              <th className="font-calibri px-4 py-3 text-left text-sm font-medium tracking-[0.04em]">CONSIGNOR</th>
              <th className="font-calibri px-4 py-3 text-left text-sm font-medium tracking-[0.04em]">CATEGORY</th>
              <th className="font-calibri px-4 py-3 text-left text-sm font-medium tracking-[0.04em]">
                CURRENT STAGE
              </th>
              <th className="font-calibri px-4 py-3 text-left text-sm font-medium tracking-[0.04em]">
                DAYS IN STAGE
              </th>
              <th className="font-calibri px-4 py-3 text-left text-sm font-medium tracking-[0.04em]">
                MOVE TO STAGE
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => {
              const currentStage = stages.find((s) => s.key === product.workflow_stage);
              return (
                <tr key={product.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="font-calibri px-4 py-3 text-sm font-medium">{product.sku}</td>
                  <td className="font-calibri px-4 py-3 text-sm">{product.title}</td>
                  <td className="font-calibri px-4 py-3 text-sm">
                    {product.consignor_details
                      ? `${product.consignor_details.consignor_code} - ${product.consignor_details.first_name} ${product.consignor_details.last_name}`
                      : product.consignor || '-'}
                  </td>
                  <td className="font-calibri px-4 py-3 text-sm">{product.category?.name || '-'}</td>
                  <td className="font-calibri px-4 py-3 text-sm">
                    <span className={`px-2 py-1 text-xs font-medium tracking-[0.06em] ${currentStage?.color}`}>
                      {currentStage?.label.toUpperCase()}
                    </span>
                  </td>
                  <td className="font-calibri px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-1 text-xs font-medium tracking-[0.06em] ${
                        (product.days_in_stage || 0) > 14
                          ? 'bg-red-100 text-red-800'
                          : (product.days_in_stage || 0) > 7
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {product.days_in_stage} DAYS
                    </span>
                  </td>
                  <td className="font-calibri px-4 py-3 text-sm">
                    <select
                      value={product.workflow_stage}
                      onChange={(e) =>
                        handleStageChange(product.id, e.target.value as WorkflowStage)
                      }
                      className="font-calibri px-3 py-1 border border-gray-300 focus:outline-none focus:border-black text-xs"
                    >
                      {stages.map((stage) => (
                        <option key={stage.key} value={stage.key}>
                          {stage.label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12 text-gray-600">No products match your filters.</div>
      )}
    </div>
  );
}
