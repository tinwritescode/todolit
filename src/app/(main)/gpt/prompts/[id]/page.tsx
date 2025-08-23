"use client";

import { useParams, useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Edit,
  Save,
  X,
  FileCode,
  Play,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

export default function PromptDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editContent, setEditContent] = useState("");

  // SubPrompt states
  const [subPromptName, setSubPromptName] = useState("");
  const [subPromptVariables, setSubPromptVariables] = useState<
    Record<string, string>
  >({});
  const [editingSubPrompt, setEditingSubPrompt] = useState<{
    id: number;
    name: string;
    content: string;
  } | null>(null);

  const utils = api.useUtils();

  const { data: prompt, isLoading } = api.prompt.byId.useQuery(
    { id },
    { enabled: Number.isFinite(id) },
  );

  const { mutate: updatePrompt } = api.prompt.update.useMutation({
    onSuccess: () => {
      setIsEditing(false);
      void utils.prompt.byId.invalidate({ id });
    },
  });

  const { mutate: deletePrompt } = api.prompt.delete.useMutation({
    onSuccess: () => {
      router.push("/gpt");
    },
  });

  const { mutate: processPrompt, isPending: isProcessing } =
    api.prompt.process.useMutation({
      onSuccess: () => {
        void utils.prompt.byId.invalidate({ id });
      },
    });

  // SubPrompt mutations
  const { mutate: createSubPrompt } = api.prompt.createSubPrompt.useMutation({
    onSuccess: () => {
      setSubPromptName("");
      setSubPromptVariables({});
      void utils.prompt.byId.invalidate({ id });
    },
  });

  const { mutate: updateSubPrompt } = api.prompt.updateSubPrompt.useMutation({
    onSuccess: () => {
      setEditingSubPrompt(null);
      void utils.prompt.byId.invalidate({ id });
    },
  });

  const { mutate: deleteSubPrompt } = api.prompt.deleteSubPrompt.useMutation({
    onSuccess: () => {
      void utils.prompt.byId.invalidate({ id });
    },
  });

  const { mutate: executeSubPrompt, isPending: isExecutingSubPrompt } =
    api.prompt.executeSubPrompt.useMutation({
      onSuccess: () => {
        void utils.prompt.byId.invalidate({ id });
      },
    });

  // Extract variables from content (same logic as main prompt creation)
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

  // Extract variables from parent prompt template and set up subprompt variables
  useEffect(() => {
    if (prompt?.promptTemplate?.content) {
      const variables = extractVariables(prompt.promptTemplate.content);
      const initialVariables: Record<string, string> = {};
      variables.forEach((variable) => {
        initialVariables[variable] = "";
      });
      setSubPromptVariables(initialVariables);
    } else {
      setSubPromptVariables({});
    }
  }, [prompt?.promptTemplate?.content]);

  if (!Number.isFinite(id)) {
    return <div className="container mx-auto py-6">Invalid prompt id</div>;
  }

  if (isLoading || !prompt) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  const handleSave = () => {
    if (!editName.trim() || !editContent.trim()) return;

    updatePrompt({
      id: prompt.id,
      name: editName.trim(),
      content: editContent.trim(),
      promptTemplateId: prompt.promptTemplateId || undefined,
    });
  };

  const handleEdit = () => {
    setEditName(prompt.name ?? "");
    setEditContent(prompt.content);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditName("");
    setEditContent("");
  };

  // SubPrompt handlers
  const handleCreateSubPrompt = () => {
    if (!subPromptName.trim() || !prompt?.promptTemplate?.content) return;

    // Replace variables in parent template content
    let finalContent = prompt.promptTemplate.content;
    Object.entries(subPromptVariables).forEach(([variable, value]) => {
      const regex = new RegExp(`\\{\\{\\s*${variable}\\s*\\}\\}`, "g");
      finalContent = finalContent.replace(regex, value);
    });

    createSubPrompt({
      name: subPromptName.trim(),
      content: finalContent.trim(),
      promptId: prompt.id,
    });
  };

  const handleUpdateSubPrompt = () => {
    if (!editingSubPrompt?.name.trim() || !editingSubPrompt?.content.trim())
      return;
    updateSubPrompt({
      id: editingSubPrompt.id,
      name: editingSubPrompt.name.trim(),
      content: editingSubPrompt.content.trim(),
    });
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Prompt Details</h1>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={() => processPrompt({ id: prompt.id })}
                disabled={isProcessing || prompt.status === "PENDING"}
              >
                {isProcessing || prompt.status === "PENDING" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                {prompt.status === "COMPLETE" ? "Re-run" : "Process"}
              </Button>
              <Button variant="outline" onClick={handleEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="destructive"
                onClick={() => deletePrompt({ id: prompt.id })}
              >
                Delete
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Prompt Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Name</Label>
                {isEditing ? (
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Enter prompt name..."
                  />
                ) : (
                  <div className="text-lg font-medium">
                    {prompt.name ?? "Untitled"}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <div>
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
                </div>
              </div>
              <div className="space-y-2">
                <Label>Created</Label>
                <div>
                  {format(new Date(prompt.createdAt), "yyyy-MM-dd HH:mm")}
                </div>
              </div>
              {prompt.errorMessage && (
                <div className="space-y-2">
                  <Label>Error</Label>
                  <div className="text-sm text-red-600">
                    {prompt.errorMessage}
                  </div>
                </div>
              )}
            </div>

            {prompt.promptTemplate && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileCode className="h-4 w-4" />
                  Template
                </Label>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{prompt.promptTemplate.name}</Badge>
                  <span className="text-muted-foreground text-sm">
                    {prompt.promptTemplate.isPublic ? "Public" : "Private"}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Content</Label>
              {isEditing ? (
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Enter prompt content..."
                  rows={8}
                />
              ) : (
                <div className="bg-muted/50 rounded-md border p-4 whitespace-pre-wrap">
                  {prompt.content}
                </div>
              )}
            </div>

            {prompt.result && (
              <div className="space-y-2">
                <Label>Result</Label>
                <div className="rounded-md border bg-green-50 p-4 whitespace-pre-wrap">
                  {prompt.result}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SubPrompts Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileCode className="h-5 w-5" />
                SubPrompts
              </CardTitle>
              {prompt?.promptTemplate ? (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Add SubPrompt
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create SubPrompt</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="subprompt-name">Name</Label>
                        <Input
                          id="subprompt-name"
                          placeholder="Enter subprompt name..."
                          value={subPromptName}
                          onChange={(e) => setSubPromptName(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Parent Template Content</Label>
                        <div className="bg-muted/50 rounded-md border p-4 text-sm whitespace-pre-wrap">
                          {prompt?.promptTemplate?.content ??
                            "No template available"}
                        </div>
                      </div>

                      {/* Variable inputs - Comment section style */}
                      {Object.keys(subPromptVariables).length > 0 && (
                        <div className="space-y-4">
                          <Label>Input Variables:</Label>
                          <div className="space-y-3">
                            {Object.keys(subPromptVariables).map((variable) => (
                              <div key={variable} className="space-y-2">
                                <div className="text-muted-foreground text-sm font-medium">
                                  {variable}
                                </div>
                                <Input
                                  placeholder={`Enter ${variable}...`}
                                  value={subPromptVariables[variable]}
                                  onChange={(e) =>
                                    setSubPromptVariables((prev) => ({
                                      ...prev,
                                      [variable]: e.target.value,
                                    }))
                                  }
                                />
                              </div>
                            ))}
                          </div>

                          {/* Example payload preview */}
                          <div className="space-y-2">
                            <Label>Example Payload:</Label>
                            <div className="bg-muted/50 rounded-md border p-3 font-mono text-sm">
                              {JSON.stringify(subPromptVariables, null, 2)}
                            </div>
                          </div>
                        </div>
                      )}

                      <Button
                        onClick={handleCreateSubPrompt}
                        disabled={!subPromptName.trim()}
                      >
                        Submit
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              ) : (
                <div className="text-muted-foreground text-sm">
                  No template available for subprompts
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {prompt.subPrompts && prompt.subPrompts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Content</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prompt.subPrompts.map((subPrompt) => (
                    <TableRow key={subPrompt.id}>
                      <TableCell className="font-medium">
                        {subPrompt.name}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {subPrompt.content}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            subPrompt.status === "COMPLETE"
                              ? "default"
                              : subPrompt.status === "ERROR"
                                ? "destructive"
                                : subPrompt.status === "PENDING"
                                  ? "secondary"
                                  : "outline"
                          }
                        >
                          {subPrompt.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(subPrompt.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              executeSubPrompt({ id: subPrompt.id })
                            }
                            disabled={subPrompt.status === "PENDING"}
                          >
                            {subPrompt.status === "PENDING" ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setEditingSubPrompt({
                                    id: subPrompt.id,
                                    name: subPrompt.name,
                                    content: subPrompt.content,
                                  })
                                }
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit SubPrompt</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label>Name</Label>
                                  <Input
                                    value={editingSubPrompt?.name ?? ""}
                                    onChange={(e) =>
                                      setEditingSubPrompt((prev) =>
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
                                    value={editingSubPrompt?.content ?? ""}
                                    onChange={(e) =>
                                      setEditingSubPrompt((prev) =>
                                        prev
                                          ? { ...prev, content: e.target.value }
                                          : null,
                                      )
                                    }
                                    rows={4}
                                  />
                                </div>
                                <Button onClick={handleUpdateSubPrompt}>
                                  Update SubPrompt
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              deleteSubPrompt({ id: subPrompt.id })
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-muted-foreground py-8 text-center">
                No subprompts yet. Create your first subprompt to get started.
              </div>
            )}

            {/* SubPrompt Results */}
            {prompt.subPrompts && prompt.subPrompts.some((sp) => sp.result) && (
              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-semibold">SubPrompt Results</h3>
                {prompt.subPrompts
                  .filter((sp) => sp.result)
                  .map((subPrompt) => (
                    <div key={subPrompt.id} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{subPrompt.name}</h4>
                        <Badge
                          variant={
                            subPrompt.status === "COMPLETE"
                              ? "default"
                              : subPrompt.status === "ERROR"
                                ? "destructive"
                                : "outline"
                          }
                        >
                          {subPrompt.status}
                        </Badge>
                      </div>
                      <div className="bg-muted/50 rounded-md border p-4 text-sm whitespace-pre-wrap">
                        {subPrompt.result}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
