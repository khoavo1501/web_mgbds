import { mockLeads } from "../../utils/mockData";
import Badge from "../../components/Badge";
import Button from "../../components/Button";

export default function LeadManagement() {
  const getStatusColor = (status) => {
    switch (status) {
      case "New": return "info";
      case "Contacted": return "pending";
      case "Qualified": return "success";
      default: return "info";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Lead Management</h1>
        <Button>Add New Lead</Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Property Interest</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {mockLeads.map((lead) => (
              <tr key={lead.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{lead.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{lead.phone}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{lead.property}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  <Badge status={getStatusColor(lead.status)}>{lead.status}</Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-slate-600 hover:text-red-600 mr-3">Update</button>
                  <button className="text-slate-600 hover:text-red-600">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
