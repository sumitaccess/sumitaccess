import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Bell,
  Bike,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  CircleHelp,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  Copy,
  CreditCard,
  DoorOpen,
  Download,
  Eye,
  Heart,
  Home,
  Languages,
  Leaf,
  LocateFixed,
  LogOut,
  MapPin,
  MapPinned,
  MessageCircle,
  MoreHorizontal,
  Navigation,
  PackageCheck,
  PanelTop,
  Phone,
  Plus,
  Receipt,
  RotateCcw,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  ShoppingBasket,
  SlidersHorizontal,
  Sparkles,
  Star,
  Store,
  Tag,
  Timer,
  Truck,
  UserRound,
  UsersRound,
  Utensils,
  WalletCards,
  X,
  Zap,
} from "lucide-react";
import {
  businesses as seededBusinesses,
  categories,
  formatCurrency,
  getMenuItems,
  type Business,
  type MenuItem,
} from "./data";

type View = "home" | "search" | "restaurant" | "checkout" | "tracking" | "orders" | "favorites" | "profile" | "workspace";
type WorkspaceRole = "merchant" | "rider" | "admin";
type PaymentMethod = "COD" | "UPI" | "CARD";
type ToastTone = "success" | "warning" | "info";

type CartLine = MenuItem & {
  businessId: string;
  businessName: string;
  quantity: number;
};

type OrderRecord = {
  id: string;
  businessId: string;
  businessName: string;
  business: Business;
  lines: CartLine[];
  subtotal: number;
  deliveryFee: number;
  platformFee: number;
  discount: number;
  total: number;
  address: string;
  paymentMethod: PaymentMethod;
  statusIndex: number;
  placedAt: string;
};

const trackingStatuses = [
  { label: "Order placed", detail: "We sent your order to the kitchen." },
  { label: "Kitchen accepted", detail: "The kitchen is getting everything ready." },
  { label: "Preparing your order", detail: "Fresh food is being packed with care." },
  { label: "Rider assigned", detail: "A local delivery partner is on the way." },
  { label: "Picked up", detail: "Your order has left the business." },
  { label: "On the way", detail: "Almost there — keep an eye on the map." },
];

const workspaceCopy: Record<WorkspaceRole, { label: string; description: string; icon: typeof Store }> = {
  merchant: { label: "Merchant studio", description: "Run your kitchen, menu and orders.", icon: Store },
  rider: { label: "Rider app", description: "Deliver locally, earn transparently.", icon: Bike },
  admin: { label: "Operations console", description: "Keep the whole neighbourhood moving.", icon: PanelTop },
};

const demoOrder: OrderRecord = {
  id: "HAT-2406",
  businessId: "maa-rasoi",
  businessName: "Maa Ki Rasoi",
  business: seededBusinesses[0],
  lines: [
    { ...seededBusinesses[0].menu[0].items[0], businessId: "maa-rasoi", businessName: "Maa Ki Rasoi", quantity: 1 },
    { ...seededBusinesses[0].menu[2].items[0], businessId: "maa-rasoi", businessName: "Maa Ki Rasoi", quantity: 2 },
  ],
  subtotal: 217,
  deliveryFee: 20,
  platformFee: 5,
  discount: 0,
  total: 242,
  address: "House 18, near Hanuman Mandir, Basantpur",
  paymentMethod: "COD",
  statusIndex: 6,
  placedAt: "Today, 12:42 PM",
};

const cn = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" ");

