import Input from "../../components/Input";
import Button from "../../components/Button";

export default function CreateTransaction() {
  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Transaction created successfully!");
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Create Deposit Transaction</h1>
      
      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-lg shadow-sm border border-gray-200">
        
        {/* Customer Info */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Customer Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Customer Name" required placeholder="Alice Cooper" />
            <Input label="Phone Number" required placeholder="555-0101" />
            <Input label="Email Address" type="email" placeholder="alice@example.com" />
            <Input label="ID / Passport Number" required placeholder="123456789" />
          </div>
        </div>

        {/* Property Info */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Property Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-1 md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Select Property</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500">
                <option value="">-- Choose Property --</option>
                <option value="1">Luxury Villa with Ocean View</option>
                <option value="2">Modern Downtown Penthouse</option>
                <option value="3">Suburban Family Home</option>
              </select>
            </div>
            <Input label="Agreed Price" type="number" required placeholder="$" />
            <Input label="Expected Closing Date" type="date" required />
          </div>
        </div>

        {/* Financial Info */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Financial Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Deposit Amount" type="number" required placeholder="$" />
            <div className="col-span-1 md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Payment Method</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500">
                <option value="bank_transfer">Bank Transfer</option>
                <option value="credit_card">Credit Card</option>
                <option value="cash">Cash</option>
              </select>
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Additional Notes</label>
              <textarea 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                rows="3"
                placeholder="Any special terms or conditions..."
              ></textarea>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
          <Button variant="outline" type="button">Cancel</Button>
          <Button type="submit">Create Transaction</Button>
        </div>
      </form>
    </div>
  );
}
