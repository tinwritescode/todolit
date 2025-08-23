"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

interface AddressListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddressListModal({
  open,
  onOpenChange,
}: AddressListModalProps) {
  const [addresses, setAddresses] =
    useState(`0x314ab97b76e39d63c78d5c86c2daf8eaa306b182 3.141592
thirdweb.eth,2.7182
0x141ca95b6177615fb1417cf70e930e102bf8f384=1.41421`);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-6">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Enter Addresses and Amounts
          </DialogTitle>
          <p className="text-sm text-gray-500">
            Enter one address and amount on each line. Supports various formats.
            (space, comma, or =)
          </p>
        </DialogHeader>

        <div className="mt-6 space-y-4">
          <Textarea
            value={addresses}
            onChange={(e) => setAddresses(e.target.value)}
            className="min-h-[200px] resize-none border-gray-200 font-mono text-sm"
            placeholder="Enter addresses and amounts..."
          />

          <Button
            className="w-full bg-gray-600 py-3 text-white hover:bg-gray-700"
            onClick={() => onOpenChange(false)}
          >
            Enter
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
