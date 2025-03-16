export enum ChainId {
  ETHEREUM = 1,
  SOLANA = 101,
  // Add more chains as needed
}

export const CHAIN_NAMES: Record<ChainId, string> = {
  [ChainId.ETHEREUM]: 'Ethereum',
  [ChainId.SOLANA]: 'Solana',
  // Add more chains as needed
};

export const CHAIN_RPC_URLS: Record<ChainId, string[]> = {
  [ChainId.ETHEREUM]: [
    'https://eth.llamarpc.com',
    'https://rpc.ankr.com/eth',
  ],
  [ChainId.SOLANA]: [
    'https://api.mainnet-beta.solana.com',
    'https://solana-mainnet.rpc.extrnode.com',
  ],
  // Add more chains as needed
};
