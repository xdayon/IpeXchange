export const mockListings = [
  {
    id: 'l1',
    title: 'Macbook Pro M1 14"',
    category: 'Products',
    provider: 'Alex M.', type: 'Product', acceptedPayments: ['fiat', 'crypto'], price: '$1,200',
    description: '16GB RAM, 512GB SSD. Used for 1 year. Battery at 92%. Excellent condition.',
    isPublic: true,
    coordinates: { lat: -27.4420, lng: -48.5060 },
    nodeName: 'alex-node-01',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'l2',
    title: 'Website Development',
    category: 'Services',
    provider: 'Bia Tech', type: 'Service', acceptedPayments: ['crypto', 'trade'], price: 'From $500',
    description: 'Landing pages, stores, and React apps. I accept RBTC and trade for electronics.',
    isPublic: true,
    coordinates: { lat: -27.4410, lng: -48.5050 },
    nodeName: 'bia-dev-node',
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'l3',
    title: 'Organic Honey (500g)',
    category: 'Products',
    provider: 'Ipe Farm', type: 'Product', acceptedPayments: ['fiat', 'crypto', 'trade'], price: '$12',
    description: '100% pure wildflower honey from our local sanctuary.',
    isPublic: true,
    coordinates: { lat: -27.4428, lng: -48.5068 },
    nodeName: 'ipe-farm-node',
    image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'l4',
    title: 'Yoga at the Park',
    category: 'Services',
    provider: 'FitJurere', type: 'Service', acceptedPayments: ['fiat', 'crypto'], price: '$15/hour',
    description: 'Morning yoga sessions at Central Plaza. All levels welcome.',
    isPublic: true,
    coordinates: { lat: -27.4435, lng: -48.5055 },
    nodeName: 'wellness-node',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'l5',
    title: 'Artisan Coffee Beans',
    category: 'Products',
    provider: 'CoffeeLab Jurere', type: 'Product', acceptedPayments: ['fiat', 'crypto', 'trade'], price: '$9/pack',
    description: 'Small-batch roasted coffee from local high-altitude cooperatives.',
    isPublic: true,
    coordinates: { lat: -27.4415, lng: -48.5075 },
    nodeName: 'coffee-hub',
    image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'l6',
    title: 'Smart Home Setup',
    category: 'Services',
    provider: 'AI Haus', type: 'Service', acceptedPayments: ['crypto', 'trade'], price: '$50/setup',
    description: 'Integration of IoT devices with local voice control via Core.',
    isPublic: true,
    coordinates: { lat: -27.4410, lng: -48.5060 },
    nodeName: 'aihaus-main-node',
    image: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'l7',
    title: 'Climate Data Analysis',
    category: 'Services',
    provider: 'Jurere Climate', type: 'Service', acceptedPayments: ['fiat'], price: '$30',
    description: 'Environmental impact reports for local constructions and gardens.',
    isPublic: true,
    coordinates: { lat: -27.4445, lng: -48.5085 },
    nodeName: 'eco-sensor-node',
    image: 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'l20',
    title: 'Legal Advice: DAO Gov',
    category: 'Services',
    provider: 'Ipe Law', type: 'Service', acceptedPayments: ['fiat', 'crypto'], price: 'From 100 USDC',
    description: 'Consultation on bylaws and digital governance for local hubs.',
    isPublic: true,
    coordinates: { lat: -27.4425, lng: -48.5045 },
    nodeName: 'legal-node',
    image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'l22',
    title: 'Projector Rental',
    category: 'Products',
    provider: 'CineRent Jurere', type: 'Product', acceptedPayments: ['fiat', 'crypto'], price: '$30/day',
    description: '4K laser projector for outdoor cinema nights. Screen included.',
    isPublic: true,
    coordinates: { lat: -27.4418, lng: -48.5092 },
    nodeName: 'media-node',
    image: 'https://images.unsplash.com/photo-1535016120720-40c646bebbfc?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'l23',
    title: 'Book: Regenerative Design',
    category: 'Donations',
    provider: 'Ipe Library', type: 'Donation', acceptedPayments: ['free'], price: 'Free',
    description: 'Physical book by Bill Reed. Free for residents.',
    isPublic: true,
    coordinates: { lat: -27.4405, lng: -48.5050 },
    nodeName: 'community-shelf',
    image: 'https://images.unsplash.com/photo-1544640808-32ca72ac7f37?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'l25',
    title: 'Native Tree Seedlings',
    category: 'Products',
    provider: 'Green Jurere', type: 'Product', acceptedPayments: ['trade', 'crypto'], price: '$3',
    description: 'Ipe, pitanga, and araca seedlings. Homegrown.',
    isPublic: true,
    coordinates: { lat: -27.4452, lng: -48.5038 },
    nodeName: 'garden-node',
    image: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'l27',
    title: 'Jurere Running Group',
    category: 'Donations',
    provider: 'Private Citizen', type: 'Donation', acceptedPayments: ['free'], price: 'Free',
    description: 'Meet at 6am on the beach. All levels.',
    isPublic: true,
    coordinates: { lat: -27.4400, lng: -48.5100 },
    nodeName: 'social-node',
    image: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'l28',
    title: 'Cello Lessons',
    category: 'Services',
    provider: 'Music & Co', type: 'Service', acceptedPayments: ['fiat', 'trade'], price: '$15/hour',
    description: 'Beginner and intermediate classes. I have an extra cello.',
    isPublic: true,
    coordinates: { lat: -27.4430, lng: -48.5080 },
    nodeName: 'art-node',
    image: 'https://images.unsplash.com/photo-1620921447048-2ce10332f1ea?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'l29',
    title: 'Beehive Construction',
    category: 'Knowledge',
    provider: 'Joao from Ipe Farm', type: 'Service', acceptedPayments: ['trade', 'crypto'], price: 'Trade / 20 USDC',
    citizenTier: 'Steward', veritasRep: 92,
    description: 'Learn how to keep bees and manage stingless native bees. In exchange, I need help building bee boxes.',
    isPublic: true,
    coordinates: { lat: -27.4442, lng: -48.5015 },
    nodeName: 'Apiary',
    image: 'https://images.unsplash.com/photo-1587049352851-8d4e89134a41?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'l30',
    title: 'Woodworking Workshop',
    category: 'Knowledge',
    provider: 'WoodCraft', type: 'Service', acceptedPayments: ['fiat', 'trade'], price: '$15/lesson',
    citizenTier: 'Resident', veritasRep: 75,
    description: 'Practical lessons on manual woodworking. Build your own furniture.',
    isPublic: true,
    coordinates: { lat: -27.4450, lng: -48.5080 },
    nodeName: 'workshop-node',
    image: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'l31',
    title: 'Oggi B.W 8.0 E-Bike',
    category: 'Products',
    provider: 'Marina G.', type: 'Product', acceptedPayments: ['fiat', 'crypto'], price: '$850',
    description: 'Used electric bike, very well maintained. Perfect for commuting around Jurere.',
    isPublic: true,
    coordinates: { lat: -27.4412, lng: -48.5042 },
    nodeName: 'marina-garage',
    image: 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'l32',
    title: 'Artisan Sourdough Bakery',
    category: 'Products',
    provider: 'Bread & Co', type: 'Product', acceptedPayments: ['fiat', 'trade'], price: '$5/loaf',
    description: 'Freshly baked sourdough bread every morning. We accept trades for fresh produce.',
    isPublic: true,
    coordinates: { lat: -27.4433, lng: -48.5022 },
    nodeName: 'bakery-hub',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400&h=300'
  }
];

