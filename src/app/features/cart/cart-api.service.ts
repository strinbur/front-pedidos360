import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../enviroments/enviroment.development';
import { CartCalculateRequest, CartCalculateResponse } from '../../models/cart.model';

@Injectable({ providedIn: 'root' })
export class CartApiService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.cartApiUrl}/cart`;

  calculate(request: CartCalculateRequest): Observable<CartCalculateResponse> {
    return this.http.post<CartCalculateResponse>(`${this.baseUrl}/calculate`, request);
  }
}