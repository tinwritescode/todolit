"use client";
import { useMemo } from "react";
import {
  cookieStorage,
  createConfig,
  createStorage,
  http,
  injected,
  WagmiProvider,
} from "wagmi";
import { arbitrum, mainnet, optimism, polygon } from "wagmi/chains";
import { metaMask, walletConnect } from "wagmi/connectors";
import { mocaTestnet } from "./chain";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  const wagmiConfig = useMemo(
    () =>
      createConfig({
        chains: [mainnet, polygon, optimism, arbitrum, mocaTestnet],
        transports: {
          [mainnet.id]: http(),
          [polygon.id]: http(),
          [optimism.id]: http(),
          [arbitrum.id]: http(),
          [mocaTestnet.id]: http(),
        },
        connectors: [
          injected(),
          metaMask(),
          walletConnect({
            projectId: "1007b2726237bd6fc50e36435bb11834",
          }),
        ],
        ssr: true,
        storage: createStorage({
          storage: cookieStorage,
        }),
      }),
    [],
  );

  return <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>;
};