function App() {
  const [view, setView] = useState<View>("home");
  const [businesses, setBusinesses] = useState<Business[]>(seededBusinesses);
  const [activeBusinessId, setActiveBusinessId] = useState("maa-rasoi");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>(["maa-rasoi"]);
  const [location, setLocation] = useState("Basantpur village");
  const [locationModal, setLocationModal] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState("House 18, near Hanuman Mandir, Basantpur");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");
  const [orders, setOrders] = useState<OrderRecord[]>([demoOrder]);
  const [activeOrder, setActiveOrder] = useState<OrderRecord | null>(null);
  const [trackingStep, setTrackingStep] = useState(0);
  const [role, setRole] = useState<WorkspaceRole>("merchant");
  const [apiOnline, setApiOnline] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null);

  const activeBusiness = businesses.find((business) => business.id === activeBusinessId) ?? businesses[0];
  const cartBusiness = cart.length ? businesses.find((business) => business.id === cart[0].businessId) : undefined;
  const cartSubtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const cartDeliveryFee = cartBusiness ? (cartSubtotal >= 499 ? 0 : cartBusiness.deliveryFee) : 0;
  const cartDiscount = cartSubtotal >= 399 ? 40 : 0;
  const cartTotal = cartSubtotal + cartDeliveryFee + 5 - cartDiscount;
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  const showToast = (message: string, tone: ToastTone = "success") => {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), 3200);
  };

  useEffect(() => {
    const loadApiData = async () => {
      try {
        const [healthResponse, businessResponse] = await Promise.all([fetch("/api/health"), fetch("/api/businesses")]);
        if (healthResponse.ok) setApiOnline(true);
        if (businessResponse.ok) {
          const payload = (await businessResponse.json()) as { data?: Business[] };
          if (payload.data?.length) setBusinesses(payload.data);
        }
      } catch {
        setApiOnline(false);
      }
    };
    void loadApiData();
  }, []);

  useEffect(() => {
    if (view !== "tracking" || !activeOrder || trackingStep >= trackingStatuses.length - 1) return;
    const interval = window.setInterval(() => {
      setTrackingStep((current) => {
        const next = Math.min(current + 1, trackingStatuses.length - 1);
        setActiveOrder((order) => (order ? { ...order, statusIndex: next } : order));
        return next;
      });
    }, 12000);
    return () => window.clearInterval(interval);
  }, [view, activeOrder?.id, trackingStep]);

  const navigate = (nextView: View) => {
    setView(nextView);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openBusiness = (businessId: string) => {
    setActiveBusinessId(businessId);
    navigate("restaurant");
  };

  const handleSearchSubmit = (event?: { preventDefault: () => void }) => {
    event?.preventDefault();
    if (!searchQuery.trim()) {
      showToast("Try searching for a dish, shop or category.", "info");
      return;
    }
    navigate("search");
  };

  const addToCart = (item: MenuItem, business: Business) => {
    if (cart.length && cart[0].businessId !== business.id) {
      showToast(`Your basket is from ${cart[0].businessName}. Finish that order first.`, "warning");
      setCartOpen(true);
      return;
    }
    setCart((current) => {
      const existing = current.find((line) => line.id === item.id);
      if (existing) return current.map((line) => (line.id === item.id ? { ...line, quantity: line.quantity + 1 } : line));
      return [...current, { ...item, businessId: business.id, businessName: business.name, quantity: 1 }];
    });
    showToast(`${item.name} added to your basket.`);
  };

  const changeQuantity = (itemId: string, delta: number) => {
    setCart((current) =>
      current
        .map((item) => (item.id === itemId ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0),
    );
  };

  const toggleFavorite = (businessId: string) => {
    setFavorites((current) => (current.includes(businessId) ? current.filter((id) => id !== businessId) : [...current, businessId]));
    showToast(favorites.includes(businessId) ? "Removed from your favourites." : "Saved to your favourites.", "info");
  };

  const placeOrder = async () => {
    if (!cart.length || !cartBusiness) return;
    setIsPlacing(true);
    const localOrder: OrderRecord = {
      id: `HAT-${Math.floor(1000 + Math.random() * 8999)}`,
      businessId: cartBusiness.id,
      businessName: cartBusiness.name,
      business: cartBusiness,
      lines: cart,
      subtotal: cartSubtotal,
      deliveryFee: cartDeliveryFee,
      platformFee: 5,
      discount: cartDiscount,
      total: cartTotal,
      address: selectedAddress,
      paymentMethod,
      statusIndex: 0,
      placedAt: "Just now",
    };

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: cartBusiness.id,
          items: cart.map((item) => ({ itemId: item.id, quantity: item.quantity })),
          address: selectedAddress,
          paymentMethod,
        }),
      });
      if (response.ok) {
        const payload = (await response.json()) as { data?: { id?: string; total?: number; deliveryFee?: number; discount?: number } };
        if (payload.data) {
          localOrder.id = payload.data.id ?? localOrder.id;
          localOrder.total = payload.data.total ?? localOrder.total;
          localOrder.deliveryFee = payload.data.deliveryFee ?? localOrder.deliveryFee;
          localOrder.discount = payload.data.discount ?? localOrder.discount;
        }
      }
    } catch {
      showToast("We saved your order locally while reconnecting to the kitchen.", "warning");
    }

    setOrders((current) => [localOrder, ...current]);
    setActiveOrder(localOrder);
    setTrackingStep(0);
    setCart([]);
    setCartOpen(false);
    setIsPlacing(false);
    navigate("tracking");
    showToast("Order placed — the kitchen is on it!");
  };

  const advanceTracking = () => {
    setTrackingStep((current) => {
      const next = Math.min(current + 1, trackingStatuses.length - 1);
      setActiveOrder((order) => (order ? { ...order, statusIndex: next } : order));
      return next;
    });
  };

  const reorder = (order: OrderRecord) => {
    setCart(order.lines.map((line) => ({ ...line })));
    setActiveBusinessId(order.businessId);
    setCartOpen(true);
    showToast("Your previous basket is ready to review.", "info");
  };

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return businesses;
    return businesses.filter((business) => {
      const searchable = [business.name, business.category, business.description, ...business.cuisines, ...getMenuItems(business).map((item) => item.name)].join(" ").toLowerCase();
      return searchable.includes(query);
    });
  }, [businesses, searchQuery]);

  const renderView = () => {
    switch (view) {
      case "search":
        return (
          <SearchPage
            query={searchQuery}
            results={searchResults}
            favorites={favorites}
            onQueryChange={setSearchQuery}
            onSubmit={handleSearchSubmit}
            onOpen={openBusiness}
            onFavorite={toggleFavorite}
            onBack={() => navigate("home")}
          />
        );
      case "restaurant":
        return (
          <RestaurantPage
            business={activeBusiness}
            favorite={favorites.includes(activeBusiness.id)}
            onBack={() => navigate("home")}
            onFavorite={() => toggleFavorite(activeBusiness.id)}
            onAdd={(item) => addToCart(item, activeBusiness)}
          />
        );
      case "checkout":
        return (
          <CheckoutPage
            business={cartBusiness}
            cart={cart}
            subtotal={cartSubtotal}
            deliveryFee={cartDeliveryFee}
            discount={cartDiscount}
            total={cartTotal}
            address={selectedAddress}
            paymentMethod={paymentMethod}
            isPlacing={isPlacing}
            onAddress={setSelectedAddress}
            onPayment={setPaymentMethod}
            onQuantity={changeQuantity}
            onPlaceOrder={placeOrder}
            onBack={() => setCartOpen(true)}
          />
        );
      case "tracking":
        return activeOrder ? (
          <TrackingPage
            order={activeOrder}
            step={trackingStep}
            onAdvance={advanceTracking}
            onBack={() => navigate("orders")}
            onHome={() => navigate("home")}
          />
        ) : (
          <EmptyState icon={<PackageCheck size={28} />} title="No active delivery" description="Place an order and your live updates will appear here." action="Discover local food" onAction={() => navigate("home")} />
        );
      case "orders":
        return <OrdersPage orders={orders} onTrack={(order) => { setActiveOrder(order); setTrackingStep(order.statusIndex); navigate("tracking"); }} onReorder={reorder} onExplore={() => navigate("home")} />;
      case "favorites":
        return (
          <FavoritesPage
            favorites={businesses.filter((business) => favorites.includes(business.id))}
            onOpen={openBusiness}
            onFavorite={toggleFavorite}
            onExplore={() => navigate("home")}
          />
        );
      case "profile":
        return <ProfilePage location={location} apiOnline={apiOnline} onLocation={() => setLocationModal(true)} onWorkspace={(nextRole) => { setRole(nextRole); navigate("workspace"); }} />;
      case "workspace":
        return <WorkspacePage role={role} onRoleChange={setRole} onExit={() => navigate("home")} />;
      case "home":
      default:
        return (
          <HomePage
            businesses={businesses}
            favorites={favorites}
            query={searchQuery}
            location={location}
            onQueryChange={setSearchQuery}
            onSearch={handleSearchSubmit}
            onCategory={(category) => { setSearchQuery(category); navigate("search"); }}
            onOpen={openBusiness}
            onFavorite={toggleFavorite}
            onMap={() => { setSearchQuery(""); navigate("search"); }}
          />
        );
    }
  };

  return (
    <div className="app-shell">
      <Header
        view={view}
        cartCount={cartCount}
        location={location}
        apiOnline={apiOnline}
        onNavigate={navigate}
        onLocation={() => setLocationModal(true)}
        onCart={() => setCartOpen(true)}
      />
      <main>{renderView()}</main>
      {view !== "workspace" && <MobileNav view={view} cartCount={cartCount} onNavigate={navigate} onCart={() => setCartOpen(true)} />}
      {cartOpen && (
        <CartDrawer
          cart={cart}
          subtotal={cartSubtotal}
          deliveryFee={cartDeliveryFee}
          discount={cartDiscount}
          total={cartTotal}
          onClose={() => setCartOpen(false)}
          onQuantity={changeQuantity}
          onCheckout={() => { setCartOpen(false); navigate("checkout"); }}
          onExplore={() => { setCartOpen(false); navigate("home"); }}
        />
      )}
      {locationModal && (
        <LocationModal
          current={location}
          onClose={() => setLocationModal(false)}
          onSelect={(nextLocation) => { setLocation(nextLocation); setLocationModal(false); showToast(`Delivering to ${nextLocation}.`); }}
        />
      )}
      {toast && <Toast message={toast.message} tone={toast.tone} />}
    </div>
  );
}

type HeaderProps = {
  view: View;
  cartCount: number;
  location: string;
  apiOnline: boolean;
  onNavigate: (view: View) => void;
  onLocation: () => void;
  onCart: () => void;
};

function Header({ view, cartCount, location, apiOnline, onNavigate, onLocation, onCart }: HeaderProps) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <button className="brand" onClick={() => onNavigate("home")} aria-label="Go to Haatly home">
          <span className="brand-mark">H</span>
          <span className="brand-word">haatly<span>.</span></span>
        </button>
        <nav className="desktop-nav" aria-label="Primary navigation">
          <button className={cn("nav-link", view === "home" && "active")} onClick={() => onNavigate("home")}>Discover</button>
          <button className={cn("nav-link", view === "search" && "active")} onClick={() => onNavigate("search")}>Explore</button>
          <button className={cn("nav-link", view === "orders" || view === "tracking" ? "active" : "")} onClick={() => onNavigate("orders")}>Your orders</button>
        </nav>
        <div className="topbar-actions">
          <button className="location-control" onClick={onLocation}>
            <MapPin size={15} strokeWidth={2.5} />
            <span>{location}</span>
            <ChevronDown size={14} />
          </button>
          <span className={cn("api-indicator", apiOnline ? "online" : "offline")} title={apiOnline ? "API connected" : "Demo data mode"}>
            <span /> {apiOnline ? "Live" : "Demo"}
          </span>
          <button className="icon-button notification-button" aria-label="Notifications" onClick={() => onNavigate("profile")}><Bell size={18} /><span className="notification-dot" /></button>
          <button className="avatar-button" aria-label="Open profile" onClick={() => onNavigate("profile")}><span>AS</span></button>
          <button className="cart-button" onClick={onCart} aria-label={`Open basket with ${cartCount} items`}><ShoppingBag size={18} /><span>Basket</span>{cartCount > 0 && <b>{cartCount}</b>}</button>
        </div>
      </div>
    </header>
  );
}

function MobileNav({ view, cartCount, onNavigate, onCart }: { view: View; cartCount: number; onNavigate: (view: View) => void; onCart: () => void }) {
  return (
    <nav className="mobile-nav" aria-label="Mobile navigation">
      <button className={cn(view === "home" && "active")} onClick={() => onNavigate("home")}><Home size={19} /><span>Home</span></button>
      <button className={cn(view === "search" && "active")} onClick={() => onNavigate("search")}><Search size={19} /><span>Search</span></button>
      <button className="mobile-cart" onClick={onCart}><ShoppingBag size={20} />{cartCount > 0 && <b>{cartCount}</b>}<span>Basket</span></button>
      <button className={cn((view === "orders" || view === "tracking") && "active")} onClick={() => onNavigate("orders")}><Receipt size={19} /><span>Orders</span></button>
      <button className={cn((view === "profile" || view === "workspace") && "active")} onClick={() => onNavigate("profile")}><UserRound size={19} /><span>Profile</span></button>
    </nav>
  );
}

