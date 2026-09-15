export type OrderStatus = 'Pendiente' | 'Confirmado' | 'Enviado' | 'Cancelado';

export interface OrderCustomer {
  name: string;
  email: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  imageUrl?: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  date: string;
  itemCount: number;
  total: number;
  status: OrderStatus;
  customer: OrderCustomer;
  items?: OrderItem[];
}

export interface CreateOrderRequest {
  items: OrderItem[];
  total: number;
  customer: OrderCustomer;
}