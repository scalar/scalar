DefiLlama API – Complete LLM Integration Guide
=====================================================

## Overview

This document provides comprehensive guidance for LLMs to interact with ALL DefiLlama APIs.
Includes pro-only endpoints (marked with 🔒) and free endpoints, with full parameters and responses.

## Base URLs

**Main Pro API** (Most endpoints)
- Base URL: `https://pro-api.llama.fi`
- Used for: TVL data, protocols, prices, yields, user metrics, fees

**Bridge API**
- Base URL: `https://bridges.llama.fi`
- Used for: Cross-chain bridge data and transactions

## Authentication

**For Pro Endpoints (🔒) on pro-api.llama.fi:**
API key is inserted between base URL and endpoint:
```
https://pro-api.llama.fi/<YOUR_API_KEY>/<ENDPOINT>
```

**For Free Endpoints and Other Base URLs:**
No authentication required - use endpoints directly:
```
https://bridges.llama.fi/<ENDPOINT>
```

**Examples:**
```bash
# Pro endpoints (requires API key in URL)
GET https://pro-api.llama.fi/abc123key/yields/pools

# Bridge endpoints (no key needed)
GET https://bridges.llama.fi/bridges
```

===============================================================================
SECTION 1: TVL & PROTOCOL DATA
===============================================================================

## Core TVL Endpoints

1. **GET /api/protocols**
   Base: `https://pro-api.llama.fi`
   Purpose: List all protocols with current TVL
   Parameters: None
   Response:
   ```json
   [{
     "id": "2269",
     "name": "Aave",
     "symbol": "AAVE",
     "category": "Lending",
     "chains": ["Ethereum", "Polygon"],
     "tvl": 5200000000,
     "chainTvls": {"Ethereum": 3200000000},
     "change_1h": 0.5,
     "change_1d": 2.3,
     "change_7d": -1.2,
     "mcap": 1500000000
   }]
   ```

2. **GET /api/protocol/{protocol}**
   Base: `https://pro-api.llama.fi`
   Purpose: Detailed protocol data including historical TVL
   Parameters:
     - protocol (path, required): Protocol slug (e.g., "aave", "uniswap")
   Response:
   ```json
   {
     "id": "2269",
     "name": "Aave",
     "symbol": "AAVE",
     "category": "Lending",
     "chains": ["Ethereum", "Polygon"],
     "description": "Decentralized lending protocol",
     "logo": "https://...",
     "url": "https://aave.com",
     "twitter": "AaveAave",
     "chainTvls": {
       "Ethereum": {"tvl": [{"date": 1640995200, "totalLiquidityUSD": 3200000000}]},
       "Polygon": {"tvl": [{"date": 1640995200, "totalLiquidityUSD": 2000000000}]}
     },
     "tvl": [{"date": 1640995200, "totalLiquidityUSD": 5200000000}],
     "currentChainTvls": {"Ethereum": 3200000000},
     "mcap": 1500000000,
     "raises": [{"date": "2020-10-01", "amount": 25000000}],
     "metrics": {
       "fees": {"24h": 234567, "7d": 1645234},
       "revenue": {"24h": 123456, "7d": 864192}
     }
   }
   ```

3. **GET /api/tvl/{protocol}**
   Base: `https://pro-api.llama.fi`
   Purpose: Simple endpoint returning only current TVL number
   Parameters:
     - protocol (path, required): Protocol slug
   Response: `4962012809.795062`

4. 🔒 **GET /api/tokenProtocols/{symbol}**
   Base: `https://pro-api.llama.fi`
   Purpose: Shows which protocols hold a specific token
   Parameters:
     - symbol (path, required): Token symbol (e.g., "usdt", "dai")
   Response:
   ```json
   [{
     "name": "Aave",
     "category": "Lending",
     "amountUsd": {
       "coingecko:tether": 1234567.89,
       "coingecko:usdt-avalanche": 98765.43
     }
   }]
   ```

5. 🔒 **GET /api/inflows/{protocol}/{timestamp}**
   Base: `https://pro-api.llama.fi`
   Purpose: Daily capital flows for a protocol
   Parameters:
     - protocol (path, required): Protocol slug
     - timestamp (path, required): Unix timestamp at 00:00 UTC
   Response:
   ```json
   {
     "outflows": -160563462.23,
     "inflows": 145234567.89,
     "oldTokens": {
       "date": 1700005031,
       "tvl": {"USDC": 27302168.77, "WETH": 138751.92}
     },
     "currentTokens": {
       "date": 1752771743,
       "tvl": {"USDC": 23936602.85, "WETH": 125432.11}
     }
   }
   ```

## Chain TVL Data

6. **GET /api/v2/chains**
   Base: `https://pro-api.llama.fi`
   Purpose: Current TVL of all chains
   Parameters: None
   Response:
   ```json
   [{
     "gecko_id": "ethereum",
     "tvl": 50000000000,
     "tokenSymbol": "ETH",
     "cmcId": "1027",
     "name": "Ethereum",
     "chainId": 1
   }]
   ```

7. **GET /api/v2/historicalChainTvl**
   Base: `https://pro-api.llama.fi`
   Purpose: Historical TVL for all chains
   Parameters: None
   Response:
   ```json
   [{
     "date": 1640995200,
     "tvl": {"Ethereum": 150000000000, "BSC": 20000000000}
   }]
   ```

8. **GET /api/v2/historicalChainTvl/{chain}**
   Base: `https://pro-api.llama.fi`
   Purpose: Historical TVL for specific chain
   Parameters:
     - chain (path, required): Chain name (e.g., "Ethereum")
   Response:
   ```json
   [{
     "date": 1640995200,
     "tvl": 150000000000
   }]
   ```

