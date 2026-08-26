import { Component, signal, HostListener, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Icon } from '../../shared/icon/icon';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, Icon],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {
  private elementRef = inject(ElementRef);

  isUserMenuOpen = signal(false);
  cartCount = signal(0);

  toggleUserMenu(): void {
    this.isUserMenuOpen.update(open => !open);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isUserMenuOpen.set(false);
    }
  }
}