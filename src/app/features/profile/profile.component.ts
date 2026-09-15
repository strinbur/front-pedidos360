import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MsalAuthService } from '../../core/msal-auth/msal-auth.service';
import { CartService } from '../cart/cart.service';
import { Order, OrderItem } from '../../models/order.model';
import { environment } from '../../../enviroments/enviroment.development';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {
  private msalAuth = inject(MsalAuthService);
  private cartService = inject(CartService);

  user = signal(this.msalAuth.getUser());
  orders = computed(() => {
    const email = this.user()?.email?.toLowerCase();
    if (!email) {
      return [];
    }

    return this.cartService.orderHistory().filter((order) =>
      order.customer?.email?.toLowerCase() === email
    );
  });

  totalSpent = computed(() =>
    this.orders().reduce((total, order) => total + order.total, 0)
  );

  ordersPageSize = signal(5);
  ordersPage = signal(1);
  orderItemPages = signal<Record<string, number>>({});

  pagedOrders = computed(() => {
    const start = (this.ordersPage() - 1) * this.ordersPageSize();
    return this.orders().slice(start, start + this.ordersPageSize());
  });

  ordersTotalPages = computed(() =>
    Math.max(1, Math.ceil(this.orders().length / this.ordersPageSize()))
  );

  getImageUrl(image?: string): string | null {
    if (!image) {
      return null;
    }

    if (image.startsWith('data:') || image.startsWith('http://') || image.startsWith('https://')) {
      return image;
    }

    return `${environment.apiUrl}/${image.replace(/^\/+/, '')}`;
  }

  setOrdersPageSize(value: string): void {
    this.ordersPageSize.set(Number(value));
    this.ordersPage.set(1);
  }

  goToOrdersPage(page: number): void {
    this.ordersPage.set(Math.max(1, Math.min(page, this.ordersTotalPages())));
  }

  getOrderItems(order: Order): OrderItem[] {
    return order.items ?? [];
  }

  getPagedOrderItems(order: Order): OrderItem[] {
    const page = this.orderItemPages()[order.id] ?? 1;
    const start = (page - 1) * 5;
    return this.getOrderItems(order).slice(start, start + 5);
  }

  getOrderItemTotalPages(order: Order): number {
    return Math.max(1, Math.ceil(this.getOrderItems(order).length / 5));
  }

  getOrderItemPage(order: Order): number {
    return this.orderItemPages()[order.id] ?? 1;
  }

  goToOrderItemPage(order: Order, page: number): void {
    const safePage = Math.max(1, Math.min(page, this.getOrderItemTotalPages(order)));
    this.orderItemPages.update((pages) => ({ ...pages, [order.id]: safePage }));
  }
}