9. 🔒 **GET /api/chainAssets**
   Base: `https://pro-api.llama.fi`
   Purpose: Asset breakdown across all chains
   Parameters: None
   Response:
   ```json
   {
     "Ethereum": {
       "canonical": {
         "total": "4482065428.83",
         "breakdown": {"USDT": "2000000000", "USDC": "1500000000"}
       },
       "native": {
         "total": "10848868127.01",
         "breakdown": {"ETH": "10000000000"}
       },
       "thirdParty": {
         "total": "3182802062.49",
         "breakdown": {"WBTC": "2000000000"}
       }
     },
     "timestamp": 1752843956
   }
   ```

===============================================================================
SECTION 2: PRICE & COIN DATA
===============================================================================

Base URL for all: `https://pro-api.llama.fi`

10. **GET /coins/prices/current/{coins}**
    Purpose: Current prices for specified coins
    Parameters:
      - coins (path, required): Comma-separated list with chain prefix
        Format: "chain:address" (e.g., "ethereum:0x...")
      - searchWidth (query, optional): Time range to search for price ("4h", "24h")
    Response:
    ```json
    {
      "coins": {
        "ethereum:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48": {
          "decimals": 6,
          "symbol": "USDC",
          "price": 0.999,
          "timestamp": 1640995200,
          "confidence": 0.99
        }
      }
    }
    ```

11. **GET /coins/prices/historical/{timestamp}/{coins}**
    Purpose: Historical prices at specific timestamp
    Parameters:
      - timestamp (path, required): Unix timestamp
      - coins (path, required): Comma-separated coin list
      - searchWidth (query, optional): Search range in seconds
    Response: Same format as current prices

12. **POST /coins/batchHistorical**
    Purpose: Batch historical price queries
    Request Body:
    ```json
    {
      "coins": {
        "ethereum:0x...": [1640995200, 1641081600],
        "bsc:0x...": [1640995200]
      }
    }
    ```
    Response:
    ```json
    {
      "coins": {
        "ethereum:0x...": {
          "prices": [
            {"timestamp": 1640995200, "price": 1.01},
            {"timestamp": 1641081600, "price": 0.99}
          ]
        }
      }
    }
    ```

13. **GET /coins/chart/{coins}**
    Purpose: Price chart data with configurable intervals
    Parameters:
      - coins (path, required): Comma-separated coins
      - period (query, optional): Time period ("1d", "7d", "30d", "90d", "180d", "365d")
      - span (query, optional): Data point interval in hours
      - searchWidth (query, optional): Search width
    Response:
    ```json
    {
      "coins": {
        "ethereum:0x...": {
          "prices": [
            {"timestamp": 1640995200, "price": 1.01}
          ],
          "symbol": "USDC",
          "confidence": 0.99
        }
      }
    }
    ```

14. **GET /coins/percentage/{coins}**
    Purpose: Price change percentages
    Parameters:
      - coins (path, required): Comma-separated coins
      - timestamp (query, optional): Base timestamp for comparison
      - lookForward (query, optional): Look forward instead of backward
      - period (query, optional): Time period
    Response:
    ```json
    {
      "coins": {
        "ethereum:0x...": {
          "symbol": "USDC",
          "price": 0.999,
          "change": -0.1
        }
      }
    }
    ```

15. **GET /coins/prices/first/{coins}**
    Purpose: First recorded price for coins
    Parameters:
      - coins (path, required): Comma-separated coins
    Response:
    ```json
    {
      "coins": {
        "ethereum:0x...": {
          "price": 1.0,
          "timestamp": 1598918400,
          "symbol": "USDC"
        }
      }
    }
    ```

16. **GET /coins/block/{chain}/{timestamp}**
    Purpose: Get block number at timestamp
    Parameters:
      - chain (path, required): Chain name
      - timestamp (path, required): Unix timestamp
    Response:
    ```json
    {
      "height": 13456789,
      "timestamp": 1640995200
    }
    ```

===============================================================================
SECTION 3: YIELDS & FARMING
===============================================================================

Base URL: `https://pro-api.llama.fi`

24. 🔒 **GET /yields/pools**
    Base: `https://pro-api.llama.fi`
    Purpose: All yield pools with current APY
    Parameters: None
    Response:
    ```json
    {
      "status": "success",
      "data": [{
        "pool": "747c1d2a-c668-4682-b9f9-296708a3dd90",
        "chain": "Ethereum",
        "project": "aave-v3",
        "symbol": "USDC",
        "tvlUsd": 1500000000,
        "apy": 3.5,
        "apyBase": 2.5,
        "apyReward": 1.0,
        "rewardTokens": ["AAVE"],
        "underlyingTokens": ["0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"],
        "poolMeta": "Lending",
        "exposure": "single",
        "il7d": 0,
        "apyBase7d": 2.3,
        "volumeUsd1d": 50000000,
        "volumeUsd7d": 350000000
      }]
    }
    ```

25. 🔒 **GET /yields/poolsOld**
    Base: `https://pro-api.llama.fi`
    Purpose: Legacy pools with contract addresses
    Parameters: None
    Response: Similar to /pools with additional `pool_old` field

26. 🔒 **GET /yields/chart/{pool}**
    Base: `https://pro-api.llama.fi`
    Purpose: Historical APY/TVL for a pool
    Parameters:
      - pool (path, required): Pool UUID
    Response:
    ```json
    {
      "status": "success",
      "data": [{
        "timestamp": "2024-01-15T00:00:00.000Z",
        "tvlUsd": 1500000000,
        "apy": 3.5,
        "apyBase": 2.5,
        "apyReward": 1.0,
        "il7d": 0,
        "apyBase7d": 2.3
      }]
    }
    ```

27. 🔒 **GET /yields/poolsBorrow**
    Base: `https://pro-api.llama.fi`
    Purpose: Borrowing rates across protocols
    Parameters: None
    Response:
    ```json
    {
      "status": "success",
      "data": [{
        "pool": "abc-123",
        "chain": "Ethereum",
        "project": "aave-v3",
        "symbol": "USDC",
        "apyBaseBorrow": 5.2,
        "apyRewardBorrow": -0.5,
        "totalSupplyUsd": 2000000000,
        "totalBorrowUsd": 1500000000,
        "ltv": 0.75,
        "borrowable": true,
        "mintedCoin": "aUSDC"
      }]
    }
    ```

