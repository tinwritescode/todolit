"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, ChevronRight, FileText, X } from "lucide-react";
import { useState } from "react";
import AddressListModal from "./_components/address-list-modal";

export default function CoinDistribution({
  coinData,
  setCoinData,
  onBack,
  onNext,
}: {
  coinData: any;
  setCoinData: (data: any) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const airdropTokens = Math.floor(
    (coinData.totalSupply * coinData.airdropPercentage) / 100,
  );
  const saleTokens = Math.floor(
    (coinData.totalSupply * coinData.salePercentage) / 100,
  );
  const ownerPercentage =
    100 - coinData.airdropPercentage - coinData.salePercentage;
  const [showAddressList, setShowAddressList] = useState(false);

  return (
    <div>
      <div className="mx-auto max-w-4xl">
        <Card className="border-1 shadow-none">
          <CardHeader className="border-b border-gray-200 pb-6">
            <CardTitle className="text-2xl font-semibold text-gray-900">
              Coin Distribution
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-8 p-8">
            {/* Total Supply */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Total Supply <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input
                  value={coinData.totalSupply}
                  onChange={(e) =>
                    setCoinData({
                      ...coinData,
                      totalSupply: Number.parseInt(e.target.value) || 0,
                    })
                  }
                  className="border-gray-200 pr-12"
                />
                <div className="absolute top-1/2 right-3 -translate-y-1/2 transform text-sm text-gray-500">
                  TIN
                </div>
              </div>
            </div>

            {/* Coin Allocation */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Coin Allocation
                </label>
                <span className="text-sm text-gray-500">Total: 100%</span>
              </div>

              {/* Progress Bar */}
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full bg-blue-500"
                  style={{ width: `${ownerPercentage}%` }}
                ></div>
                <div
                  className="h-full bg-orange-400"
                  style={{ width: `${coinData.airdropPercentage}%` }}
                ></div>
                <div
                  className="h-full bg-purple-500"
                  style={{ width: `${coinData.salePercentage}%` }}
                ></div>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm text-gray-700">
                    Owner: {ownerPercentage}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-orange-400"></div>
                  <span className="text-sm text-gray-700">
                    Airdrop: {coinData.airdropPercentage}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-purple-500"></div>
                  <span className="text-sm text-gray-700">
                    Sale: {coinData.salePercentage}%
                  </span>
                </div>
              </div>
            </div>

            {/* Airdrop Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Airdrop
                  </h3>
                  <p className="text-sm text-gray-500">
                    Airdrop tokens to a list of addresses with each address
                    receiving a specific quantity
                  </p>
                </div>
                <Switch
                  checked={coinData.airdropEnabled}
                  onCheckedChange={(checked) =>
                    setCoinData({ ...coinData, airdropEnabled: checked })
                  }
                />
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">
                      Airdrop List Set
                    </div>
                    <div className="text-sm text-gray-500">
                      <span className="font-medium">1</span> addresses will
                      receive a total of{" "}
                      <span className="font-medium">{airdropTokens}</span>{" "}
                      tokens
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-200 bg-transparent"
                      onClick={() => setShowAddressList(true)}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      View List
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-200 bg-transparent"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sale Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Sale</h3>
                  <p className="text-sm text-gray-500">
                    Make your coin available for purchase by setting a price
                  </p>
                </div>
                <Switch
                  checked={coinData.saleEnabled}
                  onCheckedChange={(checked) =>
                    setCoinData({ ...coinData, saleEnabled: checked })
                  }
                />
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Sell % of Total Supply{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      value={coinData.salePercentage}
                      onChange={(e) =>
                        setCoinData({
                          ...coinData,
                          salePercentage: Number.parseInt(e.target.value) || 0,
                        })
                      }
                      className="border-gray-200 pr-8"
                    />
                    <div className="absolute top-1/2 right-3 -translate-y-1/2 transform text-sm text-gray-500">
                      %
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {saleTokens} tokens
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Price per Token <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={coinData.pricePerToken}
                      onChange={(e) =>
                        setCoinData({
                          ...coinData,
                          pricePerToken: Number.parseFloat(e.target.value) || 0,
                        })
                      }
                      className="border-gray-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Currency <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={coinData.currency}
                      onValueChange={(value) =>
                        setCoinData({ ...coinData, currency: value })
                      }
                    >
                      <SelectTrigger className="border-gray-200">
                        <SelectValue>
                          <div className="flex items-center gap-2">
                            <div className="flex h-4 w-4 items-center justify-center rounded-sm bg-purple-500">
                              <div className="h-2 w-2 rounded-full bg-white"></div>
                            </div>
                            MON
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mon">
                          <div className="flex items-center gap-2">
                            <div className="flex h-4 w-4 items-center justify-center rounded-sm bg-purple-500">
                              <div className="h-2 w-2 rounded-full bg-white"></div>
                            </div>
                            MON
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="outline"
            className="border-gray-200 bg-transparent"
            onClick={onBack}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button
            className="bg-black px-6 py-2 text-white hover:bg-gray-800"
            onClick={onNext}
          >
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        <AddressListModal
          open={showAddressList}
          onOpenChange={setShowAddressList}
        />
      </div>
    </div>
  );
}
