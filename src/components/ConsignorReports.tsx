import { useState, useEffect } from 'react';
import { FileText, TrendingUp, Package, DollarSign } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Consignor, Product, ProductSale } from '../lib/types';

interface ConsignorStats {
  consignor: Consignor;
  totalProducts: number;
  availableProducts: number;
  soldProducts: number;
  totalSales: number;
  totalRevenue: number;
  commissionOwed: number;
}

export default function ConsignorReports() {
  const [consignors, setConsignors] = useState<Consignor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<ProductSale[]>([]);
  const [stats, setStats] = useState<ConsignorStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConsignor, setSelectedConsignor] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (consignors.length > 0 && products.length > 0) {
      calculateStats();
    }
  }, [consignors, products, sales]);

  const fetchData = async () => {
    try {
      const { data: consignorsData } = await supabase
        .from('consignors')
        .select('*')
        .order('last_name', { ascending: true });

      const { data: productsData } = await supabase.from('products').select('*');

      const { data: salesData } = await supabase.from('product_sales').select('*');

      setConsignors(consignorsData || []);
      setProducts(productsData || []);
      setSales(salesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const consignorStats: ConsignorStats[] = consignors.map((consignor) => {
      const consignorProducts = products.filter((p) => p.consignor_id === consignor.id);
      const soldProductIds = sales.map((s) => s.product_id);
      const soldProducts = consignorProducts.filter((p) => soldProductIds.includes(p.id));

      const consignorSales = sales.filter((s) =>
        consignorProducts.some((p) => p.id === s.product_id)
      );

      const totalRevenue = consignorSales.reduce((sum, sale) => sum + Number(sale.sale_price), 0);
      const commissionOwed =
        totalRevenue * (consignor.commission_rate / 100) -
        consignorSales
          .filter((s) => s.consignor_paid)
          .reduce((sum, sale) => sum + Number(sale.sale_price) * (consignor.commission_rate / 100), 0);

      return {
        consignor,
        totalProducts: consignorProducts.length,
        availableProducts: consignorProducts.filter((p) => p.status === 'available').length,
        soldProducts: soldProducts.length,
        totalSales: consignorSales.length,
        totalRevenue,
        commissionOwed,
      };
    });

    setStats(consignorStats);
  };

  const filteredStats =
    selectedConsignor === 'all'
      ? stats
      : stats.filter((s) => s.consignor.id === selectedConsignor);

  const totalStats = {
    totalProducts: stats.reduce((sum, s) => sum + s.totalProducts, 0),
    totalSales: stats.reduce((sum, s) => sum + s.totalSales, 0),
    totalRevenue: stats.reduce((sum, s) => sum + s.totalRevenue, 0),
    totalCommissionOwed: stats.reduce((sum, s) => sum + s.commissionOwed, 0),
  };

  if (loading) {
    return <div className="text-center py-12">Loading reports...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-normal tracking-[0.08em]">CONSIGNOR REPORTS & ANALYTICS</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 border-2 border-gray-300">
          <div className="flex items-center justify-between mb-2">
            <Package className="w-8 h-8 text-gray-600" />
            <span className="text-3xl font-medium">{totalStats.totalProducts}</span>
          </div>
          <p className="text-sm tracking-[0.06em] text-gray-600">TOTAL PRODUCTS</p>
        </div>

        <div className="bg-white p-6 border-2 border-green-500">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 text-green-600" />
            <span className="text-3xl font-medium">{totalStats.totalSales}</span>
          </div>
          <p className="text-sm tracking-[0.06em] text-gray-600">TOTAL SALES</p>
        </div>

        <div className="bg-white p-6 border-2 border-blue-500">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-medium">${totalStats.totalRevenue.toLocaleString()}</span>
          </div>
          <p className="text-sm tracking-[0.06em] text-gray-600">TOTAL REVENUE</p>
        </div>

        <div className="bg-white p-6 border-2 border-yellow-500">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-8 h-8 text-yellow-600" />
            <span className="text-2xl font-medium">
              ${totalStats.totalCommissionOwed.toLocaleString()}
            </span>
          </div>
          <p className="text-sm tracking-[0.06em] text-gray-600">COMMISSION OWED</p>
        </div>
      </div>

      <div className="mb-6">
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
              <th className="font-calibri px-4 py-3 text-left text-sm font-medium tracking-[0.04em]">CODE</th>
              <th className="font-calibri px-4 py-3 text-left text-sm font-medium tracking-[0.04em]">NAME</th>
              <th className="font-calibri px-4 py-3 text-left text-sm font-medium tracking-[0.04em]">
                COMMISSION RATE
              </th>
              <th className="font-calibri px-4 py-3 text-left text-sm font-medium tracking-[0.04em]">
                TOTAL PRODUCTS
              </th>
              <th className="font-calibri px-4 py-3 text-left text-sm font-medium tracking-[0.04em]">AVAILABLE</th>
              <th className="font-calibri px-4 py-3 text-left text-sm font-medium tracking-[0.04em]">SOLD</th>
              <th className="font-calibri px-4 py-3 text-left text-sm font-medium tracking-[0.04em]">
                TOTAL REVENUE
              </th>
              <th className="font-calibri px-4 py-3 text-left text-sm font-medium tracking-[0.04em]">
                COMMISSION OWED
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredStats.map((stat) => (
              <tr key={stat.consignor.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="font-calibri px-4 py-3 text-sm font-medium">{stat.consignor.consignor_code}</td>
                <td className="font-calibri px-4 py-3 text-sm">
                  {stat.consignor.first_name} {stat.consignor.last_name}
                </td>
                <td className="font-calibri px-4 py-3 text-sm">{stat.consignor.commission_rate}%</td>
                <td className="font-calibri px-4 py-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    <span>{stat.totalProducts}</span>
                  </div>
                </td>
                <td className="font-calibri px-4 py-3 text-sm">{stat.availableProducts}</td>
                <td className="font-calibri px-4 py-3 text-sm">{stat.soldProducts}</td>
                <td className="font-calibri px-4 py-3 text-sm font-medium">
                  ${stat.totalRevenue.toLocaleString()}
                </td>
                <td className="font-calibri px-4 py-3 text-sm">
                  <span
                    className={`px-2 py-1 text-xs font-medium tracking-[0.06em] ${
                      stat.commissionOwed > 0
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    ${stat.commissionOwed.toLocaleString()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredStats.length === 0 && (
        <div className="text-center py-12 text-gray-600">No consignor data available.</div>
      )}
    </div>
  );
}
