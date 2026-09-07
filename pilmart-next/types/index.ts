export interface Product {
  id: string;
  name: string;
  emoji: string;
  price: number;
  originalPrice: number;
  section: string;
  origin: string;
  category: string;
  storage: string;
  unit: string;
  desc: string;
  imageUrl?: string;
  maxQty?: number;
}

export interface CartItem extends Product {
  qty: number;
}

export interface Order {
  orderId: string;
  items: CartItem[];
  total: number;
  method: string;
  createdAt: number;
  paymentKey?: string;
  customerName?: string;
}

export interface Session {
  name: string;
  phone: string;
  loginAt: number;
  provider?: 'local' | 'naver' | 'kakao' | 'google';
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  important?: boolean;
}

export interface FlashProduct {
  idx: number;
  name: string;
  emoji?: string;
  price: number;
  originalPrice: number;
  imageUrl?: string;
  desc?: string;
  maxPerCustomer: number;
}

export interface FlashSaleConfig {
  startHour: number;
  endHour: number;
  products: FlashProduct[];
}

export interface StoreInfo {
  name: string;
  phone: string;
  address: string;
  hours?: string;
}

export interface ProductOverride {
  name?: string;
  price?: number;
  originalPrice?: number;
  imageUrl?: string;
  category?: string;
  desc?: string;
  unit?: string;
  origin?: string;
  storage?: string;
}

export interface StoredUser {
  phone: string;
  name: string;
  passwordHash: string;
  userType?: 'personal' | 'business';
  businessNo?: string;
  businessName?: string;
  businessType?: string;
  businessCategory?: string;
}
