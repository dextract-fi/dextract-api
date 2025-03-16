export interface SwapRoute {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  priceImpact: number;
  path: string[];
  providers: string[];
  estimatedGas?: string;
}

export interface SwapQuote {
  routes: SwapRoute[];
  bestRoute: SwapRoute;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  updatedAt: number;
}