function HomePage({ businesses, favorites, query, location, onQueryChange, onSearch, onCategory, onOpen, onFavorite, onMap }: {
  businesses: Business[];
  favorites: string[];
  query: string;
  location: string;
  onQueryChange: (value: string) => void;
  onSearch: (event?: { preventDefault: () => void }) => void;
  onCategory: (category: string) => void;
  onOpen: (businessId: string) => void;
  onFavorite: (businessId: string) => void;
  onMap: () => void;
}) {
  const featured = businesses.filter((business) => business.featured);
  return (
    <>
      <section className="hero section-wrap">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> Your neighbourhood, now on the way</div>
          <h1>The good stuff is <em>closer</em> than you think.</h1>
          <p className="hero-lede">From the kitchen next door to your favourite chai stop — discover the people and places that make your corner of the world taste like home.</p>
          <form className="hero-search" onSubmit={onSearch}>
            <Search size={20} />
            <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search food, restaurants or shops" aria-label="Search food, restaurants or shops" />
            <button type="submit">Find it</button>
          </form>
          <div className="hero-trust"><span><ShieldCheck size={15} /> Local & verified</span><span><Zap size={15} /> Fast nearby delivery</span><span><WalletCards size={15} /> Cash or online</span></div>
        </div>
        <div className="hero-visual">
          <div className="hero-photo" style={{ backgroundImage: `url(${businesses[1]?.cover})` }}>
            <div className="hero-photo-shade" />
            <span className="photo-caption"><span className="live-pulse" /> Live around you</span>
          </div>
          <div className="floating-delivery-card">
            <div className="float-card-top"><span className="mini-avatar">N</span><span><strong>Neelam ji is cooking</strong><small>Maa Ki Rasoi · 1.2 km away</small></span><span className="green-check"><Check size={13} /></span></div>
            <div className="float-progress"><span style={{ width: "68%" }} /></div>
            <div className="float-card-bottom"><span><Clock3 size={14} /> Ready in 18 min</span><span className="float-arrow"><ArrowUpRightIcon /></span></div>
          </div>
          <div className="hero-sticker"><span>made</span><strong>nearby</strong><span>with care</span></div>
        </div>
      </section>

      <section className="section-wrap category-section">
        <div className="section-heading compact-heading"><div><span className="section-kicker">Pick your mood</span><h2>What are you craving?</h2></div><button className="text-button" onClick={() => onMap()}>See all <ArrowRight size={16} /></button></div>
        <div className="category-row">
          {categories.map((category) => <button key={category.name} className={cn("category-chip", `tone-${category.tone}`)} onClick={() => onCategory(category.name)}><span>{category.icon}</span><b>{category.name}</b></button>)}
        </div>
      </section>

      <section className="section-wrap feature-section">
        <div className="section-heading"><div><span className="section-kicker">Handpicked for you</span><h2>Good places, good people</h2><p>Small businesses around {location} that our community keeps coming back to.</p></div><button className="outline-button" onClick={onMap}><MapPinned size={16} /> Open area map</button></div>
        <div className="business-grid feature-grid">
          {featured.map((business) => <BusinessCard key={business.id} business={business} favorite={favorites.includes(business.id)} onOpen={() => onOpen(business.id)} onFavorite={() => onFavorite(business.id)} />)}
        </div>
      </section>

      <section className="section-wrap split-section">
        <div className="split-copy">
          <span className="section-kicker">More than a delivery app</span>
          <h2>Every order keeps the neighbourhood moving.</h2>
          <p>Haatly puts local kitchens, shops and riders in the same little ecosystem — so your money travels less distance and does more good.</p>
          <div className="impact-list"><div><span className="impact-icon mint"><Leaf size={18} /></span><span><strong>Small-batch by default</strong><small>Support the people behind your favourite food.</small></span></div><div><span className="impact-icon peach"><MapPin size={18} /></span><span><strong>Landmark-friendly addresses</strong><small>“Near the temple” works perfectly here.</small></span></div><div><span className="impact-icon yellow"><Bike size={18} /></span><span><strong>Riders who know the way</strong><small>Local routes, human support, fair earnings.</small></span></div></div>
          <button className="dark-button" onClick={() => onMap()}>Explore nearby <ArrowRight size={17} /></button>
        </div>
        <MapPreview businesses={businesses} onSelect={onOpen} />
      </section>

      <section className="section-wrap offer-strip">
        <div className="offer-copy"><span className="offer-label"><Sparkles size={14} /> This week in the village</span><h2>₹40 off your first local order</h2><p>Use code <strong>HAATLY40</strong> on orders above ₹399.</p><button className="light-button" onClick={() => onQueryChange("")}>Start exploring <ArrowRight size={16} /></button></div>
        <div className="offer-art"><div className="offer-sun" /><span className="offer-leaf leaf-one">✦</span><span className="offer-leaf leaf-two">✦</span><span className="offer-bowl">🥣</span></div>
      </section>

      <section className="section-wrap reassurance-section"><div><span className="section-kicker">Made for real life</span><h2>Simple enough for everyone.</h2></div><div className="reassurance-cards"><div><span className="reassurance-number">01</span><strong>Choose your spot</strong><p>Food, groceries, chai or home-cooked comfort.</p></div><div><span className="reassurance-number">02</span><strong>Tell us your landmark</strong><p>No confusing addresses needed.</p></div><div><span className="reassurance-number">03</span><strong>Follow the journey</strong><p>Clear updates from kitchen to doorstep.</p></div></div></section>
    </>
  );
}

function BusinessCard({ business, favorite, onOpen, onFavorite, compact = false }: { business: Business; favorite: boolean; onOpen: () => void; onFavorite: () => void; compact?: boolean }) {
  return (
    <article className={cn("business-card", compact && "business-card-compact")}>
      <div className="business-image-wrap">
        <button className="business-image-button" onClick={onOpen} aria-label={`Open ${business.name}`}><img src={business.cover} alt="" loading="lazy" /></button>
        <div className="image-topline"><span className="business-tag">{business.tags[0]}</span><button className={cn("heart-button", favorite && "saved")} onClick={onFavorite} aria-label={favorite ? `Remove ${business.name} from favourites` : `Save ${business.name} to favourites`}><Heart size={17} fill={favorite ? "currentColor" : "none"} /></button></div>
        <span className="eta-badge"><Timer size={13} /> {business.eta}</span>
      </div>
      <div className="business-card-body">
        <button className="business-title-button" onClick={onOpen}><span><h3>{business.name}</h3><small>{business.cuisines.slice(0, 2).join(" · ")}</small></span><ChevronRight size={17} /></button>
        <p className="business-description">{business.description}</p>
        <div className="business-meta"><span className="rating"><Star size={14} fill="currentColor" /> {business.rating}</span><span>{business.distance} km</span><span>{business.deliveryFee === 0 ? "Free delivery" : `${formatCurrency(business.deliveryFee)} delivery`}</span></div>
      </div>
    </article>
  );
}

