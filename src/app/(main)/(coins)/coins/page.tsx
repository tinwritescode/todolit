"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/trpc/react";
import { format } from "date-fns";
import { formatName } from "@/lib/utils";
import { useState } from "react";
import { Copy } from "lucide-react";

export default function CoinsPage() {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const { data, isLoading, isFetching } = api.token.list.useQuery(
    { page, pageSize },
    { placeholderData: (prev) => prev },
  );
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  const [copied, setCopied] = useState<string | null>(null);

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>My Coins</CardTitle>
            <Button asChild>
              <Link href="/coins/launch-coins">Launch New Coin</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-muted-foreground text-sm">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[64px]">Logo</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Network</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <div className="bg-muted flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border">
                        {t.imageUrl ? (
                          <Image
                            src={t.imageUrl}
                            alt={t.symbol}
                            width={32}
                            height={32}
                            className="object-cover"
                          />
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            {t.symbol?.[0] ?? "?"}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {t.name}
                    </TableCell>
                    <TableCell>{t.symbol}</TableCell>
                    <TableCell className="font-mono text-xs">
                      <div className="flex items-center gap-2">
                        <span>{formatName(t.address)}</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2"
                          aria-label="Copy address"
                          onClick={() => {
                            void navigator.clipboard.writeText(t.address);
                            setCopied(t.address);
                            setTimeout(() => setCopied(null), 1200);
                          }}
                        >
                          <Copy className="h-3.5 w-3.5" />
                          <span className="sr-only">Copy</span>
                        </Button>
                        {copied === t.address && (
                          <span className="text-muted-foreground text-[11px]">
                            Copied
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{t.network ?? `Chain ${t.chainId}`}</TableCell>
                    <TableCell>
                      {t.createdAt
                        ? format(new Date(t.createdAt), "yyyy-MM-dd")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/coins/${t.id}`}>Details</Link>
                        </Button>
                        <Button asChild size="sm">
                          <Link href={`/coins/launch-coins`}>Launch</Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {data && items.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-muted-foreground py-8 text-center text-sm"
                    >
                      No coins yet. Click &quot;Launch New Coin&quot; to create
                      one.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
        <CardFooter className="flex items-center justify-between">
          <div className="text-muted-foreground text-xs">
            Page {page} of {lastPage}
            {isFetching ? <span className="ml-2">(updating...)</span> : null}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isFetching}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
              disabled={page >= lastPage || isFetching}
            >
              Next
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
