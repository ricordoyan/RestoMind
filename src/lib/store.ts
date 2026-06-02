"use client";

// Client-side data layer (localStorage) for the order-taking + menu-engineering
// pivot. No database: the AI phone agent appends orders here, and the insights
// dashboard reads them. SSR-safe (all access guarded by typeof window).

export type MenuItem = {
  id: string;
  name: string;
  price: number; // sell price per unit
  cost: number; // food cost per unit
  category?: string;
};

export type OrderItem = {
  name: string;
  qty: number;
  unitPrice: number;
};

export type Order = {
  id: string;
  createdAt: string; // ISO timestamp
  source: "phone" | "upload";
  items: OrderItem[];
  total: number;
};

const MENU_KEY = "rc_menu";
const ORDERS_KEY = "rc_orders";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota / serialization errors
  }
}

export const getMenu = (): MenuItem[] => read<MenuItem[]>(MENU_KEY, []);
export const saveMenu = (items: MenuItem[]): void => write(MENU_KEY, items);

export const getOrders = (): Order[] => read<Order[]>(ORDERS_KEY, []);
export const addOrder = (order: Order): void => write(ORDERS_KEY, [...getOrders(), order]);
export const addOrders = (orders: Order[]): void => write(ORDERS_KEY, [...getOrders(), ...orders]);
export const clearOrders = (): void => write(ORDERS_KEY, []);

export function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ---- Deterministic aggregation for menu engineering ----

export type DishStat = {
  name: string;
  units: number;
  revenue: number;
  cost: number;
  profit: number;
  marginPct: number; // profit / revenue * 100
  price: number; // unit price (from menu or order)
  hasCost: boolean; // whether a menu cost was found
};

export type OrderTotals = {
  totalOrders: number;
  totalUnits: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  avgOrderValue: number;
};

export function aggregateOrders(
  orders: Order[],
  menu: MenuItem[]
): { dishStats: DishStat[]; totals: OrderTotals } {
  const menuByName = new Map(menu.map((m) => [m.name.trim().toLowerCase(), m]));
  const acc = new Map<string, DishStat>();

  for (const order of orders) {
    for (const item of order.items) {
      const key = item.name.trim().toLowerCase();
      const menuItem = menuByName.get(key);
      const unitPrice = item.unitPrice || menuItem?.price || 0;
      const unitCost = menuItem?.cost ?? 0;
      const existing =
        acc.get(key) ??
        ({
          name: menuItem?.name || item.name,
          units: 0,
          revenue: 0,
          cost: 0,
          profit: 0,
          marginPct: 0,
          price: unitPrice,
          hasCost: menuItem != null,
        } as DishStat);
      existing.units += item.qty;
      existing.revenue += unitPrice * item.qty;
      existing.cost += unitCost * item.qty;
      existing.price = unitPrice;
      acc.set(key, existing);
    }
  }

  const dishStats = Array.from(acc.values()).map((d) => {
    d.profit = d.revenue - d.cost;
    d.marginPct = d.revenue > 0 ? Math.round((d.profit / d.revenue) * 1000) / 10 : 0;
    d.revenue = Math.round(d.revenue * 100) / 100;
    d.cost = Math.round(d.cost * 100) / 100;
    d.profit = Math.round(d.profit * 100) / 100;
    return d;
  });
  dishStats.sort((a, b) => b.units - a.units);

  const totalRevenue = dishStats.reduce((s, d) => s + d.revenue, 0);
  const totalCost = dishStats.reduce((s, d) => s + d.cost, 0);
  const totalUnits = dishStats.reduce((s, d) => s + d.units, 0);
  const totals: OrderTotals = {
    totalOrders: orders.length,
    totalUnits,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    totalProfit: Math.round((totalRevenue - totalCost) * 100) / 100,
    avgOrderValue: orders.length ? Math.round((totalRevenue / orders.length) * 100) / 100 : 0,
  };

  return { dishStats, totals };
}