function SearchPage({ query, results, favorites, onQueryChange, onSubmit, onOpen, onFavorite, onBack }: { query: string; results: Business[]; favorites: string[]; onQueryChange: (value: string) => void; onSubmit: (event?: { preventDefault: () => void }) => void; onOpen: (id: string) => void; onFavorite: (id: string) => void; onBack: () => void }) {
  const [mapMode, setMapMode] = useState(false);
  return (
    <section className="page-wrap search-page">
      <button className="back-button" onClick={onBack}><ArrowLeft size={16} /> Back home</button>
      <div className="search-page-heading"><div><span className="section-kicker">Explore the area</span><h1>Find something <em>nearby.</em></h1><p>{results.length} local places serving {query ? `“${query}”` : "your neighbourhood"}.</p></div><button className={cn("outline-button", mapMode && "active-outline")} onClick={() => setMapMode((mode) => !mode)}><MapPinned size={16} /> {mapMode ? "Show list" : "Open map"}</button></div>
      <form className="large-search-form" onSubmit={onSubmit}><Search size={20} /><input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Try “biryani”, “milk” or “chai”" autoFocus /><button type="submit">Search</button><button type="button" className="filter-button"><SlidersHorizontal size={17} /> Filters</button></form>
      {mapMode ? <div className="search-map-layout"><div className="map-result-list">{results.slice(0, 4).map((business) => <button className="map-result-row" key={business.id} onClick={() => onOpen(business.id)}><img src={business.cover} alt="" /><span><strong>{business.name}</strong><small>{business.category} · {business.distance} km</small><span className="rating"><Star size={12} fill="currentColor" /> {business.rating}</span></span><ChevronRight size={16} /></button>)}</div><MapPreview businesses={results.length ? results : seededBusinesses} onSelect={onOpen} /></div> : <>{results.length ? <div className="business-grid search-results">{results.map((business) => <BusinessCard key={business.id} business={business} favorite={favorites.includes(business.id)} onOpen={() => onOpen(business.id)} onFavorite={() => onFavorite(business.id)} />)}</div> : <EmptyState icon={<Search size={28} />} title="Nothing nearby yet" description="Try another dish, category or shop name." action="Clear search" onAction={() => onQueryChange("")} />}</>}
    </section>
  );
}

