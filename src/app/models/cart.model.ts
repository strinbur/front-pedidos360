import { Product } from './product.model';

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CartCalculateItemRequest {
  productId: string;
  quantity: number;
}

export interface CartCalculateRequest {
  items: CartCalculateItemRequest[];
}

export interface CartCalculateItemResponse {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface CartCalculateResponse {
  items: CartCalculateItemResponse[];
  total: number;
}