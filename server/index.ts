import express from "express";
import cors from "cors";
import { z } from "zod";
import { businesses, getMenuItems, type Business } from "../src/data.js";

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));

const orderStatuses = [
  "PENDING",
  "ACCEPTED",
  "PREPARING",
  "READY_FOR_PICKUP",
  "DELIVERY_ASSIGNED",
  "PICKED_UP",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;

type OrderStatus = (typeof orderStatuses)[number];

type StoredOrder = {
  id: string;
  businessId: string;
  businessName: string;
  items: Array<{ itemId: string; name: string; quantity: number; unitPrice: number }>;
  subtotal: number;
  deliveryFee: number;
  platformFee: number;
  discount: number;
  total: number;
  address: string;
  paymentMethod: string;
  status: OrderStatus;
  statusHistory: Array<{ status: OrderStatus; at: string }>;
  createdAt: string;
};

const orders = new Map<string, StoredOrder>();
const activeLocations = new Map<string, { lat: number; lng: number; recordedAt: string }>();

const createId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
const orderRequestSchema = z.object({
  businessId: z.string().min(1),
  items: z
    .array(
      z.object({
        itemId: z.string().min(1),
        quantity: z.number().int().min(1).max(30),
      }),
    )
    .min(1),
  address: z.string().min(8).max(240),
  paymentMethod: z.enum(["COD", "UPI", "CARD"]),
  couponCode: z.string().max(40).optional(),
});

const findBusiness = (id: string) => businesses.find((business) => business.id === id);

const calculateOrder = (business: Business, requestedItems: Array<{ itemId: string; quantity: number }>) => {
  const catalog = new Map(getMenuItems(business).map((item) => [item.id, item]));
  const items = requestedItems.map(({ itemId, quantity }) => {
    const item = catalog.get(itemId);
    if (!item) throw new Error(`The item ${itemId} is no longer available.`);
    return { itemId: item.id, name: item.name, quantity, unitPrice: item.price };
  });
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  if (subtotal < business.minOrder) {
    throw new Error(`Add ${business.minOrder - subtotal} more to reach the minimum order.`);
  }
  const discount = requestedItems.length > 0 && subtotal >= 399 ? 40 : 0;
  const deliveryFee = subtotal - discount >= 499 ? 0 : business.deliveryFee;
  const platformFee = 5;
  return {
    items,
    subtotal,
    deliveryFee,
    platformFee,
    discount,
    total: subtotal + deliveryFee + platformFee - discount,
  };
};

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "haatly-api", environment: process.env.NODE_ENV ?? "development", timestamp: new Date().toISOString() });
});

app.get("/api/businesses", (req, res) => {
  const query = String(req.query.q ?? "").trim().toLowerCase();
  const category = String(req.query.category ?? "").trim().toLowerCase();
  const openOnly = req.query.open === "true";
  const result = businesses.filter((business) => {
    const searchable = [business.name, business.category, business.description, ...business.cuisines, ...getMenuItems(business).map((item) => item.name)]
      .join(" ")
      .toLowerCase();
    return (!query || searchable.includes(query)) && (!category || business.category.toLowerCase() === category) && (!openOnly || business.isOpen);
  });
  res.json({ data: result, meta: { count: result.length, serviceArea: "Basantpur and nearby villages" } });
});

app.get("/api/businesses/:businessId", (req, res) => {
  const business = findBusiness(req.params.businessId);
  if (!business) return res.status(404).json({ error: "Business not found" });
  return res.json({ data: business });
});

app.post("/api/orders", (req, res) => {
  const parsed = orderRequestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Please check the order details.", details: parsed.error.flatten() });

  const business = findBusiness(parsed.data.businessId);
  if (!business) return res.status(404).json({ error: "This business is no longer available." });
  if (!business.isOpen) return res.status(409).json({ error: "This business is currently closed." });

  try {
    const totals = calculateOrder(business, parsed.data.items);
    const now = new Date().toISOString();
    const order: StoredOrder = {
      id: createId("HAT"),
      businessId: business.id,
      businessName: business.name,
      ...totals,
      address: parsed.data.address,
      paymentMethod: parsed.data.paymentMethod,
      status: "PENDING",
      statusHistory: [{ status: "PENDING", at: now }],
      createdAt: now,
    };
    orders.set(order.id, order);
    return res.status(201).json({ data: order });
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : "Unable to create order" });
  }
});

app.get("/api/orders/:orderId", (req, res) => {
  const order = orders.get(req.params.orderId);
  if (!order) return res.status(404).json({ error: "Order not found" });
  return res.json({ data: order });
});

app.patch("/api/orders/:orderId/status", (req, res) => {
  const order = orders.get(req.params.orderId);
  if (!order) return res.status(404).json({ error: "Order not found" });
  const status = z.enum(orderStatuses).safeParse(req.body?.status);
  if (!status.success) return res.status(400).json({ error: "Unsupported order status" });
  const updated = { ...order, status: status.data, statusHistory: [...order.statusHistory, { status: status.data, at: new Date().toISOString() }] };
  orders.set(order.id, updated);
  return res.json({ data: updated });
});

app.post("/api/delivery/location", (req, res) => {
  const parsed = z.object({ orderId: z.string(), lat: z.number(), lng: z.number() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "A valid active delivery location is required." });
  const order = orders.get(parsed.data.orderId);
  if (!order || !["DELIVERY_ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"].includes(order.status)) {
    return res.status(403).json({ error: "Location updates are only allowed for active deliveries." });
  }
  const location = { lat: parsed.data.lat, lng: parsed.data.lng, recordedAt: new Date().toISOString() };
  activeLocations.set(order.id, location);
  return res.status(202).json({ data: location });
});

app.get("/api/delivery/location/:orderId", (req, res) => {
  const location = activeLocations.get(req.params.orderId);
  if (!location) return res.status(404).json({ error: "No active location for this order" });
  return res.json({ data: location });
});

app.get("/api/admin/summary", (_req, res) => {
  const allOrders = Array.from(orders.values());
  res.json({
    data: {
      customers: 428,
      businesses: businesses.length,
      deliveryPartnersOnline: 7,
      ordersToday: allOrders.length + 38,
      revenueToday: allOrders.reduce((sum, order) => sum + order.total, 0) + 18450,
      averageDeliveryMinutes: 27,
      pendingVerifications: 3,
      activeOrders: allOrders.filter((order) => !["DELIVERED", "CANCELLED", "REFUNDED"].includes(order.status)).length + 4,
    },
  });
});

app.use((_req, res) => res.status(404).json({ error: "Route not found" }));

app.listen(port, "0.0.0.0", () => {
  console.log(`Haatly API listening on http://0.0.0.0:${port}`);
});
