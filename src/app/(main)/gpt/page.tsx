"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Plus, FileText, FileCode } from "lucide-react";
import { api } from "@/trpc/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function GPTPage() {
  const router = useRouter();
  const [promptContent, setPromptContent] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<
    number | undefined
  >();
  const [templateVariables, setTemplateVariables] = useState<
    Record<string, string>
  >({});
  const [editingPrompt, setEditingPrompt] = useState<{
    id: number;
    name: string;
    content: string;
    promptTemplateId?: number;
  } | null>(null);

  const utils = api.useUtils();

  const { data: prompts } = api.prompt.list.useQuery();
  const { data: templates } = api.prompt.listTemplates.useQuery();

  // Extract variables from template content
  const extractVariables = (content: string): string[] => {
    const variableRegex = /\{\{\s*(\w+)\s*\}\}/g;
    const variables: string[] = [];
    let match;

    while ((match = variableRegex.exec(content)) !== null) {
      const variableName = match[1];
      if (variableName && !variables.includes(variableName)) {
        variables.push(variableName);
      }
    }

    return variables;
  };

  // Get selected template
  const selectedTemplate = templates?.find((t) => t.id === selectedTemplateId);

  // Update template variables when template changes
  useEffect(() => {
    if (selectedTemplate?.content) {
      const variables = extractVariables(selectedTemplate.content);
      const initialVariables: Record<string, string> = {};
      variables.forEach((variable) => {
        initialVariables[variable] = "";
      });
      setTemplateVariables(initialVariables);
      setPromptContent(selectedTemplate.content);
    } else {
      setTemplateVariables({});
      setPromptContent("");
    }
  }, [selectedTemplate]);

  // Update prompt content when variables change
  useEffect(() => {
    if (selectedTemplate?.content) {
      let content = selectedTemplate.content;
      Object.entries(templateVariables).forEach(([variable, value]) => {
        const regex = new RegExp(`\\{\\{\\s*${variable}\\s*\\}\\}`, "g");
        content = content.replace(regex, value);
      });
      setPromptContent(content);
    }
  }, [templateVariables, selectedTemplate]);

  const { mutate: createPrompt } = api.prompt.create.useMutation({
    onSuccess: (prompt) => {
      setPromptContent("");
      setSelectedTemplateId(undefined);
      setTemplateVariables({});
      void utils.prompt.list.invalidate();
      // Navigate to the prompt detail page
      router.push(`/gpt/prompts/${prompt.id}`);
    },
  });

  const { mutate: updatePrompt } = api.prompt.update.useMutation({
    onSuccess: () => {
      setEditingPrompt(null);
      void utils.prompt.list.invalidate();
    },
  });

  const { mutate: deletePrompt } = api.prompt.delete.useMutation({
    onSuccess: () => {
      void utils.prompt.list.invalidate();
    },
  });

  const { mutate: processPrompt } = api.prompt.process.useMutation({
    onSuccess: () => {
      void utils.prompt.list.invalidate();
    },
  });

  const handleCreatePrompt = () => {
    if (!promptContent.trim()) return;
    createPrompt({
      name: undefined,
      content: promptContent.trim(),
      promptTemplateId: selectedTemplateId,
    });
  };

  const handleUpdatePrompt = () => {
    if (!editingPrompt?.name.trim() || !editingPrompt?.content.trim()) return;
    updatePrompt({
      id: editingPrompt.id,
      name: editingPrompt.name.trim(),
      content: editingPrompt.content.trim(),
      promptTemplateId: editingPrompt.promptTemplateId,
    });
  };

  return (
    <div className="container mx-auto space-y-6 py-6">
      {/* Create Prompt Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create Prompt
            </CardTitle>
            <Link href="/gpt/templates">
              <Button variant="outline" className="flex items-center gap-2">
                <FileCode className="h-4 w-4" />
                Manage Templates
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="prompt-template">Template (Optional)</Label>
              <select
                id="prompt-template"
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                value={selectedTemplateId ?? ""}
                onChange={(e) =>
                  setSelectedTemplateId(
                    e.target.value ? Number(e.target.value) : undefined,
                  )
                }
              >
                <option value="">No template</option>
                {templates?.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Template Variables */}
          {selectedTemplate && Object.keys(templateVariables).length > 0 && (
            <div className="space-y-4">
              <Label>Template Variables</Label>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {Object.keys(templateVariables).map((variable) => (
                  <div key={variable} className="space-y-2">
                    <Label htmlFor={`variable-${variable}`}>{variable}</Label>
                    <Input
                      id={`variable-${variable}`}
                      placeholder={`Enter ${variable}...`}
                      value={templateVariables[variable]}
                      onChange={(e) =>
                        setTemplateVariables((prev) => ({
                          ...prev,
                          [variable]: e.target.value,
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="prompt-content">Content</Label>
            <Textarea
              id="prompt-content"
              placeholder="Enter your prompt content..."
              value={promptContent}
              onChange={(e) => setPromptContent(e.target.value)}
              rows={4}
            />
          </div>
          <Button onClick={handleCreatePrompt} disabled={!promptContent.trim()}>
            Create Prompt
          </Button>
        </CardContent>
      </Card>

      {/* Prompts List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Your Prompts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Content</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prompts?.map((prompt) => (
                <TableRow key={prompt.id}>
                  <TableCell className="font-medium">
                    {prompt.name ?? "Untitled"}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {prompt.content}
                  </TableCell>
                  <TableCell>
                    {prompt.promptTemplate ? (
                      <Badge variant="secondary">
                        {prompt.promptTemplate.name}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">None</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        prompt.status === "COMPLETE"
                          ? "default"
                          : prompt.status === "ERROR"
                            ? "destructive"
                            : prompt.status === "PENDING"
                              ? "secondary"
                              : "outline"
                      }
                    >
                      {prompt.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(prompt.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/gpt/prompts/${prompt.id}`)}
                      >
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => processPrompt({ id: prompt.id })}
                        disabled={prompt.status === "PENDING"}
                      >
                        {prompt.status === "PENDING"
                          ? "Processing..."
                          : "Process"}
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setEditingPrompt({
                                id: prompt.id,
                                name: prompt.name ?? "",
                                content: prompt.content,
                                promptTemplateId:
                                  prompt.promptTemplateId ?? undefined,
                              })
                            }
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Prompt</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Name</Label>
                              <Input
                                value={editingPrompt?.name ?? ""}
                                onChange={(e) =>
                                  setEditingPrompt((prev) =>
                                    prev
                                      ? { ...prev, name: e.target.value }
                                      : null,
                                  )
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Content</Label>
                              <Textarea
                                value={editingPrompt?.content ?? ""}
                                onChange={(e) =>
                                  setEditingPrompt((prev) =>
                                    prev
                                      ? { ...prev, content: e.target.value }
                                      : null,
                                  )
                                }
                                rows={4}
                              />
                            </div>
                            <Button onClick={handleUpdatePrompt}>
                              Update Prompt
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deletePrompt({ id: prompt.id })}
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