export const mockDemands = [
  { 
    id: 'd1', 
    title: 'Local eggs', 
    category: 'Products', 
    urgency: 'High', 
    tags: ['Food', 'Daily'],
    description: 'Our community fridge is completely out of local eggs. We have several residents looking for daily fresh free-range eggs. Ideal for anyone running a small backyard coop! Guaranteed buyers in the neighborhood.'
  },
  { 
    id: 'd2', 
    title: 'Carpenter', 
    category: 'Services', 
    urgency: 'Medium', 
    tags: ['Maintenance', 'Woodwork'],
    description: 'We need skilled carpenters to help repair the community center roof and benches at the central square. Must have own tools. Payment can be negotiated in USDC or Ipê tokens via smart contract.'
  },
  { 
    id: 'd3', 
    title: 'Solar panel repair', 
    category: 'Services', 
    urgency: 'High', 
    tags: ['Energy', 'Tech'],
    description: 'Following the recent storm, three houses in the north sector reported issues with their solar inverters. We desperately need a certified technician to perform safety checks and repairs ASAP to restore the micro-grid.'
  },
  { 
    id: 'd4', 
    title: 'Organic compost', 
    category: 'Products', 
    urgency: 'Low', 
    tags: ['Garden', 'Sustainable'],
    description: 'The community garden is preparing for the spring planting season and needs bulk organic compost. Looking for up to 500kg. Willing to trade fresh produce for compost or pay in local tokens.'
  },
];
