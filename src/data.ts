export type BusinessKind = "restaurant" | "home-kitchen" | "bakery" | "grocery" | "local-shop";

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  isVeg: boolean;
  popular?: boolean;
  customizable?: boolean;
};

export type MenuCategory = {
  id: string;
  name: string;
  items: MenuItem[];
};

export type Business = {
  id: string;
  name: string;
  kind: BusinessKind;
  category: string;
  cover: string;
  logo: string;
  location: [number, number];
  distance: number;
  eta: string;
  rating: number;
  reviews: number;
  deliveryFee: number;
  minOrder: number;
  cuisines: string[];
  description: string;
  address: string;
  isOpen: boolean;
  featured?: boolean;
  tags: string[];
  menu: MenuCategory[];
};

export const categories = [
  { name: "North Indian", icon: "🍛", tone: "saffron" },
  { name: "Fast food", icon: "🍔", tone: "coral" },
  { name: "Pizza", icon: "🍕", tone: "rose" },
  { name: "Veg meals", icon: "🥗", tone: "mint" },
  { name: "Tea & snacks", icon: "☕", tone: "gold" },
  { name: "Bakery", icon: "🍰", tone: "lavender" },
  { name: "Grocery", icon: "🛒", tone: "sky" },
  { name: "Home food", icon: "🏠", tone: "peach" },
  { name: "Dairy", icon: "🥛", tone: "blue" },
  { name: "Local shops", icon: "🧺", tone: "lime" },
];