function RestaurantPage({ business, favorite, onBack, onFavorite, onAdd }: { business: Business; favorite: boolean; onBack: () => void; onFavorite: () => void; onAdd: (item: MenuItem) => void }) {
  const [activeCategory, setActiveCategory] = useState(business.menu[0]?.id ?? "");
  return (
    <section className="restaurant-page">
      <div className="restaurant-cover-wrap"><img src={business.cover} alt="" /><div className="restaurant-cover-shade" /><div className="restaurant-cover-actions page-wrap"><button className="round-back" onClick={onBack}><ArrowLeft size={19} /></button><div><button className={cn("round-back", favorite && "saved")} onClick={onFavorite}><Heart size={18} fill={favorite ? "currentColor" : "none"} /></button><button className="round-back"><MoreHorizontal size={19} /></button></div></div><div className="restaurant-cover-title page-wrap"><span className="business-tag light-tag">{business.tags[0]}</span><h1>{business.name}</h1><p>{business.description}</p></div></div>
      <div className="restaurant-content page-wrap">
        <div className="restaurant-summary"><div className="restaurant-logo"><img src={business.logo} alt="" /></div><div className="restaurant-facts"><div className="restaurant-fact-main"><span className="rating large-rating"><Star size={16} fill="currentColor" /> {business.rating}</span><span>{business.reviews} reviews</span><span>{business.cuisines.join(" · ")}</span></div><div className="restaurant-fact-sub"><span><Clock3 size={15} /> {business.eta}</span><span><MapPin size={15} /> {business.distance} km away</span><span><Bike size={15} /> {formatCurrency(business.deliveryFee)} delivery</span><span><ShoppingBag size={15} /> Min. {formatCurrency(business.minOrder)}</span></div><p className="address-line"><MapPin size={15} /> {business.address}</p></div><button className={cn("save-restaurant", favorite && "saved")} onClick={onFavorite}><Heart size={16} fill={favorite ? "currentColor" : "none"} /> {favorite ? "Saved" : "Save"}</button></div>
        <div className="menu-layout"><aside className="menu-sidebar"><span className="sidebar-label">Menu</span>{business.menu.map((section) => <button key={section.id} className={activeCategory === section.id ? "active" : ""} onClick={() => { setActiveCategory(section.id); document.getElementById(section.id)?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>{section.name}<span>{section.items.length}</span></button>)}<div className="sidebar-note"><ShieldCheck size={17} /><span><strong>Local & verified</strong><small>Clean prep spaces, trusted sellers.</small></span></div></aside><div className="menu-content"><div className="menu-mobile-scroll">{business.menu.map((section) => <button key={section.id} className={activeCategory === section.id ? "active" : ""} onClick={() => setActiveCategory(section.id)}>{section.name}</button>)}</div>{business.menu.map((section) => <div className="menu-section" id={section.id} key={section.id}><div className="menu-section-heading"><div><h2>{section.name}</h2><span>{section.items.length} items</span></div><span className="section-rule" /></div>{section.items.map((item) => <MenuItemRow key={item.id} item={item} onAdd={() => onAdd(item)} />)}</div>)}</div></div>
      </div>
    </section>
  );
}

function MenuItemRow({ item, onAdd }: { item: MenuItem; onAdd: () => void }) {
  return (
    <article className="menu-item-row"><div className="menu-item-copy"><div className={cn("veg-indicator", !item.isVeg && "non-veg")}><span /></div><h3>{item.name}</h3><strong>{formatCurrency(item.price)}</strong><p>{item.description}</p>{item.customizable && <span className="customize-label">Customizable</span>}</div><div className="menu-item-action">{item.image && <img src={item.image} alt="" loading="lazy" />}<button className="add-button" onClick={onAdd}><Plus size={16} /> Add</button></div></article>
  );
}

function CartDrawer({ cart, subtotal, deliveryFee, discount, total, onClose, onQuantity, onCheckout, onExplore }: { cart: CartLine[]; subtotal: number; deliveryFee: number; discount: number; total: number; onClose: () => void; onQuantity: (id: string, delta: number) => void; onCheckout: () => void; onExplore: () => void }) {
  return (
    <div className="drawer-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><aside className="cart-drawer" aria-label="Your basket"><div className="drawer-header"><div><span className="section-kicker">Your order</span><h2>Your basket <span>{cart.length ? `· ${cart.reduce((sum, item) => sum + item.quantity, 0)}` : ""}</span></h2></div><button className="icon-button" onClick={onClose} aria-label="Close basket"><X size={19} /></button></div>{cart.length ? <><div className="cart-business-pill"><span className="mini-logo"><Store size={15} /></span><span><strong>{cart[0].businessName}</strong><small>One business per order keeps it fresh.</small></span><Check size={16} /></div><div className="cart-lines">{cart.map((item) => <div className="cart-line" key={item.id}><div className="cart-line-image">{item.image ? <img src={item.image} alt="" /> : <span>🍽️</span>}</div><div className="cart-line-copy"><strong>{item.name}</strong><small>{formatCurrency(item.price)} each</small><div className="quantity-control"><button onClick={() => onQuantity(item.id, -1)} aria-label={`Remove one ${item.name}`}>−</button><span>{item.quantity}</span><button onClick={() => onQuantity(item.id, 1)} aria-label={`Add one ${item.name}`}>+</button></div></div><b>{formatCurrency(item.price * item.quantity)}</b></div>)}</div><div className="cart-note"><MessageCircle size={16} /><span>Have a note for the kitchen? You can add it at checkout.</span></div><div className="cart-summary"><SummaryRow label="Item total" value={formatCurrency(subtotal)} /><SummaryRow label="Delivery" value={deliveryFee ? formatCurrency(deliveryFee) : "Free"} /><SummaryRow label="Platform fee" value={formatCurrency(5)} /><SummaryRow label="Local offer" value={discount ? `−${formatCurrency(discount)}` : "—"} /><div className="summary-total"><span>Total</span><strong>{formatCurrency(total)}</strong></div></div><button className="dark-button full-button" onClick={onCheckout}>Go to checkout <ArrowRight size={17} /></button><button className="keep-shopping" onClick={onExplore}>Keep exploring</button></> : <EmptyState icon={<ShoppingBag size={28} />} title="Your basket is waiting" description="Add something lovely from a nearby kitchen or shop." action="Discover local places" onAction={onExplore} compact />}</aside></div>
  );
}

function CheckoutPage({ business, cart, subtotal, deliveryFee, discount, total, address, paymentMethod, isPlacing, onAddress, onPayment, onQuantity, onPlaceOrder, onBack }: { business?: Business; cart: CartLine[]; subtotal: number; deliveryFee: number; discount: number; total: number; address: string; paymentMethod: PaymentMethod; isPlacing: boolean; onAddress: (value: string) => void; onPayment: (value: PaymentMethod) => void; onQuantity: (id: string, delta: number) => void; onPlaceOrder: () => void; onBack: () => void }) {
  if (!business || !cart.length) return <EmptyState icon={<ShoppingBag size={28} />} title="Your basket is empty" description="Choose a local place and add a few favourites before checking out." action="Browse nearby" onAction={onBack} />;
  return (
    <section className="page-wrap checkout-page"><button className="back-button" onClick={onBack}><ArrowLeft size={16} /> Back to basket</button><div className="checkout-heading"><div><span className="section-kicker">Almost there</span><h1>Checkout, <em>made simple.</em></h1><p>Review your order from {business.name} and choose how we should find you.</p></div><span className="secure-note"><ShieldCheck size={16} /> Secure checkout</span></div><div className="checkout-layout"><div className="checkout-main"><CheckoutCard icon={<MapPin size={18} />} eyebrow="Deliver to" title="Your delivery spot"><div className="address-options"><button className="address-option active" onClick={() => onAddress("House 18, near Hanuman Mandir, Basantpur")}><span className="address-icon home-icon"><Home size={17} /></span><span><strong>Home</strong><small>House 18, near Hanuman Mandir, Basantpur</small></span><span className="radio-check"><Check size={13} /></span></button><button className="address-option" onClick={() => onAddress("Near the old water tank, Basantpur")}><span className="address-icon pin-icon"><MapPin size={17} /></span><span><strong>Old water tank</strong><small>12, Peepal Lane, Basantpur</small></span><span className="radio-empty" /></button><button className="add-address" onClick={() => onAddress("Add a landmark at checkout")}><Plus size={16} /> Add another address</button></div><label className="field-label">Delivery instructions<input value={address} onChange={(event) => onAddress(event.target.value)} placeholder="Call when you arrive, near the temple..." /></label></CheckoutCard><CheckoutCard icon={<CreditCard size={18} />} eyebrow="Pay your way" title="Payment method"><div className="payment-options"><PaymentOption method="COD" icon={<WalletCards size={19} />} title="Cash on delivery" description="Pay when your order arrives" selected={paymentMethod === "COD"} onSelect={() => onPayment("COD")} /><PaymentOption method="UPI" icon={<Zap size={19} />} title="UPI" description="GPay, PhonePe or any UPI app" selected={paymentMethod === "UPI"} onSelect={() => onPayment("UPI")} /><PaymentOption method="CARD" icon={<CreditCard size={19} />} title="Card" description="Secure card payment" selected={paymentMethod === "CARD"} onSelect={() => onPayment("CARD")} /></div></CheckoutCard><div className="checkout-support"><ShieldCheck size={19} /><span><strong>Your details stay private.</strong><small>We only share your landmark with the rider for this order.</small></span><CircleHelp size={17} /></div></div><aside className="checkout-summary"><div className="checkout-order-heading"><span>Order from</span><strong>{business.name}</strong><small>{business.eta} · {business.distance} km away</small></div><div className="checkout-lines">{cart.map((item) => <div className="checkout-line" key={item.id}><span><b>{item.quantity} ×</b> {item.name}</span><strong>{formatCurrency(item.price * item.quantity)}</strong><div className="checkout-qty"><button onClick={() => onQuantity(item.id, -1)}>−</button><span>{item.quantity}</span><button onClick={() => onQuantity(item.id, 1)}>+</button></div></div>)}</div><div className="free-delivery-message">{subtotal < 499 ? <><Zap size={15} /> Add {formatCurrency(499 - subtotal)} more to unlock free delivery</> : <><Check size={15} /> Free delivery unlocked</>}</div><div className="cart-summary"><SummaryRow label="Item total" value={formatCurrency(subtotal)} /><SummaryRow label="Delivery" value={deliveryFee ? formatCurrency(deliveryFee) : "Free"} /><SummaryRow label="Platform fee" value={formatCurrency(5)} /><SummaryRow label="Local offer" value={discount ? `−${formatCurrency(discount)}` : "—"} /><div className="summary-total"><span>Total to pay</span><strong>{formatCurrency(total)}</strong></div></div><button className="dark-button full-button place-order-button" onClick={onPlaceOrder} disabled={isPlacing}>{isPlacing ? <><span className="button-spinner" /> Placing order...</> : <>Place order <ArrowRight size={17} /></>}</button><small className="terms-copy">By placing this order, you agree to Haatly’s local delivery terms.</small></aside></div></section>
  );
}

function CheckoutCard({ icon, eyebrow, title, children }: { icon: React.ReactNode; eyebrow: string; title: string; children: React.ReactNode }) {
  return <section className="checkout-card"><div className="checkout-card-heading"><span className="checkout-card-icon">{icon}</span><span><small>{eyebrow}</small><h2>{title}</h2></span></div>{children}</section>;
}

function PaymentOption({ method, icon, title, description, selected, onSelect }: { method: PaymentMethod; icon: React.ReactNode; title: string; description: string; selected: boolean; onSelect: () => void }) {
  return <button className={cn("payment-option", selected && "selected")} onClick={onSelect}><span className="payment-icon">{icon}</span><span><strong>{title}</strong><small>{description}</small></span><span className={cn("payment-radio", selected && "selected")}>{selected && <Check size={12} />}</span><span className="payment-code">{method}</span></button>;
}

function TrackingPage({ order, step, onAdvance, onBack, onHome }: { order: OrderRecord; step: number; onAdvance: () => void; onBack: () => void; onHome: () => void }) {
  const progress = Math.min(step / (trackingStatuses.length - 1), 1);
  return (
    <section className="page-wrap tracking-page"><button className="back-button" onClick={onBack}><ArrowLeft size={16} /> Your orders</button><div className="tracking-heading"><div><span className="live-label"><span className="live-pulse" /> Live order</span><h1>On its way to <em>you.</em></h1><p>Order <strong>#{order.id}</strong> from {order.businessName} · {order.address}</p></div><button className="outline-button" onClick={onHome}><Home size={16} /> Back home</button></div><div className="tracking-grid"><div className="tracking-map-card"><div className="map-card-top"><span><span className="map-live-dot" /> Tracking now</span><span>Updates every few seconds</span></div><TrackingMap business={order.business} progress={progress} /><div className="map-legend"><span><i className="legend-dot restaurant-dot" /> {order.businessName}</span><span><i className="legend-dot rider-dot" /> Your rider</span><span><i className="legend-dot home-dot" /> Your home</span></div></div><aside className="tracking-side"><div className="eta-card"><div><span className="section-kicker">Estimated arrival</span><h2>{step >= 5 ? "Almost at your door" : `${Math.max(7, 22 - step * 3)} minutes`}</h2><p>{trackingStatuses[step]?.detail}</p></div><div className="eta-orbit"><Bike size={23} /></div></div><div className="status-card"><div className="status-card-heading"><span><span className="section-kicker">Order journey</span><h2>We’ll keep you posted</h2></span><span className="order-status-pill">{step >= 5 ? "On the way" : "In progress"}</span></div><div className="tracking-timeline">{trackingStatuses.map((status, index) => <div className={cn("timeline-item", index <= step && "complete", index === step && "current")} key={status.label}><span className="timeline-mark">{index < step ? <Check size={12} /> : index === step ? <span /> : null}</span><span><strong>{status.label}</strong><small>{index <= step ? (index === step ? status.detail : "Done") : "Up next"}</small></span></div>)}</div><button className="next-update-button" onClick={onAdvance} disabled={step >= trackingStatuses.length - 1}>{step >= trackingStatuses.length - 1 ? <><Check size={16} /> Delivery is close</> : <>Preview next update <ArrowRight size={16} /></>}</button></div><div className="rider-card"><span className="rider-avatar">RK</span><span><small>Your delivery partner</small><strong>Rakesh Kumar</strong><em>★ 4.9 · 248 local deliveries</em></span><div className="rider-actions"><button aria-label="Call rider"><Phone size={16} /></button><button aria-label="Message rider"><MessageCircle size={16} /></button></div></div><div className="order-help"><CircleHelp size={17} /><span><strong>Need a hand?</strong><small>Our local support team is here.</small></span><ChevronRight size={16} /></div></aside></div></section>
  );
}

function TrackingMap({ business, progress }: { business: Business; progress: number }) {
  const riderLeft = 28 + progress * 43;
  const riderTop = 61 - progress * 22;
  return <div className="tracking-map map-surface"><div className="map-blob blob-one" /><div className="map-blob blob-two" /><div className="map-lines"><span /><span /><span /><span /><span /><span /></div><div className="map-water" /><span className="map-street-label street-label-one">Main Bazaar Road</span><span className="map-street-label street-label-two">Peepal Lane</span><span className="map-street-label street-label-three">Canal Road</span><div className="route-path" style={{ clipPath: `polygon(18% 28%, ${riderLeft}% ${riderTop}%, 83% 74%, 18% 28%)` }} /><div className="map-pin business-map-pin" style={{ left: "18%", top: "28%" }}><Store size={15} /><span>{business.name}</span></div><div className="map-pin rider-map-pin" style={{ left: `${riderLeft}%`, top: `${riderTop}%` }}><Bike size={15} /></div><div className="map-pin home-map-pin" style={{ left: "83%", top: "74%" }}><Home size={15} /></div><span className="map-distance-bubble" style={{ left: `${Math.max(32, riderLeft - 5)}%`, top: `${Math.max(20, riderTop - 13)}%` }}>{Math.max(0.4, Number((1.8 - progress * 1.4).toFixed(1)))} km</span><div className="map-controls"><button><Plus size={17} /></button><button><span className="minus-icon">−</span></button><button><LocateFixed size={16} /></button></div></div>;
}

function OrdersPage({ orders, onTrack, onReorder, onExplore }: { orders: OrderRecord[]; onTrack: (order: OrderRecord) => void; onReorder: (order: OrderRecord) => void; onExplore: () => void }) {
  return <section className="page-wrap orders-page"><div className="page-title-row"><div><span className="section-kicker">Your Haatly</span><h1>Orders & <em>little joys.</em></h1><p>Every order is a thank-you to a local business.</p></div><button className="outline-button" onClick={onExplore}><Plus size={16} /> New order</button></div><div className="order-filter-row"><button className="filter-chip active">All orders</button><button className="filter-chip">Active</button><button className="filter-chip">Past orders</button><button className="filter-chip">Need a reorder</button></div><div className="orders-list">{orders.map((order, index) => <OrderCard key={`${order.id}-${index}`} order={order} onTrack={() => onTrack(order)} onReorder={() => onReorder(order)} />)}</div><div className="orders-footer"><div className="orders-footer-icon"><Heart size={20} fill="currentColor" /></div><span><strong>Keep discovering local</strong><small>There is always another good place around the corner.</small></span><button className="text-button" onClick={onExplore}>Explore <ArrowRight size={16} /></button></div></section>;
}

function OrderCard({ order, onTrack, onReorder }: { order: OrderRecord; onTrack: () => void; onReorder: () => void }) {
  const active = order.statusIndex < trackingStatuses.length - 1;
  return <article className="order-card"><div className="order-card-top"><div className="order-business-avatar"><img src={order.business.logo} alt="" /></div><div className="order-card-title"><h2>{order.businessName}</h2><span>{order.placedAt} · {order.lines.length} items · {formatCurrency(order.total)}</span></div><span className={cn("order-pill", active ? "active-order" : "complete-order")}>{active ? "In progress" : "Delivered"}</span><button className="more-button"><MoreHorizontal size={18} /></button></div><div className="order-card-middle"><div className="order-items-preview">{order.lines.map((line) => <span key={line.id}><b>{line.quantity}×</b> {line.name}</span>)}</div><div className="order-delivery-preview"><MapPin size={15} /><span>{order.address}</span></div></div><div className="order-card-bottom"><span className="payment-summary"><WalletCards size={15} /> {order.paymentMethod === "COD" ? "Cash on delivery" : order.paymentMethod}</span><div>{active ? <button className="dark-button small-button" onClick={onTrack}><Navigation size={15} /> Track order</button> : <button className="outline-button small-outline" onClick={onReorder}><RotateCcw size={15} /> Order again</button>}<button className="text-button subtle-button" onClick={() => onTrack()}>View details <ChevronRight size={15} /></button></div></div></article>;
}

function FavoritesPage({ favorites, onOpen, onFavorite, onExplore }: { favorites: Business[]; onOpen: (id: string) => void; onFavorite: (id: string) => void; onExplore: () => void }) {
  return <section className="page-wrap favorites-page"><div className="page-title-row"><div><span className="section-kicker">Saved for later</span><h1>Your <em>favourites.</em></h1><p>The places you want to come back to.</p></div><span className="saved-count"><Heart size={15} fill="currentColor" /> {favorites.length} saved</span></div>{favorites.length ? <div className="business-grid favorites-grid">{favorites.map((business) => <BusinessCard key={business.id} business={business} favorite onOpen={() => onOpen(business.id)} onFavorite={() => onFavorite(business.id)} />)}</div> : <EmptyState icon={<Heart size={28} />} title="Save the good stuff" description="Tap the heart on a local business and it will live here." action="Explore nearby" onAction={onExplore} />}</section>;
}

function ProfilePage({ location, apiOnline, onLocation, onWorkspace }: { location: string; apiOnline: boolean; onLocation: () => void; onWorkspace: (role: WorkspaceRole) => void }) {
  return <section className="page-wrap profile-page"><div className="profile-hero"><div className="profile-avatar-large">AS</div><div><span className="section-kicker">Your Haatly profile</span><h1>Hello, <em>Sumit.</em></h1><p>Member since 2024 · Basantpur local</p></div><button className="outline-button"><Settings2 size={16} /> Edit profile</button></div><div className="profile-grid"><div className="profile-main"><section className="profile-card location-card"><div className="profile-card-heading"><span className="profile-card-icon peach-icon"><MapPin size={18} /></span><span><small>Delivering to</small><h2>{location}</h2></span><button className="text-button" onClick={onLocation}>Change <ChevronRight size={15} /></button></div><div className="profile-address-row"><Home size={16} /><span><strong>Home</strong><small>House 18, near Hanuman Mandir, Basantpur</small></span><BadgeCheck size={17} /></div></section><section className="profile-card"><div className="profile-card-heading"><span className="profile-card-icon mint-icon"><Sparkles size={18} /></span><span><small>Try a different view</small><h2>Haatly workspaces</h2></span></div><div className="workspace-picker">{(Object.keys(workspaceCopy) as WorkspaceRole[]).map((workspaceRole) => { const WorkspaceIcon = workspaceCopy[workspaceRole].icon; return <button key={workspaceRole} onClick={() => onWorkspace(workspaceRole)}><span className={cn("workspace-picker-icon", workspaceRole)}><WorkspaceIcon size={18} /></span><span><strong>{workspaceCopy[workspaceRole].label}</strong><small>{workspaceCopy[workspaceRole].description}</small></span><ArrowUpRightIcon /></button>; })}</div></section><section className="profile-card preferences-card"><div className="profile-card-heading"><span className="profile-card-icon yellow-icon"><Languages size={18} /></span><span><small>Make it yours</small><h2>Preferences</h2></span></div><div className="preference-row"><span><Bell size={17} /><span><strong>Order updates</strong><small>Push notifications for active orders</small></span></span><span className="toggle on"><i /></span></div><div className="preference-row"><span><Languages size={17} /><span><strong>Language</strong><small>English · Hindi coming next</small></span></span><ChevronRight size={17} /></div></section></div><aside className="profile-side"><div className="profile-stat-card"><span className="section-kicker">Your local impact</span><strong>12</strong><p>orders that supported a nearby business</p><div className="impact-bar"><span style={{ width: "76%" }} /></div><small>76% of your recent orders stayed within 3 km</small></div><div className="profile-links-card"><ProfileLink icon={<CircleHelp size={17} />} label="Help & support" /><ProfileLink icon={<ShieldCheck size={17} />} label="Privacy & safety" /><ProfileLink icon={<Download size={17} />} label="Install Haatly" badge="PWA" /><ProfileLink icon={<LogOut size={17} />} label="Log out" danger /></div><div className={cn("connection-card", apiOnline ? "connected" : "not-connected")}><span /><span><strong>{apiOnline ? "Local API connected" : "Demo mode active"}</strong><small>{apiOnline ? "Orders are being validated server-side." : "Start the API to enable live validation."}</small></span></div></aside></div></section>;
}

function ProfileLink({ icon, label, badge, danger = false }: { icon: React.ReactNode; label: string; badge?: string; danger?: boolean }) { return <button className={cn("profile-link", danger && "danger-link")}><span>{icon}</span><strong>{label}</strong>{badge && <small>{badge}</small>}<ChevronRight size={16} /></button>; }

function WorkspacePage({ role, onRoleChange, onExit }: { role: WorkspaceRole; onRoleChange: (role: WorkspaceRole) => void; onExit: () => void }) {
  const [online, setOnline] = useState(true);
  const [merchantTab, setMerchantTab] = useState("Overview");
  const workspace = workspaceCopy[role];
  const WorkspaceIcon = workspace.icon;
  return <section className="workspace-page"><aside className="workspace-sidebar"><button className="workspace-brand" onClick={onExit}><span className="brand-mark">H</span><span>haatly<span>.</span></span></button><div className="workspace-switcher"><small>Viewing as</small><button><WorkspaceIcon size={17} /><span>{workspace.label}</span><ChevronDown size={15} /></button></div><div className="workspace-role-list">{(Object.keys(workspaceCopy) as WorkspaceRole[]).map((workspaceRole) => { const Icon = workspaceCopy[workspaceRole].icon; return <button className={role === workspaceRole ? "active" : ""} key={workspaceRole} onClick={() => onRoleChange(workspaceRole)}><Icon size={17} /><span>{workspaceCopy[workspaceRole].label}</span></button>; })}</div><div className="workspace-sidebar-bottom"><button><CircleHelp size={17} /> Help centre</button><button onClick={onExit}><ArrowLeft size={17} /> Back to customer</button></div></aside><div className="workspace-main"><header className="workspace-topbar"><div><span className="section-kicker">{workspace.label}</span><h1>{role === "merchant" ? "Good morning, Neelam ji." : role === "rider" ? "Ready for a good route?" : "Neighbourhood at a glance."}</h1></div><div className="workspace-top-actions"><button className="icon-button"><Bell size={18} /></button><button className="workspace-profile"><span>{role === "rider" ? "RK" : role === "admin" ? "AD" : "NJ"}</span><span><strong>{role === "rider" ? "Rakesh Kumar" : role === "admin" ? "Aditi · Admin" : "Maa Ki Rasoi"}</strong><small>Workspace account</small></span><ChevronDown size={15} /></button></div></header>{role === "merchant" && <MerchantDashboard tab={merchantTab} onTab={setMerchantTab} />}{role === "rider" && <RiderDashboard online={online} onToggle={() => setOnline((current) => !current)} />}{role === "admin" && <AdminDashboard />}</div></section>;
}

function MerchantDashboard({ tab, onTab }: { tab: string; onTab: (tab: string) => void }) {
  const tabs = ["Overview", "Orders", "Menu", "Customers", "Reviews", "Earnings", "Settings"];
  return <div className="dashboard-content"><div className="dashboard-tabs">{tabs.map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => onTab(item)}>{item}</button>)}</div>{tab === "Overview" ? <><div className="dashboard-welcome"><div><span className="live-label"><span className="live-pulse" /> Business is open</span><h2>Your kitchen is having a good day.</h2><p>Three orders are waiting for a little bit of your magic.</p></div><button className="dark-button"><Plus size={16} /> Add menu item</button></div><div className="kpi-grid"><DashboardKpi label="Today’s sales" value="₹4,280" change="+18.4%" icon={<CircleDollarSign size={18} />} tone="mint" /><DashboardKpi label="Orders today" value="28" change="+6 vs yesterday" icon={<ClipboardList size={18} />} tone="peach" /><DashboardKpi label="Avg. rating" value="4.9" change="From 132 reviews" icon={<Star size={18} />} tone="yellow" /><DashboardKpi label="Prep time" value="18 min" change="2 min faster" icon={<Timer size={18} />} tone="lavender" /></div><div className="dashboard-columns"><section className="dashboard-panel"><PanelHeading title="Needs your attention" action="View all" /><div className="merchant-order-list"><MerchantOrderRow time="12:58 PM" customer="Aarav S." items="Aangan Special Thali, 2× Roti" amount="₹231" status="New order" /><MerchantOrderRow time="12:46 PM" customer="Priya M." items="Paneer Tikka, Kadhi Chawal" amount="₹320" status="Preparing" preparing /><MerchantOrderRow time="12:31 PM" customer="Kabir R." items="Home-style Chicken Curry" amount="₹235" status="Ready for pickup" ready /></div></section><section className="dashboard-panel"><PanelHeading title="Popular this week" action="Manage menu" /><div className="popular-menu-row"><span className="popular-food">🍛</span><span><strong>Aangan Special Thali</strong><small>86 orders · ₹189</small></span><span className="trend-up">↗ 24%</span></div><div className="popular-menu-row"><span className="popular-food">🧀</span><span><strong>Smoky Paneer Tikka</strong><small>54 orders · ₹160</small></span><span className="trend-up">↗ 12%</span></div><div className="popular-menu-row"><span className="popular-food">🍗</span><span><strong>Home-style Chicken Curry</strong><small>41 orders · ₹220</small></span><span className="trend-up">↗ 8%</span></div><div className="mini-chart"><span style={{ height: "34%" }} /><span style={{ height: "48%" }} /><span style={{ height: "41%" }} /><span style={{ height: "68%" }} /><span style={{ height: "57%" }} /><span style={{ height: "86%" }} /><span style={{ height: "78%" }} /></div><small className="chart-caption">Orders · Mon to Sun</small></section></div></> : <DashboardPlaceholder tab={tab} />}</div>;
}

