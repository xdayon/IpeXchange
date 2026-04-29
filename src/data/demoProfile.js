// src/data/demoProfile.js

export const DEMO_USER = {
  id: 'demo-jean-hansen-001',
  wallet_address: '0x73a4f8b2E9cD1F3a5B7c2d8E4f0A6b3C9e1D2f5A',
  display_name: 'Jean Hansen',
  email: null,
  privy_id: 'demo-privy-jean',
  ipe_rep_score: 99,
  rep_score: 99,
  total_tx: 47,
  listing_count: 12,
  purchase_count: 31,
  sales_count: 16,
  created_at: '2023-06-01T10:00:00Z',
  last_seen: new Date().toISOString(),
  bio: 'Co-founder of Ipê City. Web3 builder, circular economy advocate, and full-stack developer. Trading inside community economies since 2018. Here to trade code for wellness, knowledge for tools, and build the city from the inside out.',
  badges: [
    { id: 'founder',     label: 'City Co-Founder',   color: '#F59E0B', icon: '🏛️' },
    { id: 'earlytrader', label: 'Early Trader',       color: '#B4F44A', icon: '🌱' },
    { id: 'toptrader',   label: 'Top Trader 2024',    color: '#38BDF8', icon: '🏆' },
    { id: 'zkpioneer',   label: 'ZK Pioneer',         color: '#818CF8', icon: '🔐' },
    { id: 'multihop',    label: 'Multi-Hop Master',   color: '#F472B6', icon: '🔄' },
  ],
  web_of_trust: [
    { name: 'Layla M.',  wallet: '0xA1b2...C3d4', rep: 91, relation: 'Direct trade partner' },
    { name: 'Tomás R.',  wallet: '0xE5f6...G7h8', rep: 87, relation: '3 completed swaps'    },
    { name: 'Sun Wei',   wallet: '0xI9j0...K1l2', rep: 95, relation: 'Knowledge exchange'   },
    { name: 'Priya K.',  wallet: '0xM3n4...O5p6', rep: 78, relation: 'Service provider'     },
    { name: 'Carlos A.', wallet: '0xQ7r8...S9t0', rep: 83, relation: 'Co-listed product'    },
  ],
};

