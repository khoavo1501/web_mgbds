import { useState } from "react";
import { mockTransactions } from "../../utils/mockData";
import Badge from "../../components/Badge";

export default function FinancialManagement() {
  const [activeTab, setActiveTab] = useState("deposits");
  
  const deposits = mockTransactions;
  // Mock commissions data
  const commissions = [
    { id: 1, broker: "Jane Smith", property: "Luxury Villa", amount: 135000, status: "Pending" },
    { id: 2, broker: "Michael Johnson", property: "Downtown Penthouse", amount: 85500, status: "Paid" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Financial Management</h1>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("deposits")}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "deposits"
                ? "border-red-500 text-red-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-gray-300"
            }`}
          >
            Pending Deposits
          </button>
          <button
            onClick={() => setActiveTab("commissions")}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "commissions"
                ? "border-red-500 text-red-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-gray-300"
            }`}
          >
            Broker Commissions
          </button>
        </nav>
      </div>

      {/* Deposits Tab */}
      {activeTab === "deposits" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Txn ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {deposits.map((txn) => (
                <tr key={txn.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{txn.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{txn.customer}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-800">${txn.amount.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    <Badge status={txn.status === 'Completed' ? 'success' : txn.status === 'Pending' ? 'pending' : 'info'}>
                      {txn.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {txn.status !== 'Completed' && (
                      <button className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded">Confirm Payment</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Commissions Tab */}
      {activeTab === "commissions" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Broker</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Property</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Commission</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {commissions.map((comm) => (
                <tr key={comm.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{comm.broker}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{comm.property}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-800">${comm.amount.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    <Badge status={comm.status === 'Paid' ? 'success' : 'pending'}>
                      {comm.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {comm.status === 'Pending' && (
                      <button className="text-green-600 hover:text-green-900 bg-green-50 px-3 py-1 rounded">Mark as Paid</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