function MerchantOrderRow({ time, customer, items, amount, status, preparing = false, ready = false }: { time: string; customer: string; items: string; amount: string; status: string; preparing?: boolean; ready?: boolean }) {
  return <div className="merchant-order-row"><span className="merchant-order-time">{time}</span><span className="merchant-customer-avatar">{customer.split(" ").map((part) => part[0]).join("")}</span><span className="merchant-order-info"><strong>{customer}</strong><small>{items}</small></span><strong className="merchant-amount">{amount}</strong><span className={cn("merchant-status", preparing && "preparing", ready && "ready")}>{status}</span><button className="more-button"><MoreHorizontal size={17} /></button></div>;
}

function RiderDashboard({ online, onToggle }: { online: boolean; onToggle: () => void }) {
  return <div className="dashboard-content rider-content"><div className="rider-top-card"><div><span className="section-kicker">Your shift</span><h2>{online ? "You’re visible to nearby kitchens." : "You’re off the road for now."}</h2><p>{online ? "We’ll only share requests that make sense for your route." : "Go online when you’re ready to pick up a delivery."}</p></div><button className={cn("online-switch", online && "active")} onClick={onToggle}><span /><strong>{online ? "Online" : "Offline"}</strong></button></div><div className="kpi-grid"><DashboardKpi label="Today’s earnings" value="₹840" change="+₹120 vs yesterday" icon={<CircleDollarSign size={18} />} tone="mint" /><DashboardKpi label="Deliveries" value="14" change="2 active requests" icon={<Bike size={18} />} tone="peach" /><DashboardKpi label="Your rating" value="4.9" change="248 deliveries" icon={<Star size={18} />} tone="yellow" /><DashboardKpi label="Time on road" value="4h 12m" change="This week · 21h" icon={<Clock3 size={18} />} tone="lavender" /></div><div className="rider-columns"><section className="dashboard-panel rider-request-panel"><PanelHeading title="Delivery requests" action="View history" /><DeliveryRequest restaurant="Maa Ki Rasoi" order="2 bags · ₹231 COD" distance="1.4 km" payout="₹48" tone="mint" /><DeliveryRequest restaurant="The Banyan Dhaba" order="3 items · Online paid" distance="2.1 km" payout="₹62" tone="peach" /></section><section className="dashboard-panel rider-route-panel"><PanelHeading title="Your route today" action="Open map" /><div className="route-summary"><div className="route-line"><span className="route-stop done"><Check size={12} /></span><span><strong>Maa Ki Rasoi</strong><small>Picked up · 12:58 PM</small></span></div><div className="route-connector" /><div className="route-line"><span className="route-stop current"><Bike size={12} /></span><span><strong>House 18, Basantpur</strong><small>1.2 km · 7 min away</small></span></div></div><button className="dark-button full-button"><Navigation size={15} /> Start navigation</button></section></div></div>;
}

