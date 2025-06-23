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
    chng: number;
    oi: number;
    volume: number;
    bid: number;
    ask: number;
    prevLtp?: number;
};

export type OptionChain = {
    calls: Option[];
    puts: Option[];
    underlyingPrice: number;
};

export interface NiftyTick {
    Timestamp: string;
    LTP: number;
    Change: number;
    Open: number;
    High: number;
    Low: number;
    Close: number;
}

export interface RawOptionData {
    strike: number;
    last: number; // ltp
    change: number; // chng
    OI: number; // oi
    ttq: number; // volume
    bPrice: number; // bid
    sPrice: number; // ask
    [key: string]: any;
}
