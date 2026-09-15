import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ProductService } from '../products/product.service';
import { Product } from '../../models/product.model';
import { Order, OrderStatus } from '../../models/order.model';
import { CartService } from '../cart/cart.service';
import { environment } from '../../../enviroments/enviroment.development';

type Section = 'usuarios' | 'productos' | 'ventas' | 'pedidos';
type SortDirection = 'asc' | 'desc';
type ProductSortKey = 'code' | 'category' | 'price' | 'stock';
type OrderSortKey = 'id' | 'date' | 'itemCount' | 'total' | 'customer' | 'status';

interface MockUser {
  name: string;
  email: string;
  role: string;
  status: string;
}

interface TopProduct {
  name: string;
  unitsSold: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private fb = inject(FormBuilder);

  activeSection = signal<Section>('productos');

  // ---- Productos: conectado a tu backend real ----
  products = signal<Product[]>([]);
  loadingProducts = signal(true);
  productsError = signal(false);

  editing = signal(false);
  selectedProduct = signal<Product | null>(null);
  saving = signal(false);
  actionMessage = signal<string | null>(null);
  formError = signal<string | null>(null);

  productForm = this.fb.nonNullable.group({
    code: ['', Validators.required],
    name: ['', Validators.required],
    category: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    stock: [0, [Validators.required, Validators.min(0)]],
    imageUrl: [''],
    description: ['']
  });

  lowStockCount = computed(
    () => this.products().filter((product) => product.stock <= 5).length
  );

  orders = this.cartService.orderHistory;

  pageSize = signal(10);
  productsPage = signal(1);
  ordersPage = signal(1);
  salesPage = signal(1);
  productSortKey = signal<ProductSortKey>('code');
  productSortDirection = signal<SortDirection>('asc');
  orderSortKey = signal<OrderSortKey>('date');
  orderSortDirection = signal<SortDirection>('desc');
  salesSortKey = signal<OrderSortKey>('date');
  salesSortDirection = signal<SortDirection>('desc');
  selectedOrder = signal<Order | null>(null);
  selectedOrderStatus = signal<OrderStatus>('Pendiente');
  orderItemPages = signal<Record<string, number>>({});
  selectedOrderEditable = signal(true);

  sortedProducts = computed(() => this.sortProducts(this.products()));
  pagedProducts = computed(() => {
    const start = (this.productsPage() - 1) * this.pageSize();
    return this.sortedProducts().slice(start, start + this.pageSize());
  });

  sortedOrders = computed(() => this.sortOrders(this.orders(), this.orderSortKey(), this.orderSortDirection()));
  pagedOrders = computed(() => {
    const start = (this.ordersPage() - 1) * this.pageSize();
    return this.sortedOrders().slice(start, start + this.pageSize());
  });

  sales = computed(() => this.orders().filter((order) => order.status === 'Confirmado'));
  sortedSales = computed(() => this.sortOrders(this.sales(), this.salesSortKey(), this.salesSortDirection()));
  pagedSales = computed(() => {
    const start = (this.salesPage() - 1) * this.pageSize();
    return this.sortedSales().slice(start, start + this.pageSize());
  });

  productsTotalPages = computed(() =>
    Math.max(1, Math.ceil(this.products().length / this.pageSize()))
  );

  ordersTotalPages = computed(() =>
    Math.max(1, Math.ceil(this.orders().length / this.pageSize()))
  );

  salesTotalPages = computed(() =>
    Math.max(1, Math.ceil(this.sales().length / this.pageSize()))
  );

  // ---- Usuarios: sin backend aún, datos de ejemplo ----
  // Reemplaza estos arreglos por llamadas reales cuando existan los servicios.
  mockUsers = signal<MockUser[]>([
    { name: 'Ana Torres', email: 'ana.torres@mail.com', role: 'Cliente', status: 'Activo' },
    { name: 'Carlos Peña', email: 'carlos.pena@mail.com', role: 'Cliente', status: 'Activo' },
    { name: 'María Fuentes', email: 'maria.fuentes@mail.com', role: 'Vendedor', status: 'Activo' },
    { name: 'Jorge Ibáñez', email: 'jorge.ibanez@mail.com', role: 'Cliente', status: 'Inactivo' },
    { name: 'Valentina Rojas', email: 'valentina.rojas@mail.com', role: 'Cliente', status: 'Activo' }
  ]);

  topProducts = signal<TopProduct[]>([
    { name: 'Torta de chocolate', unitsSold: 128 },
    { name: 'Pie de limon', unitsSold: 97 },
    { name: 'Cheesecake de frutilla', unitsSold: 84 },
    { name: 'Kuchen de manzana', unitsSold: 61 },
    { name: 'Alfajor de manjar', unitsSold: 48 }
  ]);

  maxUnitsSold = computed(() =>
    Math.max(...this.topProducts().map((product) => product.unitsSold), 1)
  );

