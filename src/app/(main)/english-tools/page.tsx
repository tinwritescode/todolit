"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, Pin, PinOff, RefreshCw } from "lucide-react";
import { api } from "@/trpc/react";
import { useState, useEffect } from "react";

export default function EnglishToolsPage() {
  const [sentence, setSentence] = useState("");
  const [countdown, setCountdown] = useState(10);
  const utils = api.useUtils();

  const { data: sentences } = api.englishTools.list.useQuery();
  const { mutate: createSentence } = api.englishTools.create.useMutation({
    onSuccess: () => {
      setSentence("");
      void utils.englishTools.list.invalidate();
    },
  });
  const { mutate: deleteSentence } = api.englishTools.delete.useMutation({
    onSuccess: () => {
      void utils.englishTools.list.invalidate();
    },
  });
  const { mutate: togglePin } = api.englishTools.togglePin.useMutation({
    onSuccess: () => {
      void utils.englishTools.list.invalidate();
    },
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          void utils.englishTools.list.invalidate();
          return 10;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [utils]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sentence.trim()) return;
    createSentence({ sentence: sentence.trim() });
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>English Tools</CardTitle>
            <div className="text-muted-foreground flex items-center gap-1 text-xs">
              <RefreshCw className="animate-spin-slow h-3 w-3" />
              <span>{countdown}s</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="sentence">Sentence</Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  id="sentence"
                  placeholder="Enter your sentence..."
                  className="flex-1"
                  value={sentence}
                  onChange={(e) => setSentence(e.target.value)}
                />
                <Button type="submit">Add</Button>
              </div>
            </div>
          </form>

          {/* List of sentences */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead>Sentence</TableHead>
                <TableHead>Grammar Check</TableHead>
                <TableHead>Alternative Expressions</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sentences?.map((sentence) => (
                <TableRow
                  key={sentence.id}
                  className={sentence.pinned ? "bg-muted/50" : ""}
                >
                  <TableCell>{sentence.id}</TableCell>
                  <TableCell className="max-w-[300px] break-words whitespace-pre-wrap">
                    {sentence.sentence}
                    <div className="mt-1">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          sentence.status === "INITIAL"
                            ? "bg-gray-100 text-gray-700"
                            : sentence.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-700"
                              : sentence.status === "COMPLETE"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                        }`}
                      >
                        {sentence.status.toLowerCase()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px] break-words whitespace-pre-wrap">
                    {sentence.isCorrect ? (
                      "✅ Correct"
                    ) : (
                      <div>
                        <span>❌ Incorrect</span>
                        {sentence.incorrectReason && (
                          <p className="text-destructive mt-1 text-sm">
                            {sentence.incorrectReason}
                          </p>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[300px] break-words whitespace-pre-wrap">
                    <div className="space-y-2">
                      {sentence.b1Level.length > 0 && (
                        <div>
                          <span className="font-semibold">B1 level:</span>
                          <ul className="list-disc pl-4">
                            {sentence.b1Level.map((alt, i) => (
                              <li key={i}>{alt}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {sentence.b2Level.length > 0 && (
                        <div>
                          <span className="font-semibold">B2 level:</span>
                          <ul className="list-disc pl-4">
                            {sentence.b2Level.map((alt, i) => (
                              <li key={i}>{alt}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {sentence.c1Level.length > 0 && (
                        <div className="mt-4">
                          <h3 className="font-semibold text-gray-900">
                            C1 Level
                          </h3>
                          {sentence.c1Level.map((alt, i) => (
                            <p key={i} className="text-sm text-gray-600">
                              {alt}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 ${
                          sentence.pinned ? "text-primary" : ""
                        }`}
                        onClick={() => togglePin({ id: sentence.id })}
                      >
                        {sentence.pinned ? (
                          <Pin className="h-4 w-4 fill-current" />
                        ) : (
                          <PinOff className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive h-8 w-8"
                        onClick={() => deleteSentence({ id: sentence.id })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
