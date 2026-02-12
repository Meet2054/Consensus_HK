// Market Types

export interface UserBet {
  address: string;
  side: 'YES' | 'NO';
  amount: number; // in USDC (6 decimals)
  timestamp: number;
}

export interface Market {
  id: string;
  question: string; // The prediction question
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimals: number;
  contractCreator: string;
  totalSupply: string;
  threshold: number;
  deadline: number;
  yesPool: number; // Total ETH bet on YES
  noPool: number; // Total ETH bet on NO
  bets: UserBet[]; // All bets placed
  resolved: boolean;
  reached: boolean;
  createdAt: number;
  resolvedAt?: number;
  marketContract?: string; // On-chain market contract address
}

export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  creator: string;
  totalSupply: string;
}

export interface MarketFormData {
  tokenAddress: string;
  threshold: number;
  deadline: number;
}

export enum MarketStatus {
  PENDING = 'PENDING',
  REACHED = 'REACHED',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
}
