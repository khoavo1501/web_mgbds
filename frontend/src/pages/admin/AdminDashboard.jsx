import { useState, useEffect } from "react";
import { Building2, FileText, Wallet } from "lucide-react";
import StatCard from "../../components/StatCard";
import { mockTransactions } from "../../utils/mockData";
import Badge from "../../components/Badge";
import api from "../../services/api";

export default function AdminDashboard() {
  const [pendingProperties, setPendingProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const recentTransactions = mockTransactions.slice(0, 3);

  useEffect(() => {
    const fetchPendingProperties = async () => {
      try {
        const response = await api.get('/properties?status=Pending');
        if (response.data.success) {
          setPendingProperties(response.data.data.content || []);
        }
      } catch (error) {
        console.error("Failed to fetch pending properties", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPendingProperties();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Admin Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Total Properties" value="1,245" trend={8} icon={Building2} />
        <StatCard title="Active Transactions" value="156" trend={12} icon={FileText} />
        <StatCard title="Revenue (Month)" value="$4.2M" trend={24} icon={Wallet} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Properties Pending Approval */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-800">Properties Pending Approval</h2>
            <button className="text-sm font-medium text-red-600 hover:text-red-700">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Property</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Broker</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="3" className="px-4 py-4 text-center">
                      <div className="flex justify-center items-center py-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : pendingProperties.length > 0 ? (
                  pendingProperties.map((prop) => (
                    <tr key={prop.id}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">{prop.title}</div>
                        <div className="text-xs text-slate-500">${prop.price.toLocaleString()}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">{prop.broker?.name || 'N/A'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                        <button className="text-green-600 hover:text-green-800 mr-2 font-medium">Approve</button>
                        <button className="text-red-600 hover:text-red-800 font-medium">Reject</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="px-4 py-4 text-center text-sm text-slate-500">
                      No pending properties.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-800">Recent Transactions</h2>
            <button className="text-sm font-medium text-red-600 hover:text-red-700">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">ID</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Amount</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentTransactions.map((txn) => (
                  <tr key={txn.id}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{txn.id}</div>
                      <div className="text-xs text-slate-500">{txn.date}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-slate-700">
                      ${txn.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge status={
                        txn.status === 'Completed' ? 'success' : 
                        txn.status === 'Pending' ? 'pending' : 'info'
                      }>
                        {txn.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
