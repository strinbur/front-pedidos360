import { Injectable, computed, signal } from '@angular/core';
import { CartItem } from '../../models/cart.model';
import { Product } from '../../models/product.model';
import { Order, OrderCustomer, OrderStatus } from '../../models/order.model';

const STORAGE_KEY = 'pedidos360-cart';
const ORDERS_STORAGE_KEY = 'pedidos360-orders';

@Injectable({ providedIn: 'root' })
export class CartService {
  private items = signal<CartItem[]>(this.loadFromStorage());
  private orders = signal<Order[]>(this.loadOrdersFromStorage());

  cartItems = this.items.asReadonly();
  orderHistory = this.orders.asReadonly();

  totalItems = computed(() =>
    this.items().reduce((sum, item) => sum + item.quantity, 0)
  );

  addToCart(product: Product): void {
    const current = this.items();
    const existing = current.find((item) => item.product.id === product.id);

    if (existing) {
      this.updateQuantity(product.id!, existing.quantity + 1);
      return;
    }

    const updated = [...current, { product, quantity: 1 }];
    this.setItems(updated);
  }

  removeFromCart(productId: string): void {
    const updated = this.items().filter((item) => item.product.id !== productId);
    this.setItems(updated);
  }

  updateQuantity(productId: string, quantity: number): void {
    if (quantity < 1) {
      this.removeFromCart(productId);
      return;
    }

    const updated = this.items().map((item) =>
      item.product.id === productId ? { ...item, quantity } : item
    );
    this.setItems(updated);
  }

  clear(): void {
    this.setItems([]);
  }

  checkout(totalFromApi: number, customer: OrderCustomer): Order {
    const items = this.items();
    const order: Order = {
      id: this.generateOrderId(),
      date: new Date().toISOString(),
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      total: totalFromApi,
      status: 'Pendiente',
      customer,
      items: items.map((item) => ({
        productId: item.product.id!,
        name: item.product.name,
        imageUrl: item.product.imageUrl ?? item.product.image,
        price: item.product.price,
        quantity: item.quantity,
        subtotal: item.product.price * item.quantity
      }))
    };

    const updatedOrders = [order, ...this.orders()];
    this.orders.set(updatedOrders);
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updatedOrders));
    this.clear();
    return order;
  }

  updateOrderStatus(orderId: string, status: OrderStatus): Order | null {
    const order = this.orders().find((item) => item.id === orderId);
    if (!order) {
      return null;
    }

    const updatedOrder = { ...order, status };
    const updatedOrders = this.orders().map((item) =>
      item.id === orderId ? updatedOrder : item
    );
    this.orders.set(updatedOrders);
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updatedOrders));
    return updatedOrder;
  }
  private setItems(items: CartItem[]): void {
    this.items.set(items);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  private loadFromStorage(): CartItem[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  private loadOrdersFromStorage(): Order[] {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  private generateOrderId(): string {
    const next = this.orders().length + 1;
    return `PED-${String(next).padStart(4, '0')}`;
  }

}