28. 🔒 **GET /yields/chartLendBorrow/{pool}**
    Base: `https://pro-api.llama.fi`
    Purpose: Historical lend/borrow rates
    Parameters:
      - pool (path, required): Pool UUID
    Response:
    ```json
    {
      "status": "success",
      "data": [{
        "timestamp": "2024-01-15T00:00:00.000Z",
        "totalSupplyUsd": 2000000000,
        "totalBorrowUsd": 1500000000,
        "apyBase": 3.5,
        "apyBaseBorrow": 5.2,
        "apyReward": 1.0,
        "apyRewardBorrow": -0.5
      }]
    }
    ```

29. 🔒 **GET /yields/perps**
    Base: `https://pro-api.llama.fi`
    Purpose: Perpetual futures funding rates
    Parameters: None
    Response:
    ```json
    {
      "status": "success",
      "data": [{
        "pool": "perp-123",
        "chain": "Arbitrum",
        "project": "gmx",
        "symbol": "ETH-USD",
        "fundingRate": 0.01,
        "fundingRate7dAvg": 0.008,
        "fundingRate30dAvg": 0.009,
        "openInterest": 500000000,
        "indexPrice": 2500.50,
        "markPrice": 2501.00,
        "nextFundingTime": "2024-01-16T08:00:00Z"
      }]
    }
    ```

30. 🔒 **GET /yields/lsdRates**
    Base: `https://pro-api.llama.fi`
    Purpose: Liquid staking derivative rates
    Parameters: None
    Response:
    ```json
    {
      "status": "success",
      "data": [{
        "pool": "lsd-123",
        "project": "lido",
        "symbol": "stETH",
        "chain": "Ethereum",
        "apy": 3.8,
        "tvlUsd": 35000000000,
        "apyBase": 3.8,
        "apyBase7d": 3.7,
        "apyBase30d": 3.9,
        "marketShare": 0.32
      }]
    }
    ```

===============================================================================
SECTION 4: USER & ACTIVITY METRICS
===============================================================================

Base URL: `https://pro-api.llama.fi`

31. 🔒 **GET /api/activeUsers**
    Purpose: Active users for all protocols
    Parameters: None
    Response:
    ```json
    {
      "aave-v3": {
        "name": "Aave V3",
        "users": {"value": 15234, "end": 1752832840},
        "txs": {"value": "45678", "end": 1752832840},
        "gasUsd": {"value": 12345.67, "end": 1752832840},
        "newUsers": {"value": 234, "end": 1752832840},
        "chainBreakdown": {
          "Ethereum": {"users": 8000, "txs": 25000},
          "Arbitrum": {"users": 7234, "txs": 20678}
        }
      }
    }
    ```

32. 🔒 **GET /api/userData/{type}/{protocolId}**
    Purpose: Historical user metrics
    Parameters:
      - type (path, required): "activeUsers" | "uniqueActiveUsers" | "dailyTxs" | "gasUsd"
      - protocolId (path, required): Protocol numeric ID
    Response:
    ```json
    [{
      "date": 1640995200,
      "value": 15234,
      "chain": "Ethereum"
    }]
    ```

===============================================================================
SECTION 5: VOLUME METRICS (DEXs, Derivatives, Options)
===============================================================================

Base URL: `https://pro-api.llama.fi`

33. **GET /api/overview/dexs**
    Purpose: Aggregated DEX volumes
    Parameters:
      - excludeTotalDataChart (query, optional): Exclude chart data
      - excludeTotalDataChartBreakdown (query, optional): Exclude breakdown
      - dataType (query, optional): "dailyVolume" | "totalVolume"
    Response:
    ```json
    {
      "totalVolume": 1234567890,
      "change_1d": 5.2,
      "change_7d": -2.1,
      "change_30d": 15.3,
      "protocols": [{
        "name": "Uniswap",
        "volume24h": 1500000000,
        "volume7d": 10500000000,
        "change_1d": 3.2,
        "chains": ["Ethereum", "Arbitrum", "Polygon"]
      }],
      "chart": [{
        "date": 1640995200,
        "volume": 2000000000
      }]
    }
    ```

34. **GET /api/overview/dexs/{chain}**
    Purpose: DEX volumes for specific chain
    Parameters:
      - chain (path, required): Chain name
      - excludeTotalDataChart (query, optional): Exclude chart
      - excludeTotalDataChartBreakdown (query, optional): Exclude breakdown
    Response: Similar to overview but filtered by chain

35. **GET /api/summary/dexs/{protocol}**
    Purpose: Specific DEX protocol volumes
    Parameters:
      - protocol (path, required): Protocol slug
      - dataType (query, optional): "dailyVolume" | "totalVolume"
    Response:
    ```json
    {
      "id": "2269",
      "name": "Uniswap",
      "displayName": "Uniswap V3",
      "volume24h": 1500000000,
      "volume7d": 10500000000,
      "volume30d": 45000000000,
      "totalVolume": 800000000000,
      "change_1d": 3.2,
      "change_7d": -1.5,
      "chains": ["Ethereum", "Arbitrum"],
      "chainBreakdown": {
        "Ethereum": {"volume24h": 1000000000},
        "Arbitrum": {"volume24h": 500000000}
      },
      "dailyVolume": [{
        "date": 1640995200,
        "volume": 1500000000
      }]
    }
    ```

