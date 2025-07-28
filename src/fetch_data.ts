import axios from 'axios';
import Redis from 'ioredis';
import { tokens } from './token_data';
import { TokenSchema } from './schema';

const redis = new Redis();

export async function fetch_DexScreener(token: string) {
    try{
        const res = await axios.get(`https://api.dexscreener.com/latest/dex/tokens/${token}`);
        return res.data.pairs;
    }catch (err) {
        console.error("Aggregator dexscreener error", err);
    }
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function randomJitter(maxJitter = 500) {
    return Math.floor(Math.random() * maxJitter);
}
  
export async function fetch_gecko(pool: string) {
    let retries = 0;
    const maxRetries = 5;
    let delay = 5000;
    while (retries < maxRetries) {
        try {
            const res = await axios.get(`https://api.geckoterminal.com/api/v2/networks/solana/pools/${pool}`);
            return res.data.data;
        } catch (error: unknown) {
            if (axios.isAxiosError(error) && error.response && error.response.status === 429) {
                await sleep(delay + randomJitter());
                delay *= 2;
                retries += 1;
            } else {
                throw error;
            }
        }
    }
    throw new Error("Failed to fetch after maximum retries");
}

// Using data from DexScreener as default. In case of NULL, GeckoTerminal data is used.
export function merge(dataDex: any, dataGecko:any): TokenSchema {
    return {
        token_address: dataDex.baseToken.address,
        token_name: dataDex.baseToken.name,
        token_ticker: dataDex.baseToken.symbol,
        price_usd: dataDex.price_usd || dataGecko.attributes.base_token_price_usd,
        market_cap_usd: dataDex.marketCap || dataGecko.attributes.market_cap_usd,
        volume_1h: dataDex.volume.h1 || dataGecko.attributes.volume_usd.h1,
        volume_6h: dataDex.volume.h6 || dataGecko.attributes.volume_usd.h6,
        volume_24h: dataDex.volume.h24 || dataGecko.attributes.volume_usd.h24,
        liquidity_usd: dataDex.liquidity.usd || dataGecko.attributes.reserve_in_usd,
        transaction_count_1h: dataDex.txns.h1.buys + dataDex.txns.h1.sells 
        || dataGecko.attributes.transactions.h1.buys + dataGecko.attributes.transactions.h1.sells ,
        transaction_count_6h: dataDex.txns.h6.buys + dataDex.txns.h6.sells
        || dataGecko.attributes.transactions.h6.buys + dataGecko.attributes.transactions.h6.sells,
        transaction_count_24h: dataDex.txns.h24.buys + dataDex.txns.h24.sells
        || dataGecko.attributes.transactions.h24.buys + dataGecko.attributes.transactions.h24.sells,
        price_1hr_change: dataDex.priceChange.h1 || dataGecko.attributes.price_change_percentage.h1,
        price_6hr_change: dataDex.priceChange.h6 || dataGecko.attributes.price_change_percentage.h6,
        price_24hr_change: dataDex.priceChange.h24 || dataGecko.attributes.price_change_percentage.h24,
        protocol: dataDex.dexId || dataGecko.relationships.dex.data.id
    }
}

export async function fetch_from_APIs(){
    
    for(const [token,pool] of tokens){
        try{
            const dataDex = await fetch_DexScreener(token);
            const datagecko = await fetch_gecko(pool);

            const result = merge(dataDex[0],datagecko);
            const key = `token:${result.token_address}`;
            await redis.set(key, JSON.stringify(result), 'EX', 40);
        }catch(err){
            console.error("Error While fetching data:",err);
        }
    }
}

export async function extract_from_redis(){
    const keys = await redis.keys("token:*");
    const pipeline = redis.pipeline();
    for (const key of keys) pipeline.get(key);
    const results = await pipeline.exec();

    let data: TokenSchema[] = [];
    if (results) {
        for (const [err, value] of results) {
            if (err) {
                console.error("Pipeline error:", err);
                continue;
            }
            if (typeof value === 'string') {
                try {
                    const parsed: TokenSchema = JSON.parse(value);
                    data.push(parsed);
                } catch (err) {
                    console.error("JSON parse error:", err);
                }
            }
        }
    } else {
        console.error("Redis pipeline returned null.");
    }

    return data;
}