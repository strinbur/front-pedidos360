// app.routes.ts
import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { ProductListComponent } from './features/products/product-list.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { Home } from './features/home/home';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'auth/login', component: Login },
  { path: 'auth/register', component: Register },
  { path: 'products', component: ProductListComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [adminGuard]
  },
  { path: '**', redirectTo: '' },
];