export enum ChainId {
  ETHEREUM = 1,
  BSC = 56,
  POLYGON = 137,
  ARBITRUM = 42161,
  OPTIMISM = 10,
  AVALANCHE = 43114,
}

export const CHAIN_NAMES: Record<ChainId, string> = {
  [ChainId.ETHEREUM]: 'Ethereum',
  [ChainId.BSC]: 'Binance Smart Chain',
  [ChainId.POLYGON]: 'Polygon',
  [ChainId.ARBITRUM]: 'Arbitrum',
  [ChainId.OPTIMISM]: 'Optimism',
  [ChainId.AVALANCHE]: 'Avalanche',
};
