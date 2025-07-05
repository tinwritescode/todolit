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
import { Trash2, Pin, PinOff } from "lucide-react";
import { api } from "@/trpc/react";
import { useState } from "react";

export default function EnglishToolsPage() {
  const [sentence, setSentence] = useState("");
  const utils = api.useUtils();

  const { data: sentences } = api.englishTools.list.useQuery();
  const { mutate: createSentence } = api.englishTools.create.useMutation({
    onSuccess: () => {
      setSentence("");
      utils.englishTools.list.invalidate();
    },
  });
  const { mutate: deleteSentence } = api.englishTools.delete.useMutation({
    onSuccess: () => {
      utils.englishTools.list.invalidate();
    },
  });
  const { mutate: togglePin } = api.englishTools.togglePin.useMutation({
    onSuccess: () => {
      utils.englishTools.list.invalidate();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sentence.trim()) return;
    createSentence({ sentence: sentence.trim() });
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>English Tools</CardTitle>
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
                  <TableCell>{sentence.sentence}</TableCell>
                  <TableCell>
                    {sentence.isCorrect ? "✅ Correct" : "❌ Incorrect"}
                  </TableCell>
                  <TableCell>
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
                      {sentence.a1Level.length > 0 && (
                        <div>
                          <span className="font-semibold">A1 level:</span>
                          <ul className="list-disc pl-4">
                            {sentence.a1Level.map((alt, i) => (
                              <li key={i}>{alt}</li>
                            ))}
                          </ul>
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
