"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function BinancePage() {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState("");

  type Trade = {
    id: number;
    symbol: string;
    side: string;
    price: number;
    qty: number;
    time: string;
    prompt?: string;
  };
  const [trades, setTrades] = useState<Trade[]>([
    {
      id: 1,
      symbol: "BTCUSDT",
      side: "BUY",
      price: 60000,
      qty: 0.01,
      time: "2024-07-05 10:00",
    },
    {
      id: 2,
      symbol: "ETHUSDT",
      side: "SELL",
      price: 3500,
      qty: 0.5,
      time: "2024-07-05 11:00",
    },
  ]);
  const [prompt, setPrompt] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const saved =
      typeof window !== "undefined"
        ? localStorage.getItem("binance-password")
        : null;
    if (saved) {
      setPassword(saved);
      if (saved === "binance") {
        setUnlocked(true);
      }
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "binance") {
      setUnlocked(true);
      setError("");
      if (typeof window !== "undefined") {
        localStorage.setItem("binance-password", password);
      }
    } else {
      setError("Incorrect password");
    }
  };

  const handleCreateTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setCreating(true);
    setTimeout(() => {
      setTrades((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          symbol: "AI-COIN",
          side: "BUY",
          price: 1234,
          qty: 1,
          time: new Date().toLocaleString(),
          prompt: prompt.trim(),
        },
      ]);
      setPrompt("");
      setCreating(false);
    }, 1000);
  };

  if (!unlocked) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Enter Password</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                />
                {error && (
                  <div className="text-destructive mt-1 text-sm">{error}</div>
                )}
              </div>
              <Button type="submit" className="w-full">
                Unlock
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-8 py-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>My Trades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="px-2 py-1 text-left">Symbol</th>
                  <th className="px-2 py-1 text-left">Side</th>
                  <th className="px-2 py-1 text-left">Price</th>
                  <th className="px-2 py-1 text-left">Qty</th>
                  <th className="px-2 py-1 text-left">Time</th>
                  <th className="px-2 py-1 text-left">Prompt</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((trade) => (
                  <tr key={trade.id}>
                    <td className="px-2 py-1">{trade.symbol}</td>
                    <td className="px-2 py-1">{trade.side}</td>
                    <td className="px-2 py-1">{trade.price}</td>
                    <td className="px-2 py-1">{trade.qty}</td>
                    <td className="px-2 py-1">{trade.time}</td>
                    <td className="px-2 py-1">{trade.prompt ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Create Trade (AI)</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleCreateTrade}>
            <Label htmlFor="prompt">Prompt</Label>
            <textarea
              id="prompt"
              className="min-h-[60px] w-full rounded border p-2"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your trade idea..."
              disabled={creating}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={creating || !prompt.trim()}
            >
              {creating ? "Creating..." : "Ask AI to Create Trade"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
