import { Component, signal, HostListener, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {
  private elementRef = inject(ElementRef);

  // Controla si el dropdown de usuario está abierto
  isUserMenuOpen = signal(false);

  // Cantidad de productos en el carrito (por ahora fijo, luego vendrá de un servicio)
  cartCount = signal(0);

  toggleUserMenu(): void {
    this.isUserMenuOpen.update(open => !open);
  }

  // Cierra el dropdown si se hace clic fuera del componente
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isUserMenuOpen.set(false);
    }
  }
}