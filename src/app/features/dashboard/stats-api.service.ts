import { Injectable, inject } from '@angular/core';
import { environment } from '../../../enviroments/enviroment.development';
import { MsalAuthService } from '../../core/msal-auth/msal-auth.service';
import { StockAlert, TopSeller } from '../../models/stats.model';

interface AlertHandlers {
  onOpen: () => void;
  onAlert: (alert: StockAlert) => void;
}

@Injectable({ providedIn: 'root' })
export class StatsApiService {
  private auth = inject(MsalAuthService);
  private baseUrl = `${environment.apiUrl}/products/stats`;

  topSellers(limit = 5): Promise<TopSeller[]> {
    return this.get<TopSeller[]>(`/top-sellers?limit=${limit}`);
  }

  stockAlerts(): Promise<StockAlert[]> {
    return this.get<StockAlert[]>('/stock-alerts');
  }

  /**
   * SSE con fetch: EventSource no permite enviar el header Authorization.
   * La promesa termina cuando el servidor cierra la conexión y falla si hay error de red o HTTP.
   */
  async streamAlerts(handlers: AlertHandlers, signal: AbortSignal): Promise<void> {
    const token = await this.auth.getApiToken();
    const res = await fetch(`${this.baseUrl}/alerts/stream`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
      signal
    });
    if (!res.ok || !res.body) {
      throw new Error(`HTTP ${res.status}`);
    }

    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    let buffer = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        return;
      }
      buffer += value;
      const frames = buffer.split(/\r?\n\r?\n/);   // un evento SSE termina con línea en blanco
      buffer = frames.pop() ?? '';
      for (const frame of frames) {
        this.handleFrame(frame, handlers);
      }
    }
  }

  private handleFrame(frame: string, handlers: AlertHandlers): void {
    let event = 'message';
    let data = '';
    for (const line of frame.split(/\r?\n/)) {
      if (line.startsWith('event:')) {
        event = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        data += line.slice(5).trim();
      }
    }
    if (event === 'connected') {
      handlers.onOpen();
    } else if (event === 'stock-alert' && data) {
      try {
        handlers.onAlert(JSON.parse(data) as StockAlert);
      } catch {
        // frame inválido: se ignora
      }
    }
    // los comentarios (":keep-alive") no traen event ni data
  }

  private async get<T>(path: string): Promise<T> {
    const token = await this.auth.getApiToken();
    const res = await fetch(`${this.baseUrl}${path}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return res.json() as Promise<T>;
  }
}