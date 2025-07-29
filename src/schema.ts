// TypeScript type definitions

export type TokenSchema = {
    token_address: string;
    token_name: string;
    token_ticker: string;
    price_usd: number;
    market_cap_usd: number;
    volume_1h: number;
    volume_6h: number;
    volume_24h: number;
    liquidity_usd: number;
    transaction_count_1h: number;
    transaction_count_6h: number;
    transaction_count_24h: number;
    price_1hr_change: number;
    price_6hr_change: number;
    price_24hr_change: number;
    protocol: string;
};

export type FilterSchema = {
    token_address: string;
    token_name: string;
    token_ticker: string;
    price_usd: number;
    market_cap_usd: number;
    volume: number;
    liquidity_usd: number;
    transaction_count: number;
    price_change: number;
    protocol: string;
};