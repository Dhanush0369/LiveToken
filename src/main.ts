import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import Redis from'ioredis'
import { extract_from_redis, fetch_from_APIs, } from './fetch_data';
import { FilterSchema } from './schema';
import { filter_data, sort_data, SortKey } from './filter';
const cron = require('node-cron');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const clients = new Set<WebSocket>();
const redis = new Redis();

(async () =>{
    await redis.set('filter', 'unset');
    await redis.set('sortBY', 'unset');
})();

function broadcast(data: any){
    for (const client of clients) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ tokens: data }));
        }
    }
    return;
}


async function scheduled_task(){
    try{
        await fetch_from_APIs();
        const data = await extract_from_redis();
        
        const filter = await redis.get('filter');
        const sortBY = await redis.get('sortBY');

        if(filter=='unset'){
            broadcast(data);
        }else{
            var result:FilterSchema[]=[];
            if(filter) {
                result = filter_data(data, filter);
            }
            if(sortBY=='unset'){
                broadcast(result);
            }else{
                const sort = sortBY as SortKey;
                if(sortBY){
                    result = sort_data(result, sort);
                }
                broadcast(result);
            }
        }

        
        console.log("Process finished");
    }catch(err){
        console.error("Error in schedulded task", err);
    }
}

app.get('/', async (req, res) => {
    try{
        const data = await extract_from_redis();

        const filter = req.query.filter as string;
        var filtered_data:FilterSchema[]=[];

        //check filter query
        if (!filter) {
            await redis.set('filter','unset');
            return res.json(data);
        }

        // filter data
        if (typeof filter === 'string' && ['1h', '6h', '24h'].includes(filter)) {
            await redis.set('filter',filter);
            filtered_data = filter_data(data, filter);
        }else{
            return res.status(400).json({ error: 'Invalid Query Parameters' });
        }

        const raw_sortBY = req.query.sortBY as string;

        // check sortBy query
        if(!raw_sortBY){
            await redis.set('sortBY','unset');
            return res.json(filtered_data);
        }

        const sortBY = raw_sortBY as SortKey;
        // sort data
        if (typeof sortBY === 'string' && ['volume', 'price_change', 'market_cap_usd'].includes(sortBY)) {
            await redis.set('sortBY',sortBY);
            const sorted_data = sort_data(filtered_data, sortBY);
            return res.json(sorted_data)
        }
        
        return res.status(400).json({ error: 'Invalid Query Parameters' });
        
    }catch(err){
        return res.status(500).send({ error: err});
    }
});

wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('Client connected, total:', clients.size);
  
    ws.on('close', () => {
      clients.delete(ws);
      console.log('Client disconnected, total:', clients.size);
    });
});


server.listen(3000, () => {
    console.log('App running at http://localhost:3000');
});

cron.schedule('*/30 * * * * *', scheduled_task);

