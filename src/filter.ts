import { FilterSchema, TokenSchema } from "./schema";



export function filter_data(data: TokenSchema[],filter: string){
    const result: FilterSchema[]=[];
    const volumeKey = filter === "1h" ? "volume_1h": filter === "6h"? "volume_6h": "volume_24h";
    const transactionCountKey = filter === "1h"? "transaction_count_1h": filter === "6h"? "transaction_count_6h": "transaction_count_24h";
    const priceChangeKey =filter === "1h"? "price_1hr_change": filter === "6h"? "price_6hr_change": "price_24hr_change";

    for(const token of data){
        const tem: FilterSchema ={
            token_address: token.token_address,
            token_name: token.token_name,
            token_ticker: token.token_ticker,
            price_usd: token.price_usd,
            market_cap_usd: token.market_cap_usd,
            volume: token[volumeKey],
            liquidity_usd: token.liquidity_usd,
            transaction_count: token[transactionCountKey],
            price_change: token[priceChangeKey],
            protocol: token.protocol,
        };
        result.push(tem);
    }

    return result;
}

export type SortKey = 'volume' | 'price_change' | 'market_cap_usd';

export function sort_data(data: FilterSchema[], sortBy: SortKey): FilterSchema[] {
  return [...data].sort((a, b) => b[sortBy] - a[sortBy]);
}