function DeliveryRequest({ restaurant, order, distance, payout, tone }: { restaurant: string; order: string; distance: string; payout: string; tone: string }) { return <div className="delivery-request"><span className={cn("request-icon", tone)}>🚲</span><span><strong>{restaurant}</strong><small>{order} · {distance}</small></span><span className="request-payout"><strong>{payout}</strong><small>estimated</small></span><button className="accept-button">Accept</button><button className="request-menu"><MoreHorizontal size={17} /></button></div>; }

function AdminDashboard() {
  return <div className="dashboard-content admin-content"><div className="admin-notice"><span><Sparkles size={17} /><strong>Good afternoon, Aditi.</strong><small>Service area is healthy · 4 deliveries active right now.</small></span><button className="outline-button"><Download size={15} /> Export report</button></div><div className="kpi-grid admin-kpis"><DashboardKpi label="Orders today" value="42" change="+12.8%" icon={<ClipboardList size={18} />} tone="mint" /><DashboardKpi label="Gross order value" value="₹18.4k" change="+8.2%" icon={<CircleDollarSign size={18} />} tone="peach" /><DashboardKpi label="Active businesses" value="24" change="3 pending review" icon={<Store size={18} />} tone="yellow" /><DashboardKpi label="Avg. delivery" value="27 min" change="−3 min this week" icon={<Timer size={18} />} tone="lavender" /></div><div className="admin-grid"><section className="dashboard-panel live-ops-panel"><PanelHeading title="Live operations" action="Open full map" /><div className="admin-map"><MapPreview businesses={seededBusinesses.slice(0, 5)} onSelect={() => undefined} /><div className="admin-map-overlay"><span><i className="legend-dot rider-dot" /> 7 riders online</span><span><i className="legend-dot restaurant-dot" /> 4 active orders</span></div></div></section><section className="dashboard-panel verification-panel"><PanelHeading title="Verification queue" action="Review all" /><div className="verification-row"><span className="verification-avatar">SS</span><span><strong>Sharma Sweets</strong><small>Restaurant · Submitted 18m ago</small></span><span className="pending-dot">Pending</span></div><div className="verification-row"><span className="verification-avatar green-avatar">AG</span><span><strong>Arjun Grocery</strong><small>Local shop · Submitted 42m ago</small></span><span className="pending-dot">Pending</span></div><div className="verification-row"><span className="verification-avatar purple-avatar">VK</span><span><strong>Vikram Kumar</strong><small>Delivery partner · Submitted 1h ago</small></span><span className="pending-dot">Pending</span></div></section></div><section className="dashboard-panel table-panel"><PanelHeading title="Recent orders" action="View all orders" /><div className="admin-table"><div className="table-header"><span>Order</span><span>Business</span><span>Customer</span><span>Status</span><span>Total</span><span /></div><AdminOrderRow id="#HAT-2408" business="Maa Ki Rasoi" customer="Aarav S." status="On the way" total="₹310" active /><AdminOrderRow id="#HAT-2407" business="Chai Chowk" customer="Meera P." status="Preparing" total="₹120" /><AdminOrderRow id="#HAT-2406" business="Banyan Dhaba" customer="Kabir R." status="Delivered" total="₹542" delivered /></div></section></div>;
}

