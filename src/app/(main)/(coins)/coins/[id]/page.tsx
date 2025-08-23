"use client";

import { useParams, useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { formatName } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";

export default function CoinDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);
  const router = useRouter();
  const { data: token, isLoading } = api.token.byId.useQuery(
    { id },
    { enabled: Number.isFinite(id) },
  );

  const checkVerified = api.token.checkVerified.useMutation();
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);

  if (!Number.isFinite(id)) {
    return <div className="container mx-auto py-6">Invalid token id</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Coin Details</CardTitle>
          <Button variant="outline" onClick={() => router.back()}>
            Back
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading || !token ? (
            <div className="text-muted-foreground text-sm">Loading...</div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <div className="text-muted-foreground text-sm">Name</div>
                <div className="text-lg font-medium">{token.name}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-sm">Symbol</div>
                <div className="text-lg font-medium">{token.symbol}</div>
              </div>
              <div className="md:col-span-2">
                <div className="text-muted-foreground text-sm">Address</div>
                <div className="font-mono text-sm">{token.address}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-sm">Network</div>
                <div>{token.network ?? `Chain ${token.chainId}`}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-sm">Created</div>
                <div>
                  {format(new Date(token.createdAt), "yyyy-MM-dd HH:mm")}
                </div>
              </div>
              <div className="md:col-span-2">
                <div className="text-muted-foreground text-sm">Deploy Tx</div>
                <div className="font-mono text-sm break-all">
                  {formatName(token.deployTxHash)}
                </div>
              </div>
              {token.initializeTxHash && (
                <div className="md:col-span-2">
                  <div className="text-muted-foreground text-sm">
                    Initialize Tx
                  </div>
                  <div className="font-mono text-sm break-all">
                    {formatName(token.initializeTxHash)}
                  </div>
                </div>
              )}
              {token.description && (
                <div className="md:col-span-2">
                  <div className="text-muted-foreground text-sm">
                    Description
                  </div>
                  <div className="whitespace-pre-wrap">{token.description}</div>
                </div>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex items-center justify-between">
          <Button asChild variant="outline">
            <Link href="/coins">Back to list</Link>
          </Button>
          <div className="flex items-center gap-2">
            <Button
              disabled={!token || checkVerified.isPending}
              onClick={async () => {
                if (!token) return;
                const res = await checkVerified.mutateAsync({
                  address: token.address,
                });
                setVerifyMessage(
                  res.verified ? "Verified" : (res.message ?? "Not verified"),
                );
              }}
            >
              {checkVerified.isPending ? "Checking..." : "Check Verification"}
            </Button>
            {verifyMessage && (
              <span className="text-muted-foreground text-xs">
                {verifyMessage}
              </span>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}


