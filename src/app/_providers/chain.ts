import type { Chain } from "wagmi/chains";

export const mocaTestnet = {
  id: 5151,
  name: "MOCA Testnet",
  nativeCurrency: {
    name: "MOCA",
    symbol: "MOCA",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://testnet-rpc.mechain.tech"],
    },
  },
} as Chain;
