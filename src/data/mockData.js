export const mockListings = [
  // Original
  {
    id: 'l1', title: 'HDMI Setup & Screen Mirroring Help', category: 'Donations',
    provider: 'Alex M.', type: 'Donation', acceptedPayments: ['free'],
    description: 'Need help connecting your TV to your computer? I can pass by and set it up for free. Takes 5 mins.',
    isPublic: true, coordinates: { lat: -27.4425, lng: -48.5085 }, nodeName: 'Tech Helper',
    image: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'l2', title: 'Emergency Vet for Dogs', category: 'Services',
    provider: 'Dr. Sarah Haus', type: 'Service', acceptedPayments: ['fiat', 'crypto'], price: '$50',
    description: 'Experienced veterinarian available for home visits and emergency care for your dogs.',
    isPublic: true, coordinates: { lat: -27.4410, lng: -48.5010 }, nodeName: 'Vet Clinic',
    image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'l3', title: 'Organic Bracatinga Honey & Guava Jam', category: 'Products',
    provider: 'Sítio do Ipê', type: 'Product', acceptedPayments: ['fiat', 'crypto', 'trade'], price: '$12',
    description: '100% natural honey produced in our local farm, and homemade guava jam. Fresh batch!',
    isPublic: true, coordinates: { lat: -27.4445, lng: -48.5040 }, nodeName: 'Organic Farm',
    image: 'https://images.unsplash.com/photo-1587049352851-8d4e891347ad?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'l4', title: '50" Smart TV (Used, Great Condition)', category: 'Products',
    provider: 'John D.', type: 'Product', acceptedPayments: ['fiat'], price: '$200',
    description: 'Selling my 50 inch TV. Works perfectly, just upgrading to a bigger one.',
    isPublic: false, image: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'l5', title: 'Electric Bike (City Cruiser)', category: 'Products',
    provider: 'Marina G.', type: 'Product', acceptedPayments: ['fiat', 'crypto'], price: '$800',
    description: 'Barely used E-bike. Battery lasts 40km. Great for moving around the city.',
    isPublic: false, image: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'l6', title: 'Physical Therapy for Elderly', category: 'Services',
    provider: 'HealthCare Center', type: 'Service', acceptedPayments: ['fiat'], price: '$60/session',
    description: 'Specialized physical therapy for seniors. We go to your location.',
    isPublic: true, coordinates: { lat: -27.4438, lng: -48.5112 }, nodeName: 'PT Clinic',
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'l7', title: 'Graphic Design Services', category: 'Services',
    provider: 'DesignHaus', type: 'Service', acceptedPayments: ['trade', 'crypto'], price: 'Trade / 50 USDC',
    description: 'I can design your logo or flyer in exchange for homegrown food, coffee beans, or crypto.',
    isPublic: true, coordinates: { lat: -27.4418, lng: -48.5060 }, nodeName: 'Creator Studio',
    image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&q=80&w=400&h=300'
  },
  // Added points to enrich the map across Jurerê
  {
    id: 'l8', title: 'Personal Trainer & Beach Workout', category: 'Services',
    provider: 'FitJurerê', type: 'Service', acceptedPayments: ['fiat', 'crypto'], price: 'R$ 80/hora',
    description: 'Treinos funcionais na praia. Acompanhamento diário.',
    isPublic: true, coordinates: { lat: -27.4375, lng: -48.5020 }, nodeName: 'Beach Workout'
  },
  {
    id: 'l9', title: 'Café Especial Torrado na Hora', category: 'Products',
    provider: 'CoffeeLab Jurerê', type: 'Product', acceptedPayments: ['fiat', 'crypto', 'trade'], price: 'R$ 45/pacote',
    description: 'Café 100% arábica. Aceitamos troca por serviços de design ou dev.',
    isPublic: true, coordinates: { lat: -27.4390, lng: -48.4980 }, nodeName: 'Coffee Roaster'
  },
  {
    id: 'l10', title: 'Doação de Roupas Infantis', category: 'Donations',
    provider: 'Carla Silva', type: 'Donation', acceptedPayments: ['free'], price: 'Free',
    description: 'Roupas de bebê (0-2 anos) em perfeito estado para doação.',
    isPublic: true, coordinates: { lat: -27.4460, lng: -48.5130 }, nodeName: 'Doação Roupas'
  },
  {
    id: 'l11', title: 'Manutenção de Ar Condicionado', category: 'Services',
    provider: 'Clima Jurerê', type: 'Service', acceptedPayments: ['fiat'], price: 'R$ 150',
    description: 'Limpeza e manutenção preventiva de splits.',
    isPublic: true, coordinates: { lat: -27.4422, lng: -48.4950 }, nodeName: 'Climatização'
  },
  {
    id: 'l12', title: 'Aluguel Prancha de Surf', category: 'Products',
    provider: 'Surf Point', type: 'Product', acceptedPayments: ['fiat', 'crypto'], price: 'R$ 50/dia',
    description: 'Pranchas funboard e longboard disponíveis para aluguel diário.',
    isPublic: true, coordinates: { lat: -27.4385, lng: -48.5150 }, nodeName: 'Surf Rental'
  },
  {
    id: 'l13', title: 'Aulas de Inglês Conversação', category: 'Services',
    provider: 'Teacher Mike', type: 'Service', acceptedPayments: ['fiat', 'crypto', 'trade'], price: 'R$ 70/hora',
    description: 'Native speaker. Foco em conversação e negócios.',
    isPublic: true, coordinates: { lat: -27.4440, lng: -48.4990 }, nodeName: 'English Tutor'
  },
  {
    id: 'l14', title: 'Marcenaria Sustentável', category: 'Products',
    provider: 'WoodCraft', type: 'Product', acceptedPayments: ['crypto', 'trade'], price: 'Sob Consulta',
    description: 'Móveis feitos com madeira de demolição. Aceitamos pagamentos via crypto.',
    isPublic: true, coordinates: { lat: -27.4455, lng: -48.5080 }, nodeName: 'Marcenaria'
  },
  {
    id: 'l15', title: 'Apoio Jurídico para Startups', category: 'Services',
    provider: 'Advocacia Ipê', type: 'Service', acceptedPayments: ['fiat', 'crypto'], price: 'A partir de 100 USDC',
    description: 'Consultoria jurídica, formação de DAO e contratos smart.',
    isPublic: true, coordinates: { lat: -27.4405, lng: -48.5075 }, nodeName: 'Consultoria Web3'
  },
  {
    id: 'l16', title: 'Oficina Comunitária de Bicicletas', category: 'Donations',
    provider: 'Pedal Livre', type: 'Donation', acceptedPayments: ['free', 'trade'], price: 'Free',
    description: 'Espaço aberto para manutenção de bikes. Temos ferramentas e algumas peças doadas.',
    isPublic: true, coordinates: { lat: -27.4430, lng: -48.4920 }, nodeName: 'Oficina Colab'
  },
  {
    id: 'l17', title: 'Pães de Fermentação Natural', category: 'Products',
    provider: 'Padaria Artesanal', type: 'Product', acceptedPayments: ['fiat', 'crypto'], price: 'R$ 25',
    description: 'Fornadas às terças e sextas. Sourdough clássico.',
    isPublic: true, coordinates: { lat: -27.4415, lng: -48.4965 }, nodeName: 'Padaria Artesanal'
  },
  {
    id: 'l18', title: 'Fotografia Profissional', category: 'Services',
    provider: 'Luz & Sombra', type: 'Service', acceptedPayments: ['fiat', 'crypto', 'trade'], price: 'R$ 300/ensaio',
    description: 'Ensaios, fotos de produtos e cobertura de eventos na cidade.',
    isPublic: true, coordinates: { lat: -27.4395, lng: -48.5100 }, nodeName: 'Fotógrafo'
  },
  {
    id: 'l19', title: 'Cerveja Artesanal Local (IPA)', category: 'Products',
    provider: 'Cervejaria do Forte', type: 'Product', acceptedPayments: ['fiat', 'trade'], price: 'R$ 18/litro',
    description: 'IPA fresca produzida localmente. Traga seu growler!',
    isPublic: true, coordinates: { lat: -27.4435, lng: -48.5140 }, nodeName: 'Cervejaria'
  },
  {
    id: 'l20', title: 'Mentoria em Programação (Solidity)', category: 'Donations',
    provider: 'Dev Network', type: 'Donation', acceptedPayments: ['free'], price: 'Free',
    description: 'Ofereço 2h semanais de mentoria gratuita em Solidity e smart contracts.',
    isPublic: true, coordinates: { lat: -27.4400, lng: -48.5030 }, nodeName: 'Dev Mentor'
  }
];
