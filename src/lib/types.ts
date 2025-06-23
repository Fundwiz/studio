export type Stock = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  prevPrice?: number;
};
export type Index = Stock;

export type Option = {
    strike: number;
    ltp: number;
    iv: number;
    chng: number;
    oi: number;
    volume: number;
    bid: number;
    ask: number;
};

export type OptionChain = {
    calls: Option[];
    puts: Option[];
    underlyingPrice: number;
};
