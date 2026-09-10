import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from './product.service';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css'
})
export class ProductListComponent implements OnInit {
  private productService = inject(ProductService);

  products = signal<Product[]>([]);
  error = signal<string | null>(null);

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
    console.log('Agregado al carrito:', product);
    // TODO: acá conectaremos la lógica real del carrito más adelante
  }
}