  // ---- Tarjetas superiores ----
  cards = computed(() => [
    {
      id: 'usuarios' as Section,
      label: 'Usuarios',
      value: this.mockUsers().length,
      meta: '2 nuevos esta semana'
    },
    {
      id: 'productos' as Section,
      label: 'Productos',
      value: this.products().length,
      meta: `${this.lowStockCount()} con stock bajo`
    },
    {
      id: 'ventas' as Section,
      label: 'Ventas',
      value: this.formatClp(this.sales().reduce((total, order) => total + order.total, 0)),
      meta: `${this.sales().length} ventas confirmadas`
    },
    {
      id: 'pedidos' as Section,
      label: 'Pedidos',
      value: this.orders().length,
      meta: `${this.orders().filter(o => o.status === 'Pendiente').length} por despachar`
    }
  ]);

  ngOnInit(): void {
    this.loadProducts();
  }


  selectSection(section: Section): void {
    this.activeSection.set(section);
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

  getFormImageUrl(): string | null {
    const image = this.productForm.controls.imageUrl.value;

    if (!image) {
      return null;
    }

    if (image.startsWith('data:') || image.startsWith('http://') || image.startsWith('https://')) {
      return image;
    }

    return `${environment.apiUrl}/${image.replace(/^\/+/, '')}`;
  }

  getOrderItemImageUrl(image?: string): string | null {
    if (!image) {
      return null;
    }

    if (image.startsWith('data:') || image.startsWith('http://') || image.startsWith('https://')) {
      return image;
    }

    return `${environment.apiUrl}/${image.replace(/^\/+/, '')}`;
  }

  setPageSize(value: string): void {
    this.pageSize.set(Number(value));
    this.productsPage.set(1);
    this.ordersPage.set(1);
    this.salesPage.set(1);
  }

  goToProductsPage(page: number): void {
    this.productsPage.set(Math.max(1, Math.min(page, this.productsTotalPages())));
  }

  goToOrdersPage(page: number): void {
    this.ordersPage.set(Math.max(1, Math.min(page, this.ordersTotalPages())));
  }

  goToSalesPage(page: number): void {
    this.salesPage.set(Math.max(1, Math.min(page, this.salesTotalPages())));
  }

  formatClp(value: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0
    }).format(value);
  }

  sortProductsBy(key: ProductSortKey): void {
    if (this.productSortKey() === key) {
      this.productSortDirection.update((direction) => direction === 'asc' ? 'desc' : 'asc');
    } else {
      this.productSortKey.set(key);
      this.productSortDirection.set('asc');
    }
    this.productsPage.set(1);
  }

  sortOrdersBy(key: OrderSortKey): void {
    if (this.orderSortKey() === key) {
      this.orderSortDirection.update((direction) => direction === 'asc' ? 'desc' : 'asc');
    } else {
      this.orderSortKey.set(key);
      this.orderSortDirection.set('asc');
    }
    this.ordersPage.set(1);
  }

  sortSalesBy(key: OrderSortKey): void {
    if (this.salesSortKey() === key) {
      this.salesSortDirection.update((direction) => direction === 'asc' ? 'desc' : 'asc');
    } else {
      this.salesSortKey.set(key);
      this.salesSortDirection.set('asc');
    }
    this.salesPage.set(1);
  }

  getSortIndicator(key: ProductSortKey | OrderSortKey, activeKey: string, direction: SortDirection): string {
    return key === activeKey ? (direction === 'asc' ? ' ↑' : ' ↓') : '';
  }

  private sortProducts(products: Product[]): Product[] {
    const key = this.productSortKey();
    const direction = this.productSortDirection() === 'asc' ? 1 : -1;

    return [...products].sort((left, right) => {
      const leftValue = key === 'code' ? left.code : key === 'category' ? left.category : left[key];
      const rightValue = key === 'code' ? right.code : key === 'category' ? right.category : right[key];
      return this.compareValues(leftValue, rightValue) * direction;
    });
  }

  private sortOrders(orders: Order[], key: OrderSortKey, direction: SortDirection): Order[] {
    const multiplier = direction === 'asc' ? 1 : -1;

    return [...orders].sort((left, right) => {
      const leftValue = this.orderSortValue(left, key);
      const rightValue = this.orderSortValue(right, key);
      return this.compareValues(leftValue, rightValue) * multiplier;
    });
  }

  private orderSortValue(order: Order, key: OrderSortKey): string | number {
    switch (key) {
      case 'date': return new Date(order.date).getTime();
      case 'customer': return order.customer?.name ?? '';
      case 'itemCount': return order.itemCount;
      case 'total': return order.total;
      case 'status': return order.status;
      default: return order.id;
    }
  }

  private compareValues(left: string | number | undefined, right: string | number | undefined): number {
    if (typeof left === 'number' && typeof right === 'number') {
      return left - right;
    }
    return String(left ?? '').localeCompare(String(right ?? ''), 'es', { numeric: true, sensitivity: 'base' });
  }

  getOrderItems(order: Order) {
    return order.items ?? [];
  }

  getPagedOrderItems(order: Order) {
    const page = this.orderItemPages()[order.id] ?? 1;
    const start = (page - 1) * 5;
    return this.getOrderItems(order).slice(start, start + 5);
  }

  getOrderItemPage(order: Order): number {
    return this.orderItemPages()[order.id] ?? 1;
  }

  getOrderItemTotalPages(order: Order): number {
    return Math.max(1, Math.ceil(this.getOrderItems(order).length / 5));
  }

  goToOrderItemPage(order: Order, page: number): void {
    const safePage = Math.max(1, Math.min(page, this.getOrderItemTotalPages(order)));
    this.orderItemPages.update((pages) => ({ ...pages, [order.id]: safePage }));
  }

  viewOrder(order: Order): void {
    this.selectedOrder.set(order);
    this.selectedOrderStatus.set(order.status);
    this.selectedOrderEditable.set(true);
  }

  viewSale(order: Order): void {
    this.selectedOrder.set(order);
    this.selectedOrderStatus.set(order.status);
    this.selectedOrderEditable.set(false);
  }

  closeOrder(): void {
    this.selectedOrder.set(null);
    this.selectedOrderEditable.set(true);
  }

  setOrderStatus(status: string): void {
    this.selectedOrderStatus.set(status as OrderStatus);
  }

  saveOrderStatus(): void {
    const order = this.selectedOrder();
    if (!order) {
      return;
    }

    const updatedOrder = this.cartService.updateOrderStatus(order.id, this.selectedOrderStatus());
    if (updatedOrder) {
      this.selectedOrder.set(null);
      this.actionMessage.set('Estado del pedido actualizado.');
      this.clearMessageSoon();
    }
  }

  loadProducts(): void {
    this.loadingProducts.set(true);
    this.productsError.set(false);

    this.productService.findAll().subscribe({
      next: (data) => {
        this.products.set(data);
        this.productsPage.set(1);
        this.loadingProducts.set(false);
      },
      error: () => {
        this.productsError.set(true);
        this.loadingProducts.set(false);
      }
    });
  }

  startCreate(): void {
    this.formError.set(null);
    this.selectedProduct.set(null);
    this.productForm.reset({
      code: '',
      name: '',
      category: '',
      price: 0,
      stock: 0,
      imageUrl: '',
      description: ''
    });
    this.editing.set(true);
  }

  startEdit(product: Product): void {
    this.formError.set(null);
    this.selectedProduct.set(product);
    this.productForm.reset({
      code: product.code,
      name: product.name,
      category: product.category,
      price: product.price,
      stock: product.stock,
      imageUrl: product.imageUrl ?? '',
      description: product.description ?? ''
    });
    this.editing.set(true);
  }

  cancelEdit(): void {
    this.formError.set(null);
    this.editing.set(false);
    this.selectedProduct.set(null);
  }

  saveProduct(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      this.formError.set(this.productForm.controls.code.value.trim()
        ? 'Completa todos los campos obligatorios.'
        : 'El código no puede estar vacío.');
      return;
    }

    this.formError.set(null);
    this.saving.set(true);
    const value = this.productForm.getRawValue();
    const current = this.selectedProduct();

    const request$ = current?.id
      ? this.productService.update(current.id, { ...current, ...value })
      : this.productService.create(value as Product);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.editing.set(false);
        this.selectedProduct.set(null);
        this.actionMessage.set(
          current ? 'Producto actualizado correctamente.' : 'Producto creado correctamente.'
        );
        this.loadProducts();
        this.clearMessageSoon();
      },
      error: (error) => {
        this.saving.set(false);
        this.formError.set(this.getProductErrorMessage(error));
      }
    });
  }

  private getProductErrorMessage(error: { status?: number; error?: { message?: string; title?: string } }): string {
    const backendMessage = error?.error?.message ?? error?.error?.title ?? '';
    const normalizedMessage = backendMessage.toLowerCase();

    if (error?.status === 409 || normalizedMessage.includes('duplicate') || normalizedMessage.includes('already exists') || normalizedMessage.includes('ya existe') || normalizedMessage.includes('registrado')) {
      return 'El código ya está registrado. Usa un código diferente.';
    }

    if (normalizedMessage.includes('code') && normalizedMessage.includes('empty')) {
      return 'El código no puede estar vacío.';
    }

    return backendMessage || 'No se pudo guardar el producto. Revisa los datos e inténtalo nuevamente.';
  }

  deleteProduct(product: Product): void {
    if (!product.id) {
      return;
    }

    const confirmed = confirm(`¿Eliminar "${product.name}" del catálogo?`);
    if (!confirmed) {
      return;
    }

    this.productService.delete(product.id).subscribe({
      next: () => {
        this.actionMessage.set('Producto eliminado del catálogo.');
        this.loadProducts();
        this.clearMessageSoon();
      },
      error: () => {
        this.actionMessage.set('No se pudo eliminar el producto.');
        this.clearMessageSoon();
      }
    });
  }

  private clearMessageSoon(): void {
    setTimeout(() => this.actionMessage.set(null), 3000);
  }
}