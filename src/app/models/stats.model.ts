export interface TopSeller {
  productId: string;
  name: string;
  units: number;
}

export type StockLevel = 'LOW' | 'OUT' | 'OK';

export interface StockAlert {
  productId: string;
  code: string;
  name: string;
  stock: number;
  threshold: number;
  level: StockLevel;
  changed: boolean;
}