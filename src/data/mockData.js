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
    title: 'Bracatinga Honey (500g)',
    category: 'Products',
    provider: 'Ipe Farm', type: 'Product', acceptedPayments: ['fiat', 'crypto', 'trade'], price: '$12',
    description: '100% pure Bracatinga honeydew from our local sanctuary.',
    isPublic: true,
    coordinates: { lat: -27.4428, lng: -48.5068 },
    nodeName: 'ipe-farm-node',
    image: 'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?auto=format&fit=crop&q=80&w=400&h=300'
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
    title: 'Used iPhone 11',
    category: 'Donations',
    provider: 'Tech Donation Hub', type: 'Donation', acceptedPayments: ['free'], price: 'Free',
    description: 'Working iPhone 11 with 82% battery health. Donating to someone in need.',
    isPublic: true,
    coordinates: { lat: -27.4405, lng: -48.5050 },
    nodeName: 'tech-hub',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=400&h=300'
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
    title: 'Winter Clothes Bundle',
    category: 'Donations',
    provider: 'Community Wardrobe', type: 'Donation', acceptedPayments: ['free'], price: 'Free',
    description: 'Jackets, sweaters, and scarves in good condition. Size M/L.',
    isPublic: true,
    coordinates: { lat: -27.4400, lng: -48.5100 },
    nodeName: 'wardrobe-node',
    image: 'https://images.unsplash.com/photo-1520006403909-838d6b92c22e?auto=format&fit=crop&q=80&w=400&h=300'
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
    image: 'https://images.unsplash.com/photo-1598910839951-bdfc9d2f2d93?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'l29',
    title: 'Beehive Construction',
    category: 'Knowledge',
    provider: 'Joao from Ipe Farm', type: 'Service', acceptedPayments: ['trade', 'crypto'], price: 'Trade / 20 USDC',
    citizenTier: 'Steward', ipeRep: 92,
    description: 'Learn how to keep bees and manage stingless native bees. In exchange, I need help building bee boxes.',
    isPublic: true,
    coordinates: { lat: -27.4442, lng: -48.5015 },
    nodeName: 'Apiary',
    image: 'https://images.unsplash.com/photo-1552528172-e1bc14eb581e?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'l30',
    title: 'Woodworking Workshop',
    category: 'Knowledge',
    provider: 'WoodCraft', type: 'Service', acceptedPayments: ['fiat', 'trade'], price: '$15/lesson',
    citizenTier: 'Resident', ipeRep: 75,
    description: 'Practical lessons on manual woodworking. Build your own furniture.',
    isPublic: true,
    coordinates: { lat: -27.4450, lng: -48.5080 },
    nodeName: 'workshop-node',
    image: 'https://images.unsplash.com/photo-1540314227222-2daee298072c?auto=format&fit=crop&q=80&w=400&h=300'
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
  },
  // --- NEW MOCK DATA ---
  // Real Estate
  {
    id: 'l33',
    title: 'Dedicated Desk at Founder Haus',
    category: 'Real Estate',
    provider: 'Founder Haus', type: 'Service', acceptedPayments: ['crypto', 'fiat'], price: '$200/month',
    description: '24/7 access to our co-working space. High-speed internet, meeting rooms, and coffee included.',
    isPublic: true,
    coordinates: { lat: -27.43890, lng: -48.49985 },
    nodeName: 'founder-haus',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'l34',
    title: 'Beachfront Studio (Short-term)',
    category: 'Real Estate',
    provider: 'Carlos M.', type: 'Service', acceptedPayments: ['fiat', 'crypto'], price: '$80/night',
    description: 'Cozy studio directly facing Jurerê beach. Fully furnished, perfect for digital nomads.',
    isPublic: true,
    coordinates: { lat: -27.4360, lng: -48.5020 },
    nodeName: 'studio-beach',
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=400&h=300'
  },
  // Vehicles
  {
    id: 'l35',
    title: 'Xiaomi Electric Scooter Pro 2',
    category: 'Vehicles',
    provider: 'Tech Rent', type: 'Product', acceptedPayments: ['fiat', 'crypto'], price: '$350',
    description: 'Used for 6 months. Great condition, 45km range. Includes charger and helmet.',
    isPublic: true,
    coordinates: { lat: -27.4405, lng: -48.5080 },
    nodeName: 'scooter-hub',
    image: 'https://images.unsplash.com/photo-1593955675402-1b154a86f7b1?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'l36',
    title: 'Honda PCX 150 - 2022',
    category: 'Vehicles',
    provider: 'Moto Jurere', type: 'Product', acceptedPayments: ['fiat'], price: '$2,800',
    description: 'Automatic scooter, 8,000km. Perfect for moving around the city. Documentation up to date.',
    isPublic: true,
    coordinates: { lat: -27.4420, lng: -48.4960 },
    nodeName: 'moto-jurere',
    image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=400&h=300'
  },
  // Food & Drink
  {
    id: 'l37',
    title: 'Organic Veggie Box (Weekly)',
    category: 'Food & Drink',
    provider: 'Green Roots', type: 'Product', acceptedPayments: ['fiat', 'trade'], price: '$25/week',
    description: 'Seasonal organic vegetables and greens from our urban farm delivered to your door.',
    isPublic: true,
    coordinates: { lat: -27.4460, lng: -48.5060 },
    nodeName: 'green-roots-farm',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'l38',
    title: 'Ipê Craft IPA - 6 Pack',
    category: 'Food & Drink',
    provider: 'Brewery Jurerê', type: 'Product', acceptedPayments: ['crypto', 'fiat'], price: '$18',
    description: 'Local craft IPA brewed with native Brazilian hops. Support local brewing!',
    isPublic: true,
    coordinates: { lat: -27.4445, lng: -48.5015 },
    nodeName: 'brewery-jurere',
    image: 'https://images.unsplash.com/photo-1614316784845-f938fae8fcbc?auto=format&fit=crop&q=80&w=400&h=300'
  },
  // Events
  {
    id: 'l39',
    title: 'Beach Cleanup & Sunset Yoga',
    category: 'Events',
    provider: 'Community Hub', type: 'Service', acceptedPayments: ['free'], price: 'Free',
    description: 'Join us for a 1-hour beach cleanup followed by a sunset yoga session. Bring your own mat!',
    isPublic: true,
    coordinates: { lat: -27.4350, lng: -48.5000 },
    nodeName: 'beach-yoga',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'l40',
    title: 'Web3 Builders Hackathon',
    category: 'Events',
    provider: 'AI Haus', type: 'Service', acceptedPayments: ['crypto', 'fiat'], price: '$15 (Catering)',
    description: 'Weekend hackathon focusing on local DAO governance and smart contracts. Food and drinks included.',
    isPublic: true,
    coordinates: { lat: -27.43747, lng: -48.50342 },
    nodeName: 'ai-haus',
    image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=400&h=300'
  },
  // Jobs
  {
    id: 'l41',
    title: 'Senior React Native Dev',
    category: 'Jobs',
    provider: 'Ipê Tech', type: 'Service', acceptedPayments: ['crypto'], price: '5,000 USDC/mo',
    description: 'Looking for an experienced RN developer to help build the mobile version of IpêXchange. Remote OK.',
    isPublic: true,
    coordinates: { lat: -27.44130, lng: -48.50540 },
    nodeName: 'ipe-tech',
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'l42',
    title: 'Part-time Barista',
    category: 'Jobs',
    provider: 'Ipê Bakery', type: 'Service', acceptedPayments: ['fiat'], price: '$12/hour',
    description: 'We are looking for a friendly barista for the morning shift (7 AM - 12 PM). Experience preferred but not required.',
    isPublic: true,
    coordinates: { lat: -27.44580, lng: -48.50100 },
    nodeName: 'ipe-bakery',
    image: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=400&h=300'
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
export const MOCK_GRANTS = [
  {
    id: 'g1',
    title: 'Artizen: Bio-Regenerative Hub',
    provider: 'Artizen Fund',
    type: 'Grant',
    description: 'Funding for projects creating decentralized regenerative infrastructure in local communities.',
    amount: '$5,000',
    deadline: 'May 15, 2026',
    image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=600&h=400',
    tags: ['Ecology', 'DAO'],
    url: 'https://artizen.fund/grant/regeneration'
  },
  {
    id: 'g2',
    title: 'Ipê City Culture Fund',
    provider: 'Ipê Council',
    type: 'Grant',
    description: 'Support for local artists and cultural events that strengthen community identity.',
    amount: '2,500 RBTC',
    deadline: 'June 1, 2026',
    image: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&q=80&w=600&h=400',
    tags: ['Art', 'Community'],
    url: 'https://ipe.city/culture-fund'
  }
];

export const MOCK_LOANS = [
  {
    id: 'loan1',
    title: 'Expansion: Artisan Sourdough',
    provider: 'Bread & Co · marina.ipecity.eth',
    type: 'Loan Request',
    description: 'We need to purchase a larger stone oven to meet the increasing demand for our local bread. Loan backed by 2-year revenue track record.',
    amount: '$1,200',
    repayment: '10 months @ 5%',
    collateral: 'Business Assets + Rep Score 98',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400&h=300',
    funded: 45,
  },
  {
    id: 'loan2',
    title: 'Eco-Sensor Node Inventory',
    provider: 'Jurere Climate · lucas.ipecity.eth',
    type: 'Loan Request',
    description: 'Purchasing 20 new air quality sensors to expand our monitoring network across the South Sector. No-interest community loan.',
    amount: '500 USDC',
    repayment: '3 months @ 0%',
    collateral: 'Data Revenue Streams',
    image: 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?auto=format&fit=crop&q=80&w=400&h=300',
    funded: 80,
  },
  {
    id: 'loan3',
    title: 'Solar Panel Installation — AI Haus',
    provider: 'AI Haus · bia.ipecity.eth',
    type: 'Loan Request',
    description: 'Funding 24 rooftop solar panels for the AI Haus co-working space. Projected energy savings will cover 100% of loan within 18 months.',
    amount: '$8,400',
    repayment: '18 months @ 3.2%',
    collateral: 'Real Estate NFT (AI Haus)',
    image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=400&h=300',
    funded: 62,
  },
  {
    id: 'loan4',
    title: 'Mobile Photography Studio Kit',
    provider: 'Luna Foto · luna.ipecity.eth',
    type: 'Loan Request',
    description: 'Professional lighting equipment and a new mirrorless camera body to expand wedding and event photography services.',
    amount: '$3,100',
    repayment: '8 months @ 4%',
    collateral: 'Reputation Score 91 + Active Contracts',
    image: 'https://images.unsplash.com/photo-1452780212940-6f5c0d14d848?auto=format&fit=crop&q=80&w=400&h=300',
    funded: 28,
  },
  {
    id: 'loan5',
    title: 'Kayak & Trail Gear Expansion',
    provider: 'TrailCo · trailco.ipecity.eth',
    type: 'Loan Request',
    description: 'Adding 4 new sea kayaks and 2 canoes to meet peak-season demand. Revenue from rentals projected to repay in full within 6 months.',
    amount: '$5,600',
    repayment: '6 months @ 2.5%',
    collateral: 'Equipment NFT + Business Revenue',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&q=80&w=400&h=300',
    funded: 91,
  },
  {
    id: 'loan6',
    title: 'Permaculture Design Tools & Seeds',
    provider: 'Green Roots · green.ipecity.eth',
    type: 'Loan Request',
    description: 'Purchasing specialized equipment and seed inventory for the upcoming urban farming cohort in Ipê City. Impact-first, zero-interest.',
    amount: '$900',
    repayment: '5 months @ 0%',
    collateral: 'Community Vouched (Rep Score 88)',
    image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&q=80&w=400&h=300',
    funded: 55,
  },
];
