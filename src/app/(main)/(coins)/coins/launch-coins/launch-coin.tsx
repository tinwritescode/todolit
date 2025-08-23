"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Upload } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { usePublicClient, useWalletClient } from "wagmi";
import { mocaTestnet } from "../../../../_providers/chain";
import { abi, byteCode } from "./byteCode";
import { api } from "@/trpc/react";

const ERC20_ABI = abi;
const ERC20_BYTECODE = byteCode as `0x${string}`;

export function LaunchCoin({
  onBack,
  coinData,
}: {
  onBack: () => void;
  coinData: any;
}) {
  const { data: walletClient } = useWalletClient();

  const publicClient = usePublicClient({
    chainId: mocaTestnet.id,
  });
  const [isLaunching, setIsLaunching] = useState(false);
  const createToken = api.token.create.useMutation();
  const verifyToken = api.token.verify.useMutation();

  const handleLaunch = async () => {
    if (!walletClient || !publicClient) return;
    if (
      ERC20_BYTECODE === "0x" ||
      (ERC20_ABI as readonly unknown[]).length === 0
    ) {
      console.warn("ERC20 ABI/bytecode not set");
      return;
    }
    setIsLaunching(true);
    try {
      const name = coinData?.name ?? "Token";
      const symbol = coinData?.symbol ?? "TKN";
      const hash = await walletClient.deployContract({
        abi: ERC20_ABI,
        bytecode: ERC20_BYTECODE,
        chain: mocaTestnet,
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const deployedAddress = receipt.contractAddress;
      if (!deployedAddress) {
        throw new Error("Failed to get deployed contract address");
      }
      console.log({
        address: walletClient.account.address,
        name,
        symbol,
      });

      const initializeTx = await walletClient.writeContract({
        abi: ERC20_ABI,
        address: deployedAddress,
        functionName: "initialize",
        args: [walletClient.account.address, name, symbol],
        chain: mocaTestnet,
      });
      await publicClient.waitForTransactionReceipt({ hash: initializeTx });

      // Persist token info for future management
      try {
        await createToken.mutateAsync({
          address: deployedAddress,
          name,
          symbol,
          chainId: mocaTestnet.id,
          network: mocaTestnet.name,
          deployTxHash: hash,
          initializeTxHash: initializeTx,
          deployerAddress: walletClient.account.address,
          // Optional metadata
          totalSupply: coinData?.totalSupply?.toString(),
          ownerPercent: 0,
          airdropPercent: 80,
          salePercent: 20,
          description: coinData?.description ?? undefined,
          imageUrl: coinData?.imageUrl ?? undefined,
        });
      } catch (e) {
        console.error("Failed to save token to DB", e);
      }

      // Verify contract source code (optional, best-effort)
      try {
        await verifyToken.mutateAsync({ address: deployedAddress });
      } catch (e) {
        console.warn("Contract verification failed", e);
      }
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <div>
      <div className="mx-auto max-w-4xl">
        <Card className="border-1 shadow-none">
          <CardHeader className="border-b border-gray-200 pb-6">
            <CardTitle className="text-2xl font-semibold">
              Launch Coin
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-8 p-8">
            {/* Token Details Section */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              {/* Left Column - Image */}
              <div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Image</label>
                  <div className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 p-8 transition-colors hover:bg-gray-100">
                    <div className="flex h-24 w-24 items-center justify-center">
                      <Image
                        src="/laputa-logo.png"
                        alt="LAPUTA Logo"
                        width={96}
                        height={96}
                        className="object-contain"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Details */}
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Name
                    </label>
                    <div className="text-lg font-medium">Tin</div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Symbol
                    </label>
                    <div className="text-lg font-medium">TIN</div>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Chain
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex h-4 w-4 items-center justify-center rounded-sm bg-purple-500">
                      <div className="h-2 w-2 rounded-full bg-white"></div>
                    </div>
                    <span className="text-lg font-medium">Monad Testnet</span>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Description
                  </label>
                  <div className="text-sm">No Description</div>
                </div>
              </div>
            </div>

            {/* Total Supply Section */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Total Supply</label>
              <div className="text-2xl font-bold">1M</div>
            </div>

            {/* Coin Allocation Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Coin Allocation</label>
                <span className="text-sm font-medium">Total: 100%</span>
              </div>

              {/* Progress Bar */}
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full bg-blue-500"
                  style={{ width: "0%" }}
                ></div>
                <div
                  className="h-full bg-orange-400"
                  style={{ width: "80%" }}
                ></div>
                <div
                  className="h-full bg-purple-500"
                  style={{ width: "20%" }}
                ></div>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm font-medium">Owner: 0%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-orange-400"></div>
                  <span className="text-sm font-medium">Airdrop: 80%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-purple-500"></div>
                  <span className="text-sm font-medium">Sale: 20%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="outline"
            className="flex items-center gap-2 bg-transparent"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <div className="flex items-center gap-3">
            <Button
              className="flex items-center gap-2 bg-black px-6 py-2 text-white hover:bg-gray-800"
              onClick={handleLaunch}
              disabled={isLaunching}
            >
              <Upload className="h-4 w-4" />
              {isLaunching ? "Launching..." : "Launch Coin"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
