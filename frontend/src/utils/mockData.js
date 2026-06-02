export const mockProperties = [
  {
    id: 1,
    title: "Luxury Villa with Ocean View",
    location: "123 Coastal Drive, Malibu, CA",
    price: 4500000,
    beds: 5,
    baths: 6,
    sqft: 5200,
    status: "published",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    type: "Villa",
    description: "Experience unparalleled luxury in this stunning coastal villa featuring panoramic ocean views, private beach access, and state-of-the-art amenities. The expansive open-concept living area flows seamlessly into the outdoor entertainment space.",
    broker: {
      name: "Jane Smith",
      phone: "+1 (555) 123-4567",
      email: "jane.smith@primeestate.com"
    }
  },
  {
    id: 2,
    title: "Modern Downtown Penthouse",
    location: "456 Skyline Blvd, New York, NY",
    price: 2850000,
    beds: 3,
    baths: 3.5,
    sqft: 2800,
    status: "Pending",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    type: "Apartment",
    description: "Sleek and sophisticated penthouse in the heart of the city. Floor-to-ceiling windows offer breathtaking skyline views. Features include a private elevator, chef's kitchen, and a wraparound terrace.",
    broker: {
      name: "Michael Johnson",
      phone: "+1 (555) 987-6543",
      email: "michael.j@primeestate.com"
    }
  },
  {
    id: 3,
    title: "Suburban Family Home",
    location: "789 Maple Street, Austin, TX",
    price: 850000,
    beds: 4,
    baths: 2.5,
    sqft: 3100,
    status: "published",
    image: "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    type: "House",
    description: "Beautifully updated family home in a highly sought-after neighborhood. Features a spacious backyard with a pool, open kitchen, and a master suite with a walk-in closet.",
    broker: {
      name: "Sarah Davis",
      phone: "+1 (555) 456-7890",
      email: "sarah.d@primeestate.com"
    }
  }
];

export const mockLeads = [
  { id: 1, name: "Alice Cooper", phone: "555-0101", property: "Luxury Villa", status: "New" },
  { id: 2, name: "Bob Martin", phone: "555-0202", property: "Downtown Penthouse", status: "Contacted" },
  { id: 3, name: "Charlie Day", phone: "555-0303", property: "Suburban Family Home", status: "Qualified" },
];

export const mockTransactions = [
  { id: "TXN-001", customer: "Alice Cooper", property: "Luxury Villa", amount: 45000, date: "2026-05-01", status: "Completed" },
  { id: "TXN-002", customer: "Bob Martin", property: "Downtown Penthouse", amount: 28500, date: "2026-05-05", status: "Pending" },
  { id: "TXN-003", customer: "Charlie Day", property: "Suburban Family Home", amount: 8500, date: "2026-05-08", status: "Processing" },
];

export const mockAppointments = [
  { id: 1, date: "2026-05-12", time: "10:00 AM", customer: "Alice Cooper", property: "Luxury Villa", status: "Confirmed" },
  { id: 2, date: "2026-05-14", time: "02:00 PM", customer: "Bob Martin", property: "Downtown Penthouse", status: "Pending" },
];
