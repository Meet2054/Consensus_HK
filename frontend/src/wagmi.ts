import {
  Chain,
  base,
  arbitrumSepolia,
  baseSepolia,
  chiliz,
  neonDevnet,
  mantleSepoliaTestnet,
  flowTestnet,
  scrollSepolia,
  morphHolesky,
} from "wagmi/chains";
import { http, cookieStorage, createConfig, createStorage } from "wagmi";
import {
  RainbowKitProvider,
  connectorsForWallets,
  getDefaultConfig,
} from "@rainbow-me/rainbowkit";
import { metaMaskWallet, coinbaseWallet } from "@rainbow-me/rainbowkit/wallets";

const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended Wallet",
      wallets: [coinbaseWallet],
    },
    {
      groupName: "Other Wallets",
      wallets: [metaMaskWallet],
    },
  ],
  {
    appName: "PredPump",
    appDescription: "The Infinite Market for Degens",
    projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID!,
  }
);

export const chilizSpicyTestnet = {
  id: 88_882,
  name: "Chiliz Spicy Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "CHZ",
    symbol: "CHZ",
  },
  rpcUrls: {
    default: {
      http: ["https://spicy-rpc.chiliz.com/"],
    },
    public: {
      http: ["https://spicy-rpc.chiliz.com/"],
    },
  },
  blockExplorers: {
    default: {
      name: "ChilizScan Testnet",
      url: "https://spicy-explorer.chiliz.com",
    },
  },
  testnet: true,
} as const satisfies Chain;

export const config = getDefaultConfig({
  appName: "PredPump",
  appDescription: "The Infinite Market for Degens",
  //@ts-ignore
  connectors,
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID!,
  chains: [
    base,
    baseSepolia,
  ],
  ssr: true,
});
