import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product } from '../../models/product.model';
import { ProductService } from '../products/product.service';
import { environment } from '../../../enviroments/enviroment.development';

@Component({
	selector: 'app-home',
	standalone: true,
	imports: [CommonModule, RouterLink],
	templateUrl: './home.html',
	styleUrl: './home.css'
})
export class Home implements OnInit, OnDestroy {
	private productService = inject(ProductService);
	private carouselTimer?: ReturnType<typeof setInterval>;

	featuredProducts = signal<Product[]>([]);
	activeIndex = signal(0);
	error = signal<string | null>(null);

	ngOnInit(): void {
		this.productService.findAll().subscribe({
			next: (products) => {
				this.featuredProducts.set(products.slice(0, 3));
				this.startCarousel();
			},
			error: () => this.error.set('No pudimos cargar los productos destacados.')
		});
	}

	ngOnDestroy(): void {
		if (this.carouselTimer) {
			clearInterval(this.carouselTimer);
		}
	}

	next(): void {
		const total = this.featuredProducts().length;
		if (total > 0) {
			this.activeIndex.update((index) => (index + 1) % total);
		}
	}

	previous(): void {
		const total = this.featuredProducts().length;
		if (total > 0) {
			this.activeIndex.update((index) => (index - 1 + total) % total);
		}
	}

	select(index: number): void {
		this.activeIndex.set(index);
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

	private startCarousel(): void {
		if (this.featuredProducts().length > 1) {
			this.carouselTimer = setInterval(() => this.next(), 5000);
		}
	}
}
