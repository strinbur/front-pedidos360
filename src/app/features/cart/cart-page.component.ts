import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Icon } from '../../shared/icon/icon';
import { CartService } from './cart.service';
import { CartApiService } from './cart-api.service';
import { environment } from '../../../enviroments/enviroment.development';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [CommonModule, Icon],
  templateUrl: './cart-page.component.html',
  styleUrl: './cart-page.component.css'
})
export class CartPageComponent implements OnInit {
  private cartService = inject(CartService);
  private cartApiService = inject(CartApiService);
  private router = inject(Router);

  items = this.cartService.cartItems;

  isProcessing = signal(false);
  errorMessage = signal<string | null>(null);

  subtotal = computed(() =>
    this.items().reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  );

  ngOnInit(): void {}

  increment(productId: string, currentQuantity: number, stock: number): void {
    if (currentQuantity >= stock) {
      return;
    }
    this.cartService.updateQuantity(productId, currentQuantity + 1);
  }

  decrement(productId: string, currentQuantity: number): void {
    this.cartService.updateQuantity(productId, currentQuantity - 1);
  }

  onQuantityInput(productId: string, value: string, stock: number): void {
    let quantity = parseInt(value, 10);

    if (isNaN(quantity) || quantity < 1) {
      quantity = 1;
    }

    if (quantity > stock) {
      quantity = stock;
    }

    this.cartService.updateQuantity(productId, quantity);
  }

  removeItem(productId: string): void {
    this.cartService.removeFromCart(productId);
  }

  getImageUrl(imageUrl?: string): string | null {
    if (!imageUrl) {
      return null;
    }
    if (imageUrl.startsWith('data:') || imageUrl.startsWith('http')) {
      return imageUrl;
    }
    return `${environment.apiUrl}/${imageUrl.replace(/^\/+/, '')}`;
  }

  checkout(): void {
    if (this.items().length === 0) {
      return;
    }

    this.errorMessage.set(null);
    this.isProcessing.set(true);

    const request = {
      items: this.items().map((item) => ({
        productId: item.product.id!,
        quantity: item.quantity
      }))
    };

    this.cartApiService.calculate(request).subscribe({
      next: () => {
        this.isProcessing.set(false);
        this.cartService.clear();
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.isProcessing.set(false);
        const message = err?.error?.message ?? 'No se pudo procesar el carrito. Intenta nuevamente.';
        this.errorMessage.set(message);
      }
    });
  }
}