import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../features/products/product.service';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-list.component.html'
})
export class ProductListComponent implements OnInit {
  private productService = inject(ProductService);

  products = signal<Product[]>([]);
  error = signal<string | null>(null);
  editingId = signal<string | null>(null);

  formModel: Product = this.emptyProduct();

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.productService.findAll().subscribe({
      next: (data) => this.products.set(data),
      error: () => this.error.set('No se pudo conectar con el microservicio (revisá CORS o si está levantado)')
    });
  }

  save(): void {
    const request = this.editingId()
      ? this.productService.update(this.editingId()!, this.formModel)
      : this.productService.create(this.formModel);

    request.subscribe({
      next: () => {
        this.formModel = this.emptyProduct();
        this.editingId.set(null);
        this.load();
      },
      error: () => this.error.set('Error al guardar el producto')
    });
  }

  edit(product: Product): void {
    this.editingId.set(product.id!);
    this.formModel = { ...product };
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.formModel = this.emptyProduct();
  }

  remove(id: string): void {
    this.productService.delete(id).subscribe({
      next: () => this.load(),
      error: () => this.error.set('Error al eliminar el producto')
    });
  }

  private emptyProduct(): Product {
    return { code: '', name: '', description: '', price: 0, stock: 0, category: '' };
  }
}