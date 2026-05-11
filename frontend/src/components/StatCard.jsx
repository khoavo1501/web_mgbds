export default function StatCard({ title, value, icon: Icon, trend }) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h4 className="text-2xl font-bold text-slate-800">{value}</h4>
        {trend && (
          <p className={`text-sm mt-2 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend > 0 ? '+' : ''}{trend}% from last month
          </p>
        )}
      </div>
      <div className="bg-red-50 p-3 rounded-full">
        {Icon && <Icon className="h-6 w-6 text-red-600" />}
      </div>
    </div>
  );
}
