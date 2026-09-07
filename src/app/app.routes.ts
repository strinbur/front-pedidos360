// app.routes.ts
import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { ProductListComponent } from './components/product-list/product-list.component';


export const routes: Routes = [
  {
    path: 'auth/login',
    component: Login
  },
  {
    path: 'auth/register',
    component: Register
  },
  {
    path: '**',
    redirectTo: ''
  },
  {
    path: 'products',
    component: ProductListComponent
  },
];