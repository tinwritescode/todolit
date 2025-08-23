"use client";

import { useState } from "react";
import CoinDistribution from "./coin-distribution";
import CoinInformation from "./coin-information";
import { LaunchCoin } from "./launch-coin";

export default function Page() {
  const [currentStep, setCurrentStep] = useState<
    "info" | "distribution" | "launch"
  >("info");
  const [coinData, setCoinData] = useState({
    name: "Tin",
    symbol: "TIN",
    chain: "monad-testnet",
    description: "",
    socialUrls: [
      { type: "Website", url: "https://www.facebook.com/npmrunstart" },
    ],
    totalSupply: 1000000,
    airdropEnabled: true,
    airdropPercentage: 80,
    saleEnabled: true,
    salePercentage: 20,
    pricePerToken: 0.1,
    currency: "mon",
  });

  const goToDistribution = () => setCurrentStep("distribution");
  const goToLaunch = () => setCurrentStep("launch");
  const goToInfo = () => setCurrentStep("info");

  if (currentStep === "distribution") {
    return (
      <CoinDistribution
        coinData={coinData}
        setCoinData={setCoinData}
        onBack={goToInfo}
        onNext={goToLaunch}
      />
    );
  }

  if (currentStep === "launch") {
    return <LaunchCoin onBack={goToDistribution} coinData={coinData} />;
  }

  return (
    <CoinInformation
      coinData={coinData}
      setCoinData={setCoinData}
      onNext={goToDistribution}
    />
  );
}