export const DEMO_LISTINGS = [
  { id: 'jl1',  title: 'Full-Stack Web3 Development',         category: 'Services',   type: 'Service',  acceptedPayments: ['fiat','crypto','trade'], price: '$120/day',    description: 'React, Node, Solidity, Supabase. 18 on-chain projects delivered. Available for 2-week sprints.',                            isPublic: true,  status: 'active',  views: 284, inquiries: 17, image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=400&h=300', createdAt: new Date(Date.now()-86400000*60).toISOString() },
  { id: 'jl2',  title: 'Circular Economy Workshop (3h)',       category: 'Knowledge',  type: 'Service',  acceptedPayments: ['fiat','trade','ipe'],    price: '$45/person',  description: 'Barter networks, multi-hop trades, local currency design. Saturdays at AI Haus.',                                        isPublic: true,  status: 'active',  views: 156, inquiries: 9,  image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=400&h=300', createdAt: new Date(Date.now()-86400000*45).toISOString() },
  { id: 'jl3',  title: 'MacBook Pro M2 14" (2023)',            category: 'Products',   type: 'Product',  acceptedPayments: ['crypto','trade'],        price: '$1,600',      description: 'M2 Pro, 16GB RAM, 512GB SSD, Space Gray. Pristine. Trade for high-end camera or audio gear.',                             isPublic: true,  status: 'active',  views: 412, inquiries: 23, image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=400&h=300', createdAt: new Date(Date.now()-86400000*7).toISOString()  },
  { id: 'jl4',  title: 'Smart Contract Security Audit',        category: 'Services',   type: 'Service',  acceptedPayments: ['crypto','ipe'],          price: '$300/contract',description: 'Manual + automated audit. Full report + fix recommendations. 3-day turnaround.',                                       isPublic: true,  status: 'active',  views: 98,  inquiries: 6,  image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=400&h=300', createdAt: new Date(Date.now()-86400000*30).toISOString() },
  { id: 'jl5',  title: 'Permaculture Design Consultation',     category: 'Services',   type: 'Service',  acceptedPayments: ['fiat','trade'],          price: '$60/hour',    description: 'Urban garden and small-farm design. Zone analysis, water harvesting, companion planting.',                                 isPublic: true,  status: 'active',  views: 73,  inquiries: 4,  image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&q=80&w=400&h=300', createdAt: new Date(Date.now()-86400000*20).toISOString() },
  { id: 'jl6',  title: 'Vintage Roland SH-101 Synthesizer',    category: 'Products',   type: 'Product',  acceptedPayments: ['crypto','trade'],        price: '$900',        description: 'Classic analog monosynth, serviced 2022. Will trade for high-end lenses or woodworking tools.',                              isPublic: true,  status: 'active',  views: 201, inquiries: 14, image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=400&h=300', createdAt: new Date(Date.now()-86400000*14).toISOString() },
  { id: 'jl7',  title: 'PT-BR → EN Tech Translation',          category: 'Knowledge',  type: 'Service',  acceptedPayments: ['fiat','ipe'],            price: '$0.08/word',  description: 'Technical docs, whitepapers, smart contract specs. 24h delivery under 2,000 words.',                                      isPublic: true,  status: 'active',  views: 45,  inquiries: 3,  image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=400&h=300', createdAt: new Date(Date.now()-86400000*10).toISOString() },
  { id: 'jl8',  title: 'DJI Mini 3 Pro Drone',                 category: 'Products',   type: 'Product',  acceptedPayments: ['fiat','crypto'],         price: '$650',        description: 'RC controller, 3 batteries, original case. Under 50 flights. Perfect for real estate.',                                  isPublic: true,  status: 'paused',  views: 87,  inquiries: 5,  image: 'https://images.unsplash.com/photo-1507582020474-9a35b7d455d9?auto=format&fit=crop&q=80&w=400&h=300', createdAt: new Date(Date.now()-86400000*3).toISOString()  },
  { id: 'jl9',  title: '1:1 ZK Proof Mentorship',              category: 'Knowledge',  type: 'Service',  acceptedPayments: ['crypto','ipe','trade'],  price: '$80/hour',    description: 'Personal ZKP mentorship: circom circuits, groth16, practical stack. Zoom or in-person at Hub.',                          isPublic: true,  status: 'active',  views: 62,  inquiries: 7,  image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400&h=300', createdAt: new Date(Date.now()-86400000*25).toISOString() },
  { id: 'jl10', title: 'Kombucha Starter Kit + 2L First Batch',category: 'Donations',  type: 'Service',  acceptedPayments: ['trade','ipe'],           price: 'Pay what you want', description: 'SCOBY + 2L first ferment + printed guide. Great for home fermentation starters.',                                  isPublic: true,  status: 'active',  views: 38,  inquiries: 11, image: 'https://images.unsplash.com/photo-1600718374662-0483d2b9da44?auto=format&fit=crop&q=80&w=400&h=300', createdAt: new Date(Date.now()-86400000*5).toISOString()  },
  { id: 'jl11', title: 'Freelance DevOps — CI/CD & Docker',    category: 'Services',   type: 'Service',  acceptedPayments: ['fiat','crypto'],         price: '$90/hour',    description: 'GitHub Actions, Docker Compose, Render/Railway deploys. Full pipeline in one session.',                                  isPublic: false, status: 'paused',  views: 19,  inquiries: 2,  image: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?auto=format&fit=crop&q=80&w=400&h=300', createdAt: new Date(Date.now()-86400000*18).toISOString() },
  { id: 'jl12', title: 'Antique Leica M6 Film Camera',         category: 'Products',   type: 'Product',  acceptedPayments: ['crypto','trade'],        price: '$1,200',      description: 'Leica M6 TTL 0.72 silver chrome + 50mm Summicron f/2. Traded through 4 Ipê citizens.',                                  isPublic: false, status: 'sold',    views: 334, inquiries: 28, image: 'https://images.unsplash.com/photo-1452780212940-6f5c0d14d848?auto=format&fit=crop&q=80&w=400&h=300', createdAt: new Date(Date.now()-86400000*90).toISOString() },
];

export const DEMO_PURCHASES = [
  { id: 'dp1', listing: { id: 'ext1', title: 'Vinyasa Yoga — 10 Class Pack',       provider: 'Sol Studio',       category: 'Services',  type: 'Service',  price: '$120', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=400&h=300', description: 'Flow yoga with Priya K.' },          paymentMethod: 'ipe',    txHash: '0x4a8f2c...e91b', date: new Date(Date.now()-86400000*2).toISOString(),  status: 'confirmed' },
  { id: 'dp2', listing: { id: 'ext2', title: 'Sony WH-1000XM5 Headphones',         provider: 'Layla M.',         category: 'Products',  type: 'Product',  price: '$280', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=400&h=300', description: 'Best-in-class noise cancelling.' }, paymentMethod: 'trade',  txHash: '0x7d3c1a...b44f', date: new Date(Date.now()-86400000*8).toISOString(),  status: 'confirmed' },
  { id: 'dp3', listing: { id: 'ext3', title: 'Deep Tissue Massage (90 min)',        provider: 'Carlos A.',        category: 'Services',  type: 'Service',  price: '$75',  image: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&q=80&w=400&h=300', description: 'Sport and therapeutic massage.' },   paymentMethod: 'crypto', txHash: '0xb29e4d...c11a', date: new Date(Date.now()-86400000*15).toISOString(), status: 'confirmed' },
  { id: 'dp4', listing: { id: 'ext4', title: 'ZK Proofs Crash Course (4h)',         provider: 'Sun Wei',          category: 'Knowledge', type: 'Service',  price: '$160', image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=400&h=300', description: 'Intensive ZKP fundamentals.' },      paymentMethod: 'trade',  txHash: '0xf05c9e...2d87', date: new Date(Date.now()-86400000*21).toISOString(), status: 'confirmed' },
  { id: 'dp5', listing: { id: 'ext5', title: 'Single-Origin Coffee (1 month sub)', provider: 'Terra Café',       category: 'Products',  type: 'Service',  price: '$40',  image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=400&h=300', description: 'Weekly 250g single-origin beans.' }, paymentMethod: 'ipe',    txHash: '0xa17d3b...8f22', date: new Date(Date.now()-86400000*30).toISOString(), status: 'confirmed' },
  { id: 'dp6', listing: { id: 'ext6', title: 'DAO Legal Structure Consultation',   provider: 'Tomás R.',         category: 'Services',  type: 'Service',  price: '$200', image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=400&h=300', description: '2h session + written summary.' },     paymentMethod: 'fiat',   txHash: '0xc88e1f...5a63', date: new Date(Date.now()-86400000*45).toISOString(), status: 'confirmed' },
  { id: 'dp7', listing: { id: 'ext7', title: 'Debt: The First 5,000 Years (signed)',provider: 'Community Library',category: 'Donations', type: 'Service',  price: 'Free', image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400&h=300', description: 'David Graeber — pass it on.' },         paymentMethod: 'trade',  txHash: '0xe33b7c...9d01', date: new Date(Date.now()-86400000*60).toISOString(), status: 'confirmed' },
];