36. **GET /api/overview/options**
    Purpose: Options trading volumes
    Parameters:
      - excludeTotalDataChart (query, optional): Exclude chart
      - excludeTotalDataChartBreakdown (query, optional): Exclude breakdown
    Response:
    ```json
    {
      "totalPremiumVolume": 500000000,
      "totalNotionalVolume": 10000000000,
      "protocols": [{
        "name": "Lyra",
        "premiumVolume24h": 5000000,
        "notionalVolume24h": 100000000,
        "chains": ["Ethereum", "Optimism"]
      }]
    }
    ```

37. **GET /api/overview/options/{chain}**
    Purpose: Options volumes for specific chain
    Parameters:
      - chain (path, required): Chain name
    Response: Similar to overview but filtered

38. **GET /api/summary/options/{protocol}**
    Purpose: Specific options protocol data
    Parameters:
      - protocol (path, required): Protocol slug
    Response:
    ```json
    {
      "name": "Lyra",
      "premiumVolume24h": 5000000,
      "notionalVolume24h": 100000000,
      "totalPremiumVolume": 250000000,
      "totalNotionalVolume": 5000000000,
      "chains": ["Ethereum", "Optimism"],
      "dailyPremiumVolume": [{
        "date": 1640995200,
        "volume": 5000000
      }],
      "dailyNotionalVolume": [{
        "date": 1640995200,
        "volume": 100000000
      }]
    }
    ```

39. 🔒 **GET /api/overview/derivatives**
    Base: `https://pro-api.llama.fi`
    Purpose: Aggregated derivatives data
    Parameters: None
    Response:
    ```json
    {
      "totalVolume24h": 5000000000,
      "totalOpenInterest": 2000000000,
      "change_1d": 10.5,
      "protocols": {
        "gmx": {
          "volume24h": 1000000000,
          "openInterest": 500000000,
          "chains": ["Arbitrum", "Avalanche"]
        }
      }
    }
    ```

40. 🔒 **GET /api/summary/derivatives/{protocol}**
    Base: `https://pro-api.llama.fi`
    Purpose: Specific derivatives protocol
    Parameters:
      - protocol (path, required): Protocol slug
    Response:
    ```json
    {
      "name": "GMX",
      "volume24h": 1000000000,
      "volume7d": 7000000000,
      "openInterest": 500000000,
      "totalVolume": 50000000000,
      "chains": ["Arbitrum", "Avalanche"],
      "dailyVolume": [{
        "date": 1640995200,
        "volume": 1000000000,
        "openInterest": 500000000
      }]
    }
    ```

===============================================================================
SECTION 6: FEES & REVENUE
===============================================================================

Base URL: `https://pro-api.llama.fi`

41. **GET /api/overview/fees**
    Purpose: Protocol fees overview
    Parameters:
      - excludeTotalDataChart (query, optional): Exclude chart
      - excludeTotalDataChartBreakdown (query, optional): Exclude breakdown
      - dataType (query, optional): "dailyFees" | "dailyRevenue" | "dailyHoldersRevenue"
    Response:
    ```json
    {
      "totalFees24h": 5000000,
      "totalRevenue24h": 2500000,
      "change_1d": 8.3,
      "protocols": [{
        "name": "Uniswap",
        "fees24h": 2000000,
        "revenue24h": 0,
        "chains": ["Ethereum", "Arbitrum"],
        "breakdown24h": {
          "ethereum": {
              "WBTC": 0
            }
        },
        "breakdown30d": {
          "ethereum": {
            "WBTC": 37283
          }
        }
      }],
    }
    ```

42. **GET /api/overview/fees/{chain}**
    Purpose: Fees for specific chain
    Parameters:
      - chain (path, required): Chain name
      - dataType (query, optional): "dailyFees" | "dailyRevenue" | "dailyHoldersRevenue"
    Response: Similar to overview but filtered

43. **GET /api/summary/fees/{protocol}**
    Purpose: Specific protocol fees
    Parameters:
      - protocol (path, required): Protocol slug
      - dataType (query, optional): "dailyFees" | "dailyRevenue" | "dailyHoldersRevenue"
    Response:
    ```json
    {
      "id": "parent#hyperliquid",
      "name": "Hyperliquid",
      "url": "https://hyperliquid.xyz",
      "referralUrl": "https://app.hyperliquid.xyz/join/DEFILLAMAO",
      "description": "Hyperliquid is a decentralized perpetual exchange with best-in-class speed, liquidity, and price",
      "logo": "https://icons.llama.fi/hyperliquid.png",
      "gecko_id": "hyperliquid",
      "linkedProtocols": [
        "Hyperliquid",
        "Hyperliquid Spot Orderbook"
      ],
      "twitter": "HyperliquidX",
      "github": [
        "hyperliquid-dex"
      ],
      "symbol": "HYPE",
      "address": "hyperliquid:0x0d01dc56dcaaca66ad901c959b4011ec",
      "defillamaId": "parent#hyperliquid",
      "disabled": null,
      "displayName": "Hyperliquid",
      "cmcId": "32196",
      "chains": [
        "Hyperliquid L1"
      ],
      "latestFetchIsOk": true,
      "slug": "hyperliquid",
      "protocolType": "protocol",
      "total24h": 4890250,
      "total48hto24h": 4550411,
      "total7d": 26184696,
      "totalAllTime": 499292857,
      "change_1d": 7.47,
      "totalDataChart": [
        [
          1734912000,
          1472923
        ]
      ],
      "totalDataChartBreakdown": [
        [
          1734912000,
          {
            "Hyperliquid L1": {
              "Hyperliquid Spot Orderbook": 1472923
            }
          }
        ]
      ]
    }
    ```

===============================================================================
SECTION 7: UNLOCKS & EMISSIONS
===============================================================================

Base URL: `https://pro-api.llama.fi`

