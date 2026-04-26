import honeyImg from '../assets/honey.png';

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
    image: honeyImg
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
    isPublic: true, coordinates: { lat: -27.4375, lng: -48.5020 }, nodeName: 'Beach Workout',
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'l9', title: 'Café Especial Torrado na Hora', category: 'Products',
    provider: 'CoffeeLab Jurerê', type: 'Product', acceptedPayments: ['fiat', 'crypto', 'trade'], price: 'R$ 45/pacote',
    description: 'Café 100% arábica. Aceitamos troca por serviços de design ou dev.',
    isPublic: true, coordinates: { lat: -27.4390, lng: -48.4980 }, nodeName: 'Coffee Roaster',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'l10', title: 'Doação de Roupas Infantis', category: 'Donations',
    provider: 'Carla Silva', type: 'Donation', acceptedPayments: ['free'], price: 'Free',
    description: 'Roupas de bebê (0-2 anos) em perfeito estado para doação.',
    isPublic: true, coordinates: { lat: -27.4460, lng: -48.5130 }, nodeName: 'Doação Roupas',
    image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'l11', title: 'Manutenção de Ar Condicionado', category: 'Services',
    provider: 'Clima Jurerê', type: 'Service', acceptedPayments: ['fiat'], price: 'R$ 150',
    description: 'Limpeza e manutenção preventiva de splits.',
    isPublic: true, coordinates: { lat: -27.4422, lng: -48.4950 }, nodeName: 'Climatização',
    image: 'https://images.unsplash.com/photo-1590432298190-25211993a469?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'l12', title: 'Aluguel Prancha de Surf', category: 'Products',
    provider: 'Surf Point', type: 'Product', acceptedPayments: ['fiat', 'crypto'], price: 'R$ 50/dia',
    description: 'Pranchas funboard e longboard disponíveis para aluguel diário.',
    isPublic: true, coordinates: { lat: -27.4385, lng: -48.5150 }, nodeName: 'Surf Rental',
    image: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'l13', title: 'Aulas de Inglês Conversação', category: 'Services',
    provider: 'Teacher Mike', type: 'Service', acceptedPayments: ['fiat', 'crypto', 'trade'], price: 'R$ 70/hora',
    description: 'Native speaker. Foco em conversação e negócios.',
    isPublic: true, coordinates: { lat: -27.4440, lng: -48.4990 }, nodeName: 'English Tutor',
    image: 'https://images.unsplash.com/photo-1543269664-76bc3997d9ea?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'l14', title: 'Marcenaria Sustentável', category: 'Products',
    provider: 'WoodCraft', type: 'Product', acceptedPayments: ['crypto', 'trade'], price: 'Sob Consulta',
    description: 'Móveis feitos com madeira de demolição. Aceitamos pagamentos via crypto.',
    isPublic: true, coordinates: { lat: -27.4455, lng: -48.5080 }, nodeName: 'Marcenaria',
    image: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'l15', title: 'Apoio Jurídico para Startups', category: 'Services',
    provider: 'Advocacia Ipê', type: 'Service', acceptedPayments: ['fiat', 'crypto'], price: 'A partir de 100 USDC',
    description: 'Consultoria jurídica, formação de DAO e contratos smart.',
    isPublic: true, coordinates: { lat: -27.4405, lng: -48.5075 }, nodeName: 'Consultoria Web3',
    image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'l16', title: 'Oficina Comunitária de Bicicletas', category: 'Donations',
    provider: 'Pedal Livre', type: 'Donation', acceptedPayments: ['free', 'trade'], price: 'Free',
    description: 'Espaço aberto para manutenção de bikes. Temos ferramentas e algumas peças doadas.',
    isPublic: true, coordinates: { lat: -27.4430, lng: -48.4920 }, nodeName: 'Oficina Colab',
    image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'l17', title: 'Pães de Fermentação Natural', category: 'Products',
    provider: 'Padaria Artesanal', type: 'Product', acceptedPayments: ['fiat', 'crypto'], price: 'R$ 25',
    description: 'Fornadas às terças e sextas. Sourdough clássico.',
    isPublic: true, coordinates: { lat: -27.4415, lng: -48.4965 }, nodeName: 'Padaria Artesanal',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'l18', title: 'Fotografia Profissional', category: 'Services',
    provider: 'Luz & Sombra', type: 'Service', acceptedPayments: ['fiat', 'crypto', 'trade'], price: 'R$ 300/ensaio',
    description: 'Ensaios, fotos de produtos e cobertura de eventos na cidade.',
    isPublic: true, coordinates: { lat: -27.4395, lng: -48.5100 }, nodeName: 'Fotógrafo',
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'l19', title: 'Cerveja Artesanal Local (IPA)', category: 'Products',
    provider: 'Cervejaria do Forte', type: 'Product', acceptedPayments: ['fiat', 'trade'], price: 'R$ 18/litro',
    description: 'IPA fresca produzida localmente. Traga seu growler!',
    isPublic: true, coordinates: { lat: -27.4435, lng: -48.5140 }, nodeName: 'Cervejaria',
    image: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'l20', title: 'Mentoria em Programação (Solidity)', category: 'Donations',
    provider: 'Dev Network', type: 'Donation', acceptedPayments: ['free'], price: 'Free',
    description: 'Ofereço 2h semanais de mentoria gratuita em Solidity e smart contracts.',
    isPublic: true, coordinates: { lat: -27.4400, lng: -48.5030 }, nodeName: 'Dev Mentor',
    image: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&q=80&w=400&h=300'
  },
  // Even more POIs for density
  {
    id: 'l21', title: 'Aluguel de Equipamentos Audiovisuais', category: 'Products',
    provider: 'CineRent Jurerê', type: 'Product', acceptedPayments: ['fiat', 'crypto'], price: 'R$ 150/dia',
    description: 'Luzes, microfones e tripés para criadores de conteúdo.',
    isPublic: true, coordinates: { lat: -27.4450, lng: -48.4970 }, nodeName: 'AV Rental',
    image: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'l22', title: 'Aula de Yoga ao Pôr do Sol', category: 'Services',
    provider: 'Yoga com Ana', type: 'Service', acceptedPayments: ['fiat', 'crypto', 'trade'], price: 'R$ 40/aula',
    description: 'Aulas em grupo na praia do Forte. Aceito trocas.',
    isPublic: true, coordinates: { lat: -27.4360, lng: -48.5180 }, nodeName: 'Yoga Class',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'l23', title: 'Livros de Negócios e Web3', category: 'Donations',
    provider: 'Biblioteca Ipê', type: 'Donation', acceptedPayments: ['free'], price: 'Free',
    description: 'Ponto de troca de livros. Deixe um, leve outro.',
    isPublic: true, coordinates: { lat: -27.4428, lng: -48.5050 }, nodeName: 'Book Swap',
    image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'l24', title: 'Massoterapia', category: 'Services',
    provider: 'Zen Studio', type: 'Service', acceptedPayments: ['fiat', 'crypto'], price: 'R$ 120/sessão',
    description: 'Massagem relaxante e desportiva.',
    isPublic: true, coordinates: { lat: -27.4380, lng: -48.4940 }, nodeName: 'Massagem',
    image: 'https://images.unsplash.com/photo-1544161515-4af6b1d4640d?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'l25', title: 'Mudas de Plantas Nativas', category: 'Products',
    provider: 'Verde Jurerê', type: 'Product', acceptedPayments: ['trade', 'crypto'], price: 'R$ 15',
    description: 'Mudas de ipê, pitanga e araçá. Cultivo próprio.',
    isPublic: true, coordinates: { lat: -27.4470, lng: -48.5000 }, nodeName: 'Viveiro',
    image: 'https://images.unsplash.com/photo-1416870230247-3b4a842247ba?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'l26', title: 'Assistência Técnica de Smartphones', category: 'Services',
    provider: 'FixTech', type: 'Service', acceptedPayments: ['fiat'], price: 'Sob Consulta',
    description: 'Troca de tela e bateria de iPhones e Androids.',
    isPublic: true, coordinates: { lat: -27.4408, lng: -48.4910 }, nodeName: 'Phone Fix',
    image: 'https://images.unsplash.com/photo-1512054115533-2a67bb046524?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'l27', title: 'Grupo de Corrida Jurerê', category: 'Donations',
    provider: 'Runners Club', type: 'Donation', acceptedPayments: ['free'], price: 'Free',
    description: 'Grupo aberto que se reúne terças e quintas às 6h.',
    isPublic: true, coordinates: { lat: -27.4365, lng: -48.5120 }, nodeName: 'Runners',
    image: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'l28', title: 'Aulas de Violão e Guitarra', category: 'Services',
    provider: 'Música & Cia', type: 'Service', acceptedPayments: ['fiat', 'trade'], price: 'R$ 80/hora',
    description: 'Aulas para iniciantes e intermediários. Empréstimo de instrumento.',
    isPublic: true, coordinates: { lat: -27.4435, lng: -48.5090 }, nodeName: 'Aulas Violão',
    image: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'l29', title: 'Kombucha Artesanal', category: 'Products',
    provider: 'BioFermentos', type: 'Product', acceptedPayments: ['fiat', 'crypto'], price: 'R$ 15',
    description: 'Kombucha de hibisco com gengibre, garrafas de 500ml.',
    isPublic: true, coordinates: { lat: -27.4442, lng: -48.5015 }, nodeName: 'Kombucha',
    image: 'https://images.unsplash.com/photo-1556760544-74068565f05c?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'l30', title: 'Limpeza e Higienização de Estofados', category: 'Services',
    provider: 'CleanSofa', type: 'Service', acceptedPayments: ['fiat', 'crypto'], price: 'R$ 200',
    description: 'Atendimento a domicílio. Limpeza profunda a seco.',
    isPublic: true, coordinates: { lat: -27.4398, lng: -48.5160 }, nodeName: 'Clean Sofa',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=400&h=300'
  }
];
