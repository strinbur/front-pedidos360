import { Component, signal, HostListener, ElementRef, inject, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { EventType } from '@azure/msal-browser';
import { MsalBroadcastService } from '@azure/msal-angular';
import { Icon } from '../../shared/icon/icon';
import { MsalAuthService } from '../../core/msal-auth/msal-auth.service';
import { CartService } from '../../features/cart/cart.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, Icon],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header implements OnInit {
  private elementRef = inject(ElementRef);
  private msalAuth = inject(MsalAuthService);
  private msalBroadcastService = inject(MsalBroadcastService);
  private destroyRef = inject(DestroyRef);
  private cartService = inject(CartService);

  isUserMenuOpen = signal(false);
  cartCount = this.cartService.totalItems;

  isLoggedIn = signal(false);
  userInitial = signal('');
  userName = signal('');
  isAdmin = signal(false);

  ngOnInit(): void {
    this.refreshUserState();

    this.msalBroadcastService.msalSubject$
      .pipe(
        filter((msg) =>
          msg.eventType === EventType.LOGIN_SUCCESS ||
          msg.eventType === EventType.LOGOUT_SUCCESS
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.refreshUserState();
      });
  }

  private refreshUserState(): void {
    const loggedIn = this.msalAuth.isLoggedIn();
    this.isLoggedIn.set(loggedIn);

    if (loggedIn) {
      const user = this.msalAuth.getUser();
      const name = user?.name ?? user?.email ?? '';
      this.userName.set(name);
      this.userInitial.set(name.charAt(0).toUpperCase());
      this.isAdmin.set(this.msalAuth.hasRole('ADMIN'));
    } else {
      this.userName.set('');
      this.userInitial.set('');
      this.isAdmin.set(false);
    }
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen.update(open => !open);
  }

  logout(): void {
    this.isUserMenuOpen.set(false);
    this.msalAuth.logout().then(() => {
      this.refreshUserState();
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isUserMenuOpen.set(false);
    }
  }
}