const menu = {
  maa: [
    {
      id: "maa-popular",
      name: "Popular with locals",
      items: [
        {
          id: "maa-thali",
          name: "Aangan Special Thali",
          description: "Dal, seasonal sabzi, two rotis, rice, salad and a little something sweet.",
          price: 189,
          image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=520&q=80",
          isVeg: true,
          popular: true,
          customizable: true,
        },
        {
          id: "maa-paneer",
          name: "Smoky Paneer Tikka",
          description: "Charred cottage cheese, onion and capsicum with our mint chutney.",
          price: 160,
          image: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=520&q=80",
          isVeg: true,
          popular: true,
        },
      ],
    },
    {
      id: "maa-mains",
      name: "Ghar jaisa mains",
      items: [
        {
          id: "maa-kadhi",
          name: "Kadhi Chawal",
          description: "Slow-cooked yoghurt kadhi, steamed rice and crunchy pakoras.",
          price: 135,
          image: "https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?auto=format&fit=crop&w=520&q=80",
          isVeg: true,
        },
        {
          id: "maa-chicken",
          name: "Home-style Chicken Curry",
          description: "Tender chicken in a gently spiced onion-tomato gravy.",
          price: 220,
          image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=520&q=80",
          isVeg: false,
          customizable: true,
        },
      ],
    },
    {
      id: "maa-breads",
      name: "Breads & extras",
      items: [
        { id: "maa-roti", name: "Tandoori Roti", description: "Charred, soft and brushed with ghee.", price: 14, isVeg: true },
        { id: "maa-raita", name: "Boondi Raita", description: "Cool yoghurt, roasted cumin and boondi.", price: 45, isVeg: true },
      ],
    },
  ] as MenuCategory[],
  banyan: [
    {
      id: "banyan-signatures",
      name: "House signatures",
      items: [
        {
          id: "banyan-biryani",
          name: "Banyan Chicken Biryani",
          description: "Long-grain basmati, tender chicken and a fragrant house masala.",
          price: 249,
          image: "https://images.unsplash.com/photo-1563379091339-03246963d96c?auto=format&fit=crop&w=520&q=80",
          isVeg: false,
          popular: true,
          customizable: true,
        },
        {
          id: "banyan-dal",
          name: "Dal Makhani",
          description: "Black lentils slow-cooked overnight with butter and cream.",
          price: 175,
          image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=520&q=80",
          isVeg: true,
          popular: true,
        },
      ],
    },
    {
      id: "banyan-grill",
      name: "From the tandoor",
      items: [
        { id: "banyan-tikka", name: "Chicken Tikka", description: "Yoghurt-marinated, smoky and served with green chutney.", price: 240, isVeg: false },
        { id: "banyan-naan", name: "Butter Garlic Naan", description: "A soft tandoor naan finished with garlic butter.", price: 55, isVeg: true },
      ],
    },
  ] as MenuCategory[],
  bakery: [
    {
      id: "bakery-fresh",
      name: "Fresh from the oven",
      items: [
        {
          id: "bakery-croissant",
          name: "Butter Croissant",
          description: "Flaky, golden layers baked fresh every morning.",
          price: 95,
          image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=520&q=80",
          isVeg: true,
          popular: true,
        },
        {
          id: "bakery-bun",
          name: "Cardamom Milk Bun",
          description: "Pillowy soft bun with a gentle cardamom glaze.",
          price: 65,
          image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=520&q=80",
          isVeg: true,
          popular: true,
        },
        { id: "bakery-cake", name: "Chocolate Celebration Slice", description: "Dark chocolate sponge, ganache and a pinch of sea salt.", price: 140, isVeg: true },
      ],
    },
  ] as MenuCategory[],
  grocery: [
    {
      id: "grocery-daily",
      name: "Everyday essentials",
      items: [
        { id: "grocery-milk", name: "Fresh Farm Milk · 1L", description: "Locally sourced, chilled and delivered cold.", price: 64, isVeg: true, popular: true },
        { id: "grocery-eggs", name: "Farm Eggs · 6 pack", description: "A half-dozen fresh eggs from a nearby farm.", price: 58, isVeg: false, popular: true },
        { id: "grocery-atta", name: "Stone-ground Atta · 5kg", description: "Freshly milled whole wheat flour.", price: 285, isVeg: true },
        { id: "grocery-dal", name: "Toor Dal · 1kg", description: "Everyday pantry staple, sorted and packed locally.", price: 165, isVeg: true },
      ],
    },
  ] as MenuCategory[],
  chai: [
    {
      id: "chai-favourites",
      name: "Chowk favourites",
      items: [
        { id: "chai-cutting", name: "Cutting Chai", description: "Strong, milky tea with ginger and cardamom.", price: 25, isVeg: true, popular: true },
        { id: "chai-samosa", name: "Aloo Samosa · 2 pcs", description: "Crisp pastry, spiced potato and tamarind chutney.", price: 45, isVeg: true, popular: true },
        { id: "chai-bread", name: "Masala Cheese Toast", description: "Toasted bread, local cheese, tomato and green chilli.", price: 80, isVeg: true },
      ],
    },
  ] as MenuCategory[],
  green: [
    {
      id: "green-lunch",
      name: "Light & lovely",
      items: [
        { id: "green-bowl", name: "Seasonal Grain Bowl", description: "Millet, roasted vegetables, sprouts and a lemon dressing.", price: 210, isVeg: true, popular: true },
        { id: "green-wrap", name: "Paneer Kathi Roll", description: "Tandoori paneer, onions and mint yoghurt in a roomali roti.", price: 155, isVeg: true },
      ],
    },
  ] as MenuCategory[],
};

