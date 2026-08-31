import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Icon } from '../../../shared/icon/icon';
import { MsalAuthService } from '../../../core/msal-auth/msal-auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, Icon],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private fb = new FormBuilder();
  private msalAuth = inject(MsalAuthService);

  showPassword = signal(false);
  isSubmitting = signal(false);

  loginForm = this.fb.group({
    identifier: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    // Aquí luego conectas tu AuthService
    console.log('Datos de login:', this.loginForm.value);

    setTimeout(() => this.isSubmitting.set(false), 1000); // simulado, borra cuando conectes el servicio real
  }

  loginWithMicrosoft(): void {
    this.msalAuth.loginWithMicrosoft();
  }
}