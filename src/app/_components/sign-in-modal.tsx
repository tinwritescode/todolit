"use client";

import { signInModal } from "@/app/(main)/signInModal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Wallet } from "lucide-react";
import { getCsrfToken, signIn } from "next-auth/react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { SiweMessage } from "siwe";
import { useSnapshot } from "valtio";
import { useAccount, useChainId, useConnect, useSignMessage } from "wagmi";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export function SignInModal() {
  const snap = useSnapshot(signInModal);
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { signMessageAsync } = useSignMessage();
  const { connectors, connectAsync } = useConnect();
  const [isLoading, setIsLoading] = useState(false);
  const isMobile = useIsMobile();

  const connector = useMemo(
    () => connectors.find((c) => c.id === "metaMaskSDK"),
    [connectors],
  );
  const walletConnector = useMemo(
    () => connectors.find((c) => c.id === "walletConnect"),
    [connectors],
  );
  async function handleSiweLogin() {
    try {
      setIsLoading(true);
      if (!isConnected) {
        if (!connector) throw new Error("No MetaMask wallet found");
        await connectAsync({ connector });
      }

      const currentAddress = address;
      if (!currentAddress) throw new Error("No wallet address");

      const nonce = await getCsrfToken();
      if (!nonce) throw new Error("Failed to get CSRF token");

      const message = new SiweMessage({
        domain: window.location.host,
        address: currentAddress,
        statement: "Sign in with Ethereum to the app.",
        uri: window.location.origin,
        version: "1",
        chainId,
        nonce,
      });

      const signature = await signMessageAsync({
        message: message.prepareMessage(),
      });

      await signIn("credentials", {
        message: JSON.stringify(message),
        signature,
        redirect: true,
        callbackUrl: "/",
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleWalletConnectLogin() {
    try {
      setIsLoading(true);
      if (!isConnected) {
        if (!walletConnector) throw new Error("No WalletConnect wallet found");
        await connectAsync({ connector: walletConnector });
      }

      const currentAddress = address;
      if (!currentAddress) throw new Error("No wallet address");

      const nonce = await getCsrfToken();
      if (!nonce) throw new Error("Failed to get CSRF token");

      const message = new SiweMessage({
        domain: window.location.host,
        address: currentAddress,
        statement: "Sign in with Ethereum to the app.",
        uri: window.location.origin,
        version: "1",
        chainId,
        nonce,
      });

      const signature = await signMessageAsync({
        message: message.prepareMessage(),
      });

      await signIn("credentials", {
        message: JSON.stringify(message),
        signature,
        redirect: true,
        callbackUrl: "/",
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDiscordLogin() {
    try {
      setIsLoading(true);
      await signIn("discord");
    } finally {
      setIsLoading(false);
    }
  }

  const Buttons = (
    <div className="space-y-2">
      <Button
        className="w-full"
        variant="outline"
        size="lg"
        onClick={handleDiscordLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
            Signing in...
          </>
        ) : (
          "Continue with Discord"
        )}
      </Button>
      <Button
        className="w-full"
        size="lg"
        onClick={handleSiweLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
            Signing in...
          </>
        ) : (
          <>
            {connector?.icon ? (
              <Image
                src={connector?.icon}
                alt="MetaMask"
                width={20}
                height={20}
              />
            ) : (
              <Wallet className="size-4" />
            )}
            Continue with MetaMask
          </>
        )}
      </Button>
      <Button
        className="w-full"
        size="lg"
        onClick={handleWalletConnectLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
            Signing in...
          </>
        ) : (
          <>
            {walletConnector?.icon ? (
              <Image
                src={walletConnector?.icon}
                alt="WalletConnect"
                width={20}
                height={20}
              />
            ) : (
              <Wallet className="size-4" />
            )}
            Continue with WalletConnect
          </>
        )}
      </Button>
    </div>
  );

  return (
    <>
      {isMobile ? (
        <Sheet open={snap.isOpen} onOpenChange={snap.setIsOpen}>
          <SheetContent side="bottom" className="rounded-t-2xl p-4">
            <SheetHeader>
              <SheetTitle>Sign In</SheetTitle>
              <SheetDescription>Choose a sign-in method</SheetDescription>
            </SheetHeader>
            {Buttons}
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={snap.isOpen} onOpenChange={snap.setIsOpen}>
          <DialogContent className="max-w-sm sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Sign In</DialogTitle>
              <DialogDescription>Choose a sign-in method</DialogDescription>
            </DialogHeader>
            {Buttons}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