44. 🔒 **GET /api/emissions**
    Purpose: All tokens with unlock schedules
    Parameters: None
    Response:
    ```json
    [
      {
        "token": "coingecko:whitebit",
        "sources": [
          "https://cdn.whitebit.com/wbt/whitepaper-en.pdf"
        ],
        "protocolId": "6143",
        "name": "WhiteBIT",
        "circSupply": 293500000,
        "circSupply30d": 293500000,
        "totalLocked": 81500000,
        "maxSupply": 375000000,
        "gecko_id": "whitebit",
        "events": [
          {
            "description": "A cliff of {tokens[0]} tokens was unlocked from Funds 1 on {timestamp}",
            "timestamp": 1659657600,
            "noOfTokens": [
              120000000
            ],
            "category": "noncirculating",
            "unlockType": "cliff"
          }
        ],
        "nextEvent": {
          "date": 1773360001,
          "toUnlock": 81500000
        },
        "unlocksPerDay": 0,
        "mcap": 6577845629.249915
      }
    ]
    ```

45. 🔒 **GET /api/emission/{protocol}**
    Purpose: Detailed vesting schedule
    Parameters:
      - protocol (path, required): Protocol slug
    Response:
    ```json
    {
      "body": {
        "documentedData": {
          "data": [
            {
              "label": "Hyper Foundation Budget",
              "data": [
                {
                  "timestamp": 1732838400,
                  "unlocked": 60000000,
                  "rawEmission": 60000000,
                  "burned": 0
                }
              ]
            }
          ],
          "tokenAllocation": {
            "current": {
              "insiders": 16,
              "noncirculating": 0.8,
              "publicSale": 0,
              "airdrop": 82.5,
              "farming": 0.7
            },
            "final": {
              "insiders": 45.8,
              "noncirculating": 0.5,
              "publicSale": 0,
              "airdrop": 47.7,
              "farming": 6
            },
            "progress": {
              "insiders": 20.1,
              "noncirculating": 100,
              "publicSale": 100,
              "airdrop": 100,
              "farming": 6.5
            }
          }
        },
        "metadata": {
          "notes": [
            "The Community Rewards schedule has been linearly extrapolated using the rate of unlocks as of 4 March 2025.",
            "The remaining allocation, not shown on the chart, belongs to Community Rewards. It has been excluded here to avoid obscuring the remaining data.",
            "Most vesting schedules will complete between 2027–2028; some will continue after 2028. Here we have used an end date of end of 2027.",
            "Although the full allocations for Hyper Foundation Budget and Community Grants were unlocked at TGE it is unclear what their spend rate is."
          ],
          "token": "coingecko:hyperliquid",
          "sources": [
            "https://hyperfnd.medium.com/hype-genesis-1830a4dc2e3f"
          ],
          "protocolIds": [
            "4481",
            "5448",
            "5507",
            "5761"
          ],
          "total": 1000000000,
          "chain": "hyperliquid",
          "name": "Hyperliquid",
          "gecko_id": "hyperliquid",
          "defillamaIds": [
            "4481"
          ],
          "categories": {
            "insiders": [
              "Core Contributors",
              "Hyper Foundation Budget"
            ],
            "noncirculating": [
              "Community Grants"
            ],
            "publicSale": [
              "HIP-2"
            ],
            "airdrop": [
              "Genesis Distribution"
            ],
            "farming": [
              "Community Rewards"
            ]
          },
          "protocolCategory": "Bridge",
          "chainName": "Hyperliquid L1",
          "pId": "4481"
        }
      },
      "lastModified": "2025-07-18T13:30:56.000Z"
    }
    ```

===============================================================================
SECTION 8: ECOSYSTEM DATA
===============================================================================

Base URL: `https://pro-api.llama.fi`

46. 🔒 **GET /api/categories**
    Purpose: TVL by category
    Parameters: None
    Response:
    ```json
    {
      "chart": {
        "1752796800": {
          "Lending": {"tvl": 25000000000},
          "Dexes": {"tvl": 15000000000},
          "CDP": {"tvl": 8000000000}
        }
      },
      "categories": {
        "Lending": ["aave", "compound", "morpho"],
        "Dexes": ["uniswap", "curve", "balancer"],
        "CDP": ["makerdao", "liquity", "reflexer"]
      },
      "categoryPercentages": {
        "Lending": 50.0,
        "Dexes": 30.0,
        "CDP": 16.0,
        "Others": 4.0
      }
    }
    ```

47. 🔒 **GET /api/forks**
    Purpose: Protocol fork relationships
    Parameters: None
    Response:
    ```json
    {
      "chart": {
        "1752796800": {
          "Uniswap V3": {"tvl": 5000000000, "forks": 15},
          "Compound V2": {"tvl": 3000000000, "forks": 8}
        }
      },
      "forks": {
        "Uniswap V3": ["pancakeswap-v3", "sushiswap-v3", "quickswap-v3"],
        "Compound V2": ["benqi", "moonwell", "bastion"]
      },
      "parentProtocols": {
        "pancakeswap-v3": "Uniswap V3",
        "benqi": "Compound V2"
      }
    }
    ```

48. 🔒 **GET /api/oracles**
    Purpose: Oracle protocol data
    Parameters: None
    Response:
    ```json
    {
      "chart": {
        "1752796800": {
          "Chainlink": {"tvl": 15000000000, "protocolsSecured": 250},
          "Pyth": {"tvl": 8000000000, "protocolsSecured": 150}
        }
      },
      "oracles": {
        "Chainlink": ["Ethereum", "Arbitrum", "BSC"],
        "Pyth": ["Solana", "Aptos", "Sui"]
      },
      "totalValueSecured": 50000000000,
      "dominance": {
        "Chainlink": 60.5,
        "Pyth": 25.3,
        "UMA": 8.2
      }
    }
    ```

