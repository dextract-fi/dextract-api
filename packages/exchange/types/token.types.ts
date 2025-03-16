export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  tags?: string[];
  chainId: number;
}

export interface TokenList {
  name: string;
  logoURI?: string;
  tokens: Token[];
  timestamp: string;
  version: {
    major: number;
    minor: number;
    patch: number;
  };
}
