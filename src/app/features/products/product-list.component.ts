import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from './product.service';
import { Product } from '../../models/product.model';
import { environment } from '../../../enviroments/enviroment.development';
import { CartService } from '../cart/cart.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css'
})
export class ProductListComponent implements OnInit {
  private productService = inject(ProductService);
  private cartService = inject(CartService);

  products = signal<Product[]>([]);
  error = signal<string | null>(null);
  activeCategory = signal('Todos');
  categories = computed(() => [
    'Todos',
    ...new Set(this.products().map((product) => product.category).filter(Boolean))
  ]);
  filteredProducts = computed(() => {
    const category = this.activeCategory();
    return category === 'Todos'
      ? this.products()
      : this.products().filter((product) => product.category === category);
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.productService.findAll().subscribe({
      next: (data) => this.products.set(data),
      error: () => this.error.set('No se pudo conectar con el microservicio (revisá CORS o si está levantado)')
    });
  }

  addToCart(product: Product): void {
    this.cartService.addToCart(product);
  }

  selectCategory(category: string): void {
    this.activeCategory.set(category);
  }

  getImageUrl(product: Product): string | null {
    const image = product.imageUrl ?? product.image;

    if (!image) {
      return null;
    }

    if (image.startsWith('data:') || image.startsWith('http://') || image.startsWith('https://')) {
      return image;
    }

    return `${environment.apiUrl}/${image.replace(/^\/+/, '')}`;
  }
}