export const businesses: Business[] = [
  {
    id: "maa-rasoi",
    name: "Maa Ki Rasoi",
    kind: "home-kitchen",
    category: "Home food",
    cover: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=85",
    logo: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=240&q=80",
    location: [28.6139, 77.209],
    distance: 1.2,
    eta: "18–25 min",
    rating: 4.9,
    reviews: 132,
    deliveryFee: 20,
    minOrder: 149,
    cuisines: ["North Indian", "Home food", "Pure veg"],
    description: "Comforting, everyday food made in small batches by Neelam ji and her family.",
    address: "12, Peepal Lane · Near the old water tank",
    isOpen: true,
    featured: true,
    tags: ["Top rated", "Home kitchen"],
    menu: menu.maa,
  },
  {
    id: "banyan-dhaba",
    name: "The Banyan Dhaba",
    kind: "restaurant",
    category: "North Indian",
    cover: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=85",
    logo: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=240&q=80",
    location: [28.6212, 77.2145],
    distance: 2.4,
    eta: "25–35 min",
    rating: 4.7,
    reviews: 89,
    deliveryFee: 25,
    minOrder: 199,
    cuisines: ["North Indian", "Tandoor", "Non-veg"],
    description: "Big flavours, smoky tandoor and the kind of welcome that makes you stay for chai.",
    address: "Main Market Road · Opposite Panchayat Bhawan",
    isOpen: true,
    featured: true,
    tags: ["Family favourite", "New"],
    menu: menu.banyan,
  },
  {
    id: "sunday-bakes",
    name: "Sunday Bakehouse",
    kind: "bakery",
    category: "Bakery",
    cover: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=85",
    logo: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=240&q=80",
    location: [28.6095, 77.2022],
    distance: 0.8,
    eta: "15–20 min",
    rating: 4.8,
    reviews: 64,
    deliveryFee: 15,
    minOrder: 99,
    cuisines: ["Bakery", "Desserts", "Coffee"],
    description: "Small-batch breads, buns and celebration cakes from a sunny little oven.",
    address: "4, School Lane · Beside the community library",
    isOpen: true,
    featured: true,
    tags: ["Baked today", "Sweet treat"],
    menu: menu.bakery,
  },
  {
    id: "apna-grocery",
    name: "Apna Grocery Store",
    kind: "grocery",
    category: "Grocery",
    cover: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=85",
    logo: "https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&w=240&q=80",
    location: [28.617, 77.218],
    distance: 1.8,
    eta: "20–30 min",
    rating: 4.6,
    reviews: 210,
    deliveryFee: 20,
    minOrder: 0,
    cuisines: ["Groceries", "Daily essentials", "Dairy"],
    description: "The neighbourhood kirana, now a few taps away — essentials picked with care.",
    address: "8, Main Bazaar · Next to the post office",
    isOpen: true,
    featured: false,
    tags: ["Daily essentials", "COD available"],
    menu: menu.grocery,
  },
  {
    id: "chai-chowk",
    name: "Chai Chowk",
    kind: "restaurant",
    category: "Tea & snacks",
    cover: "https://images.unsplash.com/photo-1572449043416-55f4685c9bb7?auto=format&fit=crop&w=1200&q=85",
    logo: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=240&q=80",
    location: [28.616, 77.205],
    distance: 0.6,
    eta: "12–18 min",
    rating: 4.8,
    reviews: 74,
    deliveryFee: 10,
    minOrder: 79,
    cuisines: ["Tea", "Snacks", "Breakfast"],
    description: "Your daily chai stop — ginger tea, crispy snacks and cheerful conversation.",
    address: "1, Clock Tower Circle · By the banyan tree",
    isOpen: true,
    featured: false,
    tags: ["Fastest", "Breakfast"],
    menu: menu.chai,
  },
  {
    id: "green-leaf",
    name: "Green Leaf Café",
    kind: "restaurant",
    category: "Veg meals",
    cover: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=85",
    logo: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=240&q=80",
    location: [28.625, 77.2],
    distance: 3.1,
    eta: "30–40 min",
    rating: 4.5,
    reviews: 51,
    deliveryFee: 30,
    minOrder: 199,
    cuisines: ["Healthy", "Vegetarian", "Millets"],
    description: "Bright, wholesome bowls and wraps built around seasonal local produce.",
    address: "22, Canal Road · Near the bus stand",
    isOpen: true,
    featured: false,
    tags: ["Healthy pick", "100% veg"],
    menu: menu.green,
  },
];

export const formatCurrency = (value: number) => `₹${value.toLocaleString("en-IN")}`;

export const getMenuItems = (business: Business) => business.menu.flatMap((section) => section.items);
