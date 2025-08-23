"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, ChevronRight } from "lucide-react";
import Image from "next/image";

export default function CoinInformation({
  coinData,
  setCoinData,
  onNext,
}: {
  coinData: any;
  setCoinData: (data: any) => void;
  onNext: () => void;
}) {
  return (
    <div>
      <div className="mx-auto max-w-4xl">
        <Card className="border-1 shadow-none">
          <CardHeader className="border-b border-gray-200 pb-6">
            <CardTitle className="text-2xl font-semibold">
              Coin Information
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-8 p-8">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* Image Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Image</label>
                <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 p-8">
                  <div className="flex flex-col items-center">
                    <Image
                      src="/laputa-logo.png"
                      alt="LAPUTA Logo"
                      width={120}
                      height={80}
                      className="mb-2 object-contain"
                    />
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-6 lg:col-span-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={coinData.name}
                      onChange={(e) =>
                        setCoinData({ ...coinData, name: e.target.value })
                      }
                      className="border-gray-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Symbol <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={coinData.symbol}
                      onChange={(e) =>
                        setCoinData({ ...coinData, symbol: e.target.value })
                      }
                      className="border-gray-200"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Chain <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={coinData.chain}
                    onValueChange={(value) =>
                      setCoinData({ ...coinData, chain: value })
                    }
                  >
                    <SelectTrigger className="border-gray-200">
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          <div className="flex h-4 w-4 items-center justify-center rounded-sm bg-purple-500">
                            <div className="h-2 w-2 rounded-full bg-white"></div>
                          </div>
                          {coinData.chain}
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monad-testnet">
                        <div className="flex items-center gap-2">
                          <div className="flex h-4 w-4 items-center justify-center rounded-sm bg-purple-500">
                            <div className="h-2 w-2 rounded-full bg-white"></div>
                          </div>
                          Monad Testnet
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    placeholder="Describe your coin"
                    value={coinData.description}
                    onChange={(e) =>
                      setCoinData({ ...coinData, description: e.target.value })
                    }
                    className="min-h-[120px] resize-none border-gray-200"
                  />
                </div>
              </div>
            </div>

            {/* Social URLs Section */}
            <div className="space-y-4">
              <label className="text-sm font-medium">Social URLs</label>

              <div className="flex items-center gap-4">
                <div className="w-24">
                  <Input
                    defaultValue="Website"
                    className="border-gray-200 text-center"
                    readOnly
                  />
                </div>
                <div className="flex-1">
                  <Input
                    value={coinData.socialUrls[0]?.url}
                    onChange={(e) =>
                      setCoinData({
                        ...coinData,
                        socialUrls: [
                          { ...coinData.socialUrls[0], url: e.target.value },
                        ],
                      })
                    }
                    className="border-gray-200"
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="border-gray-200 bg-transparent"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <Button
                variant="outline"
                className="border-gray-200 bg-transparent"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Social URL
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Next Button */}
        <div className="mt-6 flex justify-end">
          <Button
            className="bg-black px-6 py-2 text-white hover:bg-gray-800"
            onClick={onNext}
          >
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
