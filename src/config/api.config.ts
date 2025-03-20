import { registerAs } from '@nestjs/config';

export default registerAs('api', () => ({
  coingecko: {
    apiKey: process.env.COINGECKO_API_KEY || '',
    baseUrl: 'https://api.coingecko.com/api/v3',
    hasApiKey: !!process.env.COINGECKO_API_KEY,
  },
  coinmarketcap: {
    apiKey: process.env.COINMARKETCAP_API_KEY || '',
    baseUrl: 'https://pro-api.coinmarketcap.com/v1',
    hasApiKey: !!process.env.COINMARKETCAP_API_KEY,
  },
}));