49. 🔒 **GET /api/entities**
    Purpose: Company/entity information
    Parameters: None
    Response:
    ```json
    [
      {
        "id": "entity-8",
        "name": "Blockchain Capital",
        "url": "https://blockchain.capital",
        "description": "Blockchain Capital is a leading venture firm in the blockchain industry. In the last 9 years we have made over 160 investments in companies and protocols in the sector, across different stages, geographies and asset types.",
        "logo": "https://icons.llama.fi/blockchain-capital.jpg",
        "category": "VC",
        "module": "entities/blockchain-capital.js",
        "twitter": "blockchaincap",
        "symbol": "",
        "chain": "Ethereum",
        "gecko_id": null,
        "cmcId": null,
        "chains": [
          "Ethereum"
        ],
        "slug": "blockchain-capital",
        "tvl": 131402986.1539898,
        "chainTvls": {
          "Ethereum": 131402986.1539898
        },
        "change_1h": 0.5368786705972184,
        "change_1d": 5.632604890674784,
        "change_7d": 11.27548502629729,
        "tokenBreakdowns": {
          "ownTokens": 0,
          "stablecoins": 0.06493662312,
          "majors": 29628575.4114822,
          "others": 101774410.67757098
        },
        "mcap": null
      }
    ]
    ```

50. 🔒 **GET /api/treasuries**
    Purpose: Protocol treasury balances
    Parameters: None
    Response:
    ```json
    [
      {
        "id": "6355-treasury",
        "name": "SharpLink Gaming (treasury)",
        "address": null,
        "symbol": "-",
        "url": "https://www.sharplink.com/",
        "description": "SharpLink is one of the first Nasdaq-listed companies to develop a treasury strategy centered on ETH",
        "chain": "Ethereum",
        "logo": "https://icons.llama.fi/sharplink-gaming.jpg",
        "audits": "0",
        "audit_note": null,
        "gecko_id": null,
        "cmcId": null,
        "category": "Treasury Manager",
        "chains": [
          "Ethereum"
        ],
        "module": "treasury/sharplink-gaming.js",
        "treasury": "sharplink-gaming.js",
        "forkedFromIds": [],
        "twitter": "SharpLinkGaming",
        "slug": "sharplink-gaming-(treasury)",
        "tvl": 976150507.157045,
        "chainTvls": {
          "Ethereum": 976150507.157045
        },
        "change_1h": -1.1231970563777622,
        "change_1d": 15.845546813803097,
        "change_7d": 75.57040101595928,
        "tokenBreakdowns": {
          "ownTokens": 0,
          "stablecoins": 0.003,
          "majors": 67481592.5634468,
          "others": 908668914.5905982
        },
        "mcap": null
      }
    ]
    ```

51. 🔒 **GET /api/hacks**
    Purpose: Historical exploits database
    Parameters: None
    Response:
    ```json
    [
      {
        "date": 1711065600,
        "name": "Super Sushi Samurai",
        "classification": "Protocol Logic",
        "technique": "Infinite Mint and Dump",
        "amount": 4800000,
        "chain": [
          "Blast"
        ],
        "bridgeHack": false,
        "targetType": "Gaming",
        "source": "https://rekt.news/sss-rekt/",
        "returnedFunds": null,
        "defillamaId": null,
        "language": "Solidity"
      }
    ]
    ```

52. 🔒 **GET /api/raises**
    Purpose: Funding rounds database
    Parameters: None
    Response:
    ```json
    {
      "raises": [
        {
          "date": 1740528000,
          "name": "Ethena Labs",
          "round": "Strategic",
          "amount": 16,
          "chains": [
            "Ethereum"
          ],
          "sector": "Ethena is a synthetic dollar protocol built on Ethereum",
          "category": "DeFi",
          "categoryGroup": "DeFi & CeFi",
          "source": "https://www.benzinga.com/pressreleases/25/02/g43966782/mexc-invests-20-million-in-usde-to-drive-stablecoin-adoption-launches-1-000-000-reward-event",
          "leadInvestors": [
            "MEXC Ventures"
          ],
          "otherInvestors": [],
          "valuation": null,
          "defillamaId": "parent#ethena"
        }
      ]
    }
    ```

53. 🔒 **GET /api/historicalLiquidity/{token}**
    Purpose: Historical liquidity for token
    Parameters:
      - token (path, required): Token address with chain (e.g., "ethereum:0x...")
    Response:
    ```json
    [{
      "date": 1640995200,
      "liquidity": 50000000,
      "liquidityUsd": 50000000,
      "volume24h": 5000000,
      "priceImpact1Percent": 0.05,
      "priceImpact2Percent": 0.15
    }]
    ```

===============================================================================
SECTION 9: ETF DATA
===============================================================================

Base URL: `https://pro-api.llama.fi`

54. 🔒 **GET /etfs/overview**
    Purpose: TradFi crypto ETF overview
    Parameters: None
    Response:
    ```json
    [
      {
        "timestamp": 1732278611,
        "timestamp_as_of": 1732147200,
        "ticker": "IBIT",
        "issuer": "Blackrock",
        "etf_name": "iShares Bitcoin Trust",
        "etf_type": "spot",
        "custodian": "Coinbase",
        "pct_fee": 0.25,
        "url": "https://www.blackrock.com/us/individual/products/333011/ishares-bitcoin-trust",
        "price": 55.9,
        "volume": 5105037034.5,
        "shares": 846080000,
        "underlying": null,
        "underlying_price": 98855,
        "aum": 47313346647,
        "flows": 645378400
      }
    ]
    ```

55. 🔒 **GET /etfs/overviewEth**
    Purpose: Ethereum ETF data
    Parameters: None
    Response: Similar to overview but ETH only

56. 🔒 **GET /etfs/history**
    Purpose: Historical ETF flows
    Parameters: None
    Response:
    ```json
    [
      {
        "timestamp": 1704931200,
        "timestamp_exact": 1705017598,
        "ticker": "ARKB",
        "price": 46.76,
        "volume": 279749462.16,
        "aum": 46855730.4,
        "underlying": null,
        "shares": 1002047.271171942,
        "underlying_price": 46396,
        "flows": null
      }
    ]
    ```

57. 🔒 **GET /etfs/historyEth**
    Purpose: Historical Ethereum ETF data
    Parameters: None
    Response: Similar to history but ETH only

