export interface Product {
  id: string;
  name: string;
  emoji: string;
  price: number;
  originalPrice: number;
  section: 'sale' | 'veg' | 'meat' | 'proc';
  origin: string;
  category: '야채/채소' | '과일' | '축산/계란' | '수산/건어물' | '라면/면류' | '유제품/냉장/냉동' | '캔/통조림';
  storage: string;
  unit: string;
  desc: string;
  imageUrl?: string;
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
  imageUrl?: string;
}
