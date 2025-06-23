export type Stock = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  prevPrice?: number;
};
