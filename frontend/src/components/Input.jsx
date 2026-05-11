export default function Input({ label, error, className = '', ...props }) {
  return (
    <div className={`flex flex-col mb-4 ${className}`}>
      {label && <label className="mb-1 text-sm font-medium text-slate-700">{label}</label>}
      <input 
        className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 
        ${error ? 'border-red-500' : 'border-gray-300'}`}
        {...props}
      />
      {error && <span className="text-xs text-red-600 mt-1">{error}</span>}
    </div>
  );
}