58. 🔒 **GET /fdv/performance/{period}**
    Purpose: FDV performance metrics
    Parameters:
      - period (path, required): One of ['7', '30', 'ytd', '365']
    Response:
    ```json
    [
      {
        "date": 1751846400,
        "Analytics": 0,
        "Artificial Intelligence (AI)": 0,
        "Bitcoin": 0,
        "Bridge Governance Tokens": 0,
        "Centralized Exchange (CEX) Token": 0,
        "Data Availability": 0,
        "Decentralized Finance (DeFi)": 0,
        "Decentralized Identifier (DID)": 0,
        "DePIN": 0,
        "Ethereum": 0,
        "Gaming (GameFi)": 0,
        "Liquid Staking Governance Tokens": 0,
        "Meme": 0,
        "NFT Marketplace": 0,
        "Oracle": 0,
        "PolitiFi": 0,
        "Prediction Markets": 0,
        "Real World Assets (RWA)": 0,
        "Rollup": 0,
        "Smart Contract Platform": 0,
        "SocialFi": 0,
        "Solana": 0
      }
    ]
    ```

===============================================================================
SECTION 10: BRIDGES
===============================================================================

Base URL: `https://bridges.llama.fi`

59. 🔒 **GET /bridges**
    Purpose: List all bridges
    Parameters:
      - includeChains (query, optional): Include chain breakdown
    Response:
    ```json
    {
      "bridges": [
        {
          "id": 80,
          "name": "hyperliquid",
          "displayName": "Hyperliquid",
          "icon": "icons:hyperliquid",
          "volumePrevDay": 245562283.16810948,
          "volumePrev2Day": 205702464.62591228,
          "lastHourlyVolume": 0,
          "last24hVolume": 245562283.16810948,
          "lastDailyVolume": 245562283.16810948,
          "dayBeforeLastVolume": 205702464.62591228,
          "weeklyVolume": 1700279485.290507,
          "monthlyVolume": 3986810177.448681,
          "chains": [
            "Arbitrum",
            "Hyperliquid"
          ],
          "destinationChain": "Hyperliquid",
          "url": "https://app.hyperliquid.xyz/trade",
          "slug": "hyperliquid-bridge"
        }
      ]
    }
    ```

60. 🔒 **GET /bridge/{id}**
    Purpose: Detailed bridge data
    Parameters:
      - id (path, required): Bridge ID
    Response:
    ```json
    {
      "id": 1,
      "name": "polygon",
      "displayName": "Polygon PoS Bridge",
      "lastHourlyVolume": 118020.67633222912,
      "currentDayVolume": 0,
      "lastDailyVolume": 28740605.36474136,
      "dayBeforeLastVolume": 17294645.046479236,
      "weeklyVolume": 71188570.7201651,
      "monthlyVolume": 490635601.59313035,
      "lastHourlyTxs": {
        "deposits": 10,
        "withdrawals": 5
      },
      "currentDayTxs": {
        "deposits": 0,
        "withdrawals": 0
      },
      "prevDayTxs": {
        "deposits": 153,
        "withdrawals": 150
      },
      "dayBeforeLastTxs": {
        "deposits": 173,
        "withdrawals": 195
      },
      "weeklyTxs": {
        "deposits": 2095,
        "withdrawals": 1752
      },
      "monthlyTxs": {
        "deposits": 6945,
        "withdrawals": 5537
      },
      "chainBreakdown": {
        "Polygon": {
          "lastHourlyVolume": 118020.67633222912,
          "currentDayVolume": 0,
          "lastDailyVolume": 28740605.36474136,
          "dayBeforeLastVolume": 17294645.046479236,
          "weeklyVolume": 71188570.7201651,
          "monthlyVolume": 490635601.59313035,
          "last24hVolume": 34766385.06231544,
          "lastHourlyTxs": {
            "deposits": 10,
            "withdrawals": 5
          },
          "currentDayTxs": {
            "deposits": 0,
            "withdrawals": 0
          },
          "prevDayTxs": {
            "deposits": 153,
            "withdrawals": 150
          },
          "dayBeforeLastTxs": {
            "deposits": 173,
            "withdrawals": 195
          },
          "weeklyTxs": {
            "deposits": 2095,
            "withdrawals": 1752
          },
          "monthlyTxs": {
            "deposits": 6945,
            "withdrawals": 5537
          }
        },
        "Ethereum": {
          "lastHourlyVolume": 118020.67633222912,
          "currentDayVolume": 0,
          "lastDailyVolume": 28740605.36474136,
          "dayBeforeLastVolume": 17294645.046479236,
          "weeklyVolume": 71188570.7201651,
          "monthlyVolume": 490635601.59313035,
          "last24hVolume": 34766385.06231544,
          "lastHourlyTxs": {
            "deposits": 10,
            "withdrawals": 5
          },
          "currentDayTxs": {
            "deposits": 0,
            "withdrawals": 0
          },
          "prevDayTxs": {
            "deposits": 153,
            "withdrawals": 150
          },
          "dayBeforeLastTxs": {
            "deposits": 173,
            "withdrawals": 195
          },
          "weeklyTxs": {
            "deposits": 2095,
            "withdrawals": 1752
          },
          "monthlyTxs": {
            "deposits": 6945,
            "withdrawals": 5537
          }
        }
      },
      "destinationChain": "Polygon"
    }
    ```

61. 🔒 **GET /bridgevolume/{chain}**
    Purpose: Bridge volume for chain
    Parameters:
      - chain (path, required): Chain name or "all"
    Response:
    ```json
    [
      {
        "date": "1665964800",
        "depositUSD": 11121806.082658675,
        "withdrawUSD": 13970177.335270314,
        "depositTxs": 218,
        "withdrawTxs": 56
      },
      {
        "date": "1666051200",
        "depositUSD": 32940139.204768553,
        "withdrawUSD": 157541586.9492474,
        "depositTxs": 2042,
        "withdrawTxs": 708
      }
    ]
    ```

