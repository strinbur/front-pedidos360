import { Injectable, computed, signal } from '@angular/core';
import { CartItem } from '../../models/cart.model';
import { Product } from '../../models/product.model';

const STORAGE_KEY = 'pedidos360-cart';

@Injectable({ providedIn: 'root' })
export class CartService {
  private items = signal<CartItem[]>(this.loadFromStorage());

  cartItems = this.items.asReadonly();

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

  private setItems(items: CartItem[]): void {
    this.items.set(items);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  private loadFromStorage(): CartItem[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }
}