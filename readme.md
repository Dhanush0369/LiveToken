# LiveToken - Real-time Data Aggregation Service

## Live Demo
- **API Endpoint**: [https://livetoken-production-c13d.up.railway.app](https://livetoken-production-c13d.up.railway.app)
- **WebSocket**: [wss://livetoken-production-c13d.up.railway.app](wss://livetoken-production-c13d.up.railway.app)
- **Demo Video**: [Watch on YouTube](https://youtu.be/gDeXrO9tWYc)

## Overview
A TypeScript-based service that provides real-time cryptocurrency token data through WebSocket connections and REST API endpoints.

## Features
- Real-time token price and market data streaming
- Data aggregation from `DexScreener` & `GeckoTerminal`
- WebSocket support for live updates
- Filtering capabilities by time periods (`1h`, `6h`, `24h`)
- Sorting options by `volume`, `price change`, & `market cap`
- Redis caching for improved performance

## Tech Stack
- Node.js with TypeScript
- Express.js for REST API
- WebSocket (ws) for real-time updates
- Redis for data caching
- node-cron for scheduled tasks


## API Documentation
### REST API Endpoints

#### 1. GET /
Returns all token data without filtering or sorting.

```http
GET https://livetoken-production-c13d.up.railway.app/
```

Example Response:
```jsonc
{
  "tokens": [
    {
      "token_address": "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
      "token_name": "Marinade staked SOL (mSOL)",
      "token_ticker": "mSOL",
      "price_usd": "243.208619928577313282514345073963919845679593",
      "market_cap_usd": 962270604,
      "volume_1h": 37786.84,
      "volume_6h": 172849.38,
      "volume_24h": 2550045.5,
      "liquidity_usd": 284659.21,
      "transaction_count_1h": 300,
      "transaction_count_6h": 1483,
      "transaction_count_24h": 8086,
      "price_1hr_change": -0.16,
      "price_6hr_change": 2.04,
      "price_24hr_change": -3.31,
      "protocol": "raydium"
    },
    // ... more tokens
  ]
}
```

#### 2. GET /?filter={timeperiod}&sortBy={criteria}
Returns filtered and sorted token data.

Query Parameters:
- `filter`: Time period filter
  - Accepted values: `1h`, `6h`, `24h`
- `sortBy`: Sort results by
  - Accepted values: `volume`, `price_change`, `market_cap_usd`

Example Request:
```http
GET https://livetoken-production-c13d.up.railway.app/?filter=24h&sortBy=volume
```

This request will:
1. Filter tokens based on 24-hour data
2. Sort results by trading volume in descending order

Example Response:
```jsonc
{
  "tokens": [
    {
      "token_address": "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
      "token_name": "Marinade staked SOL (mSOL)",
      "token_ticker": "mSOL",
      "price_usd": "243.185681590039856305272153723741058942724949",
      "market_cap_usd": 960870540,
      "volume": 2550075.31,
      "liquidity_usd": 284245.05,
      "transaction_count": 8074,
      "price_change": -3.55,
      "protocol": "raydium"
    },
    // ... more tokens
  ]
}
```

Error Responses:
```jsonc
// Invalid filter or sortBy parameter
{
  "error": "Invalid Query Parameters"
}
```

## Scheduled Tasks

### 1. Task Initialization
- Task runs every 30 seconds using node-cron scheduler
- Maintains real-time data consistency across all clients
- Handles automatic data refresh without manual intervention

### 2. Data Collection Process
- Fetches latest token data from DexScreener API
- Retrieves market data from GeckoTerminal API
- Combines and normalizes data from multiple sources
- Caches processed data in Redis for performance

### 3. Data Processing Pipeline
- Extracts stored token data from Redis cache
- Retrieves active filter preferences
- Applies sorting criteria if configured
- Prepares formatted data for distribution

### 4. WebSocket Broadcasting
- Broadcasts updated data to all connected clients
- Maintains separate data streams for filtered results
- Ensures real-time data synchronization
- Handles client connection management

## Local Development Setup

1. Clone the repository
```bash
git clone https://github.com/Dhanush0369/LiveToken.git
```
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
export REDIS_URL="your_redis_connection_string"
```

4. Build and start:
```bash
npm run build
npm start
```

Server will start at `http://localhost:3000`

## Project Structure
- `src/main.ts` - Main application entry point
- `src/fetch_data.ts` - API integration and data fetching
- `src/filter.ts` - Data filtering and sorting logic
- `src/schema.ts` - TypeScript type definitions
- `src/token_data.ts` - Token address configurations

## Error Handling
- Invalid query parameters: 400 Bad Request
- Server errors: 500 Internal Server Error
- All errors include descriptive error messages