62. 🔒 **GET /bridgedaystats/{timestamp}/{chain}**
    Purpose: Daily bridge stats
    Parameters:
      - timestamp (path, required): Unix timestamp
      - chain (path, required): Chain name
    Response:
    ```json
    {
      "date": 1752796800,
      "totalTokensDeposited": {
        "ethereum:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": {
          "usdValue": 8538374.477027368,
          "amount": "17379331182",
          "symbol": "USDC",
          "decimals": 6
        },
        "ethereum:0x6De037ef9aD2725EB40118Bb1702EBb27e4Aeb24": {
          "usdValue": 2123785.5869,
          "amount": "2123785.5869",
          "symbol": "RNDR",
          "decimals": 18
        }
      },
      "totalTokensWithdrawn": {
        "ethereum:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": {
          "usdValue": 3020623.745962119,
          "amount": "14680842655",
          "symbol": "USDC",
          "decimals": 6
        },
        "ethereum:0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": {
          "usdValue": 2214456.1061736266,
          "amount": "28501633217143430245",
          "symbol": "WETH",
          "decimals": 18
        }
      },
      "totalAddressDeposited": {
        "ethereum:0x3a23F943181408EAC424116Af7b7790c94Cb97a5": {
          "usdValue": 2447787.602843585,
          "txs": 13
        },
        "ethereum:0x348C31025754113F599ccEa72747A726a133799b": {
          "usdValue": 2115000,
          "txs": 1
        }
      },
      "totalAddressWithdrawn": {
        "ethereum:0xb60d0C2E8309518373b40f8Eaa2CAd0d1De3deCb": {
          "usdValue": 1196415.6440843595,
          "txs": 2
        },
        "ethereum:0x49c3FeaFDdaefC3Bed06F4ff87CE86610C2c1076": {
          "usdValue": 565794.5181076665,
          "txs": 1
        }
      }
    }
    ```

63. 🔒 **GET /transactions/{id}**
    Purpose: Bridge transactions
    Parameters:
      - id (path, required): Bridge ID
      - limit (query, optional): Number of txs (default 100)
      - startTimestamp (query, optional): Start time
      - endTimestamp (query, optional): End time
      - sourceChain (query, optional): Source chain filter
      - address (query, optional): Address filter
    Response:
    ```json
    {
      "id": 1,
      "name": "polygon",
      "displayName": "Polygon PoS Bridge",
      "lastHourlyVolume": 118020.67633222912,
      "currentDayVolume": 0,
      "lastDailyVolume": 28740605.36474136,
      "dayBeforeLastVolume": 17294645.046479236,
      "weeklyVolume": 71188570.7201651,
      "monthlyVolume": 490635601.59313035,
      "lastHourlyTxs": {
        "deposits": 10,
        "withdrawals": 5
      },
      "currentDayTxs": {
        "deposits": 0,
        "withdrawals": 0
      },
      "prevDayTxs": {
        "deposits": 153,
        "withdrawals": 150
      },
      "dayBeforeLastTxs": {
        "deposits": 173,
        "withdrawals": 195
      },
      "weeklyTxs": {
        "deposits": 2095,
        "withdrawals": 1752
      },
      "monthlyTxs": {
        "deposits": 6945,
        "withdrawals": 5537
      },
      "chainBreakdown": {
        "Polygon": {
          "lastHourlyVolume": 118020.67633222912,
          "currentDayVolume": 0,
          "lastDailyVolume": 28740605.36474136,
          "dayBeforeLastVolume": 17294645.046479236,
          "weeklyVolume": 71188570.7201651,
          "monthlyVolume": 490635601.59313035,
          "last24hVolume": 34766385.06231544,
          "lastHourlyTxs": {
            "deposits": 10,
            "withdrawals": 5
          },
          "currentDayTxs": {
            "deposits": 0,
            "withdrawals": 0
          },
          "prevDayTxs": {
            "deposits": 153,
            "withdrawals": 150
          },
          "dayBeforeLastTxs": {
            "deposits": 173,
            "withdrawals": 195
          },
          "weeklyTxs": {
            "deposits": 2095,
            "withdrawals": 1752
          },
          "monthlyTxs": {
            "deposits": 6945,
            "withdrawals": 5537
          }
        },
        "Ethereum": {
          "lastHourlyVolume": 118020.67633222912,
          "currentDayVolume": 0,
          "lastDailyVolume": 28740605.36474136,
          "dayBeforeLastVolume": 17294645.046479236,
          "weeklyVolume": 71188570.7201651,
          "monthlyVolume": 490635601.59313035,
          "last24hVolume": 34766385.06231544,
          "lastHourlyTxs": {
            "deposits": 10,
            "withdrawals": 5
          },
          "currentDayTxs": {
            "deposits": 0,
            "withdrawals": 0
          },
          "prevDayTxs": {
            "deposits": 153,
            "withdrawals": 150
          },
          "dayBeforeLastTxs": {
            "deposits": 173,
            "withdrawals": 195
          },
          "weeklyTxs": {
            "deposits": 2095,
            "withdrawals": 1752
          },
          "monthlyTxs": {
            "deposits": 6945,
            "withdrawals": 5537
          }
        }
      },
      "destinationChain": "Polygon"
    }
    ```

===============================================================================
SECTION 11: ACCOUNT MANAGEMENT
===============================================================================

64. 🔒 **GET /usage/APIKEY**
    Base: `https://pro-api.llama.fi`
    Purpose: Check API usage
    Parameters: None (uses API key from header)
    Response:
    ```json
    {
      "creditsRemaining": 95000,
      "creditsUsed": 5000,
      "resetDate": "2024-02-01",
      "plan": "pro",
      "rateLimit": "1000/hour",
      "endpoints": ["all"]
    }
    ```

 