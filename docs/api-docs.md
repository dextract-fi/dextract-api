# Dextract-fi API Documentation

## Table of Contents

- [](#)
- [prices](#prices)
- [swaps](#swaps)
- [tokens](#tokens)

## 

### GET /

#### Responses

| Status Code | Description | Schema |
| ----------- | ----------- | ------ |
| 200 |  | N/A |

## prices

### GET /prices/{chainId}

**Summary:** Get all token prices for a specific chain

#### Parameters

| Name | Located in | Required | Description | Schema |
| ---- | ---------- | -------- | ----------- | ------ |
| chainId | path | Yes | Chain ID | number |

#### Responses

| Status Code | Description | Schema |
| ----------- | ----------- | ------ |
| 200 | Returns all token prices | [PriceResponseDto](#priceresponsedto) |

### GET /prices/{chainId}/{address}

**Summary:** Get price for a specific token

#### Parameters

| Name | Located in | Required | Description | Schema |
| ---- | ---------- | -------- | ----------- | ------ |
| chainId | path | Yes | Chain ID | number |
| address | path | Yes | Token address | string |

#### Responses

| Status Code | Description | Schema |
| ----------- | ----------- | ------ |
| 200 | Returns token price information | [TokenPriceDto](#tokenpricedto) |
| 404 | Token price not found | N/A |

## swaps

### GET /swaps/quote/{chainId}

**Summary:** Get swap quote

#### Parameters

| Name | Located in | Required | Description | Schema |
| ---- | ---------- | -------- | ----------- | ------ |
| chainId | path | Yes | Chain ID | number |
| fromToken | query | Yes | Source token address | string |
| toToken | query | Yes | Destination token address | string |
| amount | query | Yes | Amount of source token to swap (in wei/lamports) | string |

#### Responses

| Status Code | Description | Schema |
| ----------- | ----------- | ------ |
| 200 | Returns swap quote information | [SwapQuoteDto](#swapquotedto) |
| 400 | Invalid parameters | N/A |
| 404 | No routes found | N/A |

## tokens

### GET /tokens/{chainId}

**Summary:** Get all tokens for a specific chain

#### Parameters

| Name | Located in | Required | Description | Schema |
| ---- | ---------- | -------- | ----------- | ------ |
| chainId | path | Yes | Chain ID | number |

#### Responses

| Status Code | Description | Schema |
| ----------- | ----------- | ------ |
| 200 | Returns an array of tokens | Array<[TokenDto](#tokendto)> |

### GET /tokens/{chainId}/{address}

**Summary:** Get a specific token by address

#### Parameters

| Name | Located in | Required | Description | Schema |
| ---- | ---------- | -------- | ----------- | ------ |
| chainId | path | Yes | Chain ID | number |
| address | path | Yes | Token address | string |

#### Responses

| Status Code | Description | Schema |
| ----------- | ----------- | ------ |
| 200 | Returns token information | [TokenDto](#tokendto) |
| 404 | Token not found | N/A |

## Schemas

### TokenDto

| Property | Type | Required | Description |
| -------- | ---- | -------- | ----------- |
| address | string | Yes | Token address |
| symbol | string | Yes | Token symbol |
| name | string | Yes | Token name |
| decimals | number | Yes | Token decimals |
| logoURI | string | No | Token logo URI |
| tags | Array<string> | No | Token tags |
| chainId | number | Yes | Chain ID of the token |

### PriceResponseDto

| Property | Type | Required | Description |
| -------- | ---- | -------- | ----------- |
| prices | object | Yes | Map of token addresses to their price information |
| updatedAt | number | Yes | Timestamp when prices were last updated |

### TokenPriceDto

| Property | Type | Required | Description |
| -------- | ---- | -------- | ----------- |
| address | string | Yes | Token address |
| priceUsd | number | Yes | Token price in USD |
| timestamp | number | Yes | Price timestamp |
| change24h | number | No | 24-hour price change percentage |
| change7d | number | No | 7-day price change percentage |
| volume24h | number | No | 24-hour trading volume in USD |
| marketCap | number | No | Token market capitalization in USD |

### SwapRouteDto

| Property | Type | Required | Description |
| -------- | ---- | -------- | ----------- |
| fromToken | string | Yes | Source token address |
| toToken | string | Yes | Destination token address |
| fromAmount | string | Yes | Amount of source token to swap (in wei/lamports) |
| toAmount | string | Yes | Expected amount of destination token to receive (in wei/lamports) |
| priceImpact | number | Yes | Price impact of the swap as a percentage |
| path | Array<string> | Yes | Token addresses in the swap path |
| providers | Array<string> | Yes | DEX providers used in the route |
| estimatedGas | string | No | Estimated gas cost (in wei/lamports) |

### SwapQuoteDto

| Property | Type | Required | Description |
| -------- | ---- | -------- | ----------- |
| routes | Array<[SwapRouteDto](#swaproutedto)> | Yes | All available swap routes |
| bestRoute | object | Yes | Best swap route based on output amount |
| fromToken | string | Yes | Source token address |
| toToken | string | Yes | Destination token address |
| fromAmount | string | Yes | Amount of source token to swap (in wei/lamports) |
| updatedAt | number | Yes | Timestamp when the quote was generated |