function AdminOrderRow({ id, business, customer, status, total, active = false, delivered = false }: { id: string; business: string; customer: string; status: string; total: string; active?: boolean; delivered?: boolean }) { return <div className="table-row"><span><strong>{id}</strong><small>Today · 12:58</small></span><span>{business}</span><span>{customer}</span><span className={cn("table-status", active && "active", delivered && "delivered")}>{status}</span><span><strong>{total}</strong></span><button className="more-button"><MoreHorizontal size={17} /></button></div>; }

function DashboardKpi({ label, value, change, icon, tone }: { label: string; value: string; change: string; icon: React.ReactNode; tone: string }) { return <div className="dashboard-kpi"><span className={cn("kpi-icon", tone)}>{icon}</span><span><small>{label}</small><strong>{value}</strong><em>{change}</em></span></div>; }
function PanelHeading({ title, action }: { title: string; action: string }) { return <div className="panel-heading"><h3>{title}</h3><button className="text-button">{action} <ArrowRight size={14} /></button></div>; }
function DashboardPlaceholder({ tab }: { tab: string }) { return <div className="dashboard-placeholder"><span><Settings2 size={25} /></span><h2>{tab} is ready for your workflow.</h2><p>This workspace keeps the core modules separate so menus, orders, customers and earnings can grow without becoming overwhelming.</p><button className="dark-button">Configure {tab.toLowerCase()} <ArrowRight size={16} /></button></div>; }

function MapPreview({ businesses, onSelect }: { businesses: Business[]; onSelect: (id: string) => void }) {
  const positions = [[24, 31], [59, 25], [78, 54], [42, 67], [17, 70], [67, 78]];
  return <div className="map-preview map-surface"><div className="map-blob blob-one" /><div className="map-blob blob-two" /><div className="map-lines"><span /><span /><span /><span /><span /><span /></div><div className="map-water" /><span className="map-street-label street-label-one">Basantpur Main Road</span><span className="map-street-label street-label-two">Canal Road</span><span className="map-street-label street-label-three">School Lane</span><div className="map-badge"><span className="map-live-dot" /> Nearby right now</div>{businesses.slice(0, 6).map((business, index) => { const position = positions[index % positions.length]; return <button key={business.id} className="business-map-marker" style={{ left: `${position[0]}%`, top: `${position[1]}%` }} onClick={() => onSelect(business.id)} aria-label={`View ${business.name}`}><span className="marker-icon">{business.kind === "grocery" ? <ShoppingBasket size={15} /> : business.kind === "bakery" ? <Sparkles size={15} /> : business.kind === "home-kitchen" ? <Home size={15} /> : <Utensils size={15} />}</span><small>{business.name}</small></button>; })}<div className="your-location-marker"><span><LocateFixed size={16} /></span><small>You are here</small></div><div className="map-controls"><button><Plus size={17} /></button><button><span className="minus-icon">−</span></button><button><LocateFixed size={16} /></button></div></div>;
}

function LocationModal({ current, onClose, onSelect }: { current: string; onClose: () => void; onSelect: (value: string) => void }) {
  const locations = ["Basantpur village", "Nearby market", "Main town"];
  return <div className="modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className="location-modal"><div className="modal-heading"><span className="modal-icon"><MapPin size={20} /></span><div><span className="section-kicker">Your delivery area</span><h2>Where should we bring it?</h2></div><button className="icon-button" onClick={onClose}><X size={18} /></button></div><button className="detect-location"><LocateFixed size={18} /><span><strong>Use my current location</strong><small>We’ll only use this for delivery estimates.</small></span><ChevronRight size={17} /></button><div className="location-divider"><span>or choose an area</span></div><div className="location-list">{locations.map((location) => <button className={cn(location === current && "selected")} key={location} onClick={() => onSelect(location)}><span className="location-list-icon"><MapPin size={16} /></span><span><strong>{location}</strong><small>{location === "Basantpur village" ? "All local kitchens and shops" : "Delivery availability may vary"}</small></span>{location === current ? <span className="radio-check"><Check size={13} /></span> : <ChevronRight size={16} />}</button>)}</div><p className="modal-footnote"><ShieldCheck size={14} /> Your precise location is never shown publicly.</p></div></div>;
}

function EmptyState({ icon, title, description, action, onAction, compact = false }: { icon: React.ReactNode; title: string; description: string; action: string; onAction: () => void; compact?: boolean }) { return <div className={cn("empty-state", compact && "empty-state-compact")}><span className="empty-icon">{icon}</span><h2>{title}</h2><p>{description}</p><button className="dark-button" onClick={onAction}>{action} <ArrowRight size={16} /></button></div>; }
function SummaryRow({ label, value }: { label: string; value: string }) { return <div className="summary-row"><span>{label}</span><strong>{value}</strong></div>; }
function Toast({ message, tone }: { message: string; tone: ToastTone }) { return <div className={cn("toast", tone)}><span>{tone === "success" ? <Check size={15} /> : tone === "warning" ? <AlertCircle size={15} /> : <Sparkles size={15} />}</span>{message}</div>; }
function ArrowUpRightIcon() { return <ArrowRight size={15} className="arrow-up-right" />; }

export default App;
