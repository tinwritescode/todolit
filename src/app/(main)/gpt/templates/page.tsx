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
import { Switch } from "@/components/ui/switch";
import { Trash2, Edit, Plus, FileCode } from "lucide-react";
import { api } from "@/trpc/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function GPTTemplatesPage() {
  const router = useRouter();
  const [templateName, setTemplateName] = useState("");
  const [templateContent, setTemplateContent] = useState("");
  const [templateVariables, setTemplateVariables] = useState("");
  const [isTemplatePublic, setIsTemplatePublic] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<{
    id: number;
    name: string;
    content: string;
    variables: any;
    isPublic: boolean;
  } | null>(null);

  const utils = api.useUtils();

  const { data: templates } = api.prompt.listTemplates.useQuery();

  const { mutate: createTemplate } = api.prompt.createTemplate.useMutation({
    onSuccess: () => {
      setTemplateName("");
      setTemplateContent("");
      setTemplateVariables("");
      setIsTemplatePublic(false);
      void utils.prompt.listTemplates.invalidate();
    },
  });

  const { mutate: updateTemplate } = api.prompt.updateTemplate.useMutation({
    onSuccess: () => {
      setEditingTemplate(null);
      void utils.prompt.listTemplates.invalidate();
    },
  });

  const { mutate: deleteTemplate } = api.prompt.deleteTemplate.useMutation({
    onSuccess: () => {
      void utils.prompt.listTemplates.invalidate();
    },
  });

  const handleCreateTemplate = () => {
    if (!templateName.trim() || !templateContent.trim()) return;
    let variables = {};
    try {
      if (templateVariables.trim()) {
        variables = JSON.parse(templateVariables);
      }
    } catch (e) {
      // Invalid JSON, use empty object
    }

    createTemplate({
      name: templateName.trim(),
      content: templateContent.trim(),
      variables,
      isPublic: isTemplatePublic,
    });
  };

  const handleUpdateTemplate = () => {
    if (
      !editingTemplate ||
      !editingTemplate.name.trim() ||
      !editingTemplate.content.trim()
    )
      return;
    let variables = {};
    try {
      if (templateVariables.trim()) {
        variables = JSON.parse(templateVariables);
      }
    } catch (e) {
      // Invalid JSON, use empty object
    }

    updateTemplate({
      id: editingTemplate.id,
      name: editingTemplate.name.trim(),
      content: editingTemplate.content.trim(),
      variables,
      isPublic: editingTemplate.isPublic,
    });
  };

  return (
    <div className="container mx-auto space-y-6 py-6">
      {/* Create Template Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCode className="h-5 w-5" />
            Create Prompt Template
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="template-name">Name</Label>
              <Input
                id="template-name"
                placeholder="Enter template name..."
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-public">Public Template</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="template-public"
                  checked={isTemplatePublic}
                  onCheckedChange={setIsTemplatePublic}
                />
                <Label htmlFor="template-public">
                  Make this template public
                </Label>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="template-content">Content</Label>
            <Textarea
              id="template-content"
              placeholder="Enter template content with variables like {{variable}}..."
              value={templateContent}
              onChange={(e) => setTemplateContent(e.target.value)}
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="template-variables">Variables (JSON)</Label>
            <Textarea
              id="template-variables"
              placeholder='{"variable": "default_value"}'
              value={templateVariables}
              onChange={(e) => setTemplateVariables(e.target.value)}
              rows={2}
            />
          </div>
          <Button
            onClick={handleCreateTemplate}
            disabled={!templateName.trim() || !templateContent.trim()}
          >
            Create Template
          </Button>
        </CardContent>
      </Card>

      {/* Templates List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCode className="h-5 w-5" />
            Prompt Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Content</TableHead>
                <TableHead>Variables</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates?.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">{template.name}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {template.content}
                  </TableCell>
                  <TableCell>
                    {Object.keys(template.variables || {}).length > 0 ? (
                      <Badge variant="outline">
                        {Object.keys(template.variables || {}).length} vars
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">None</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={template.isPublic ? "default" : "secondary"}
                    >
                      {template.isPublic ? "Public" : "Private"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(template.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setEditingTemplate({
                                id: template.id,
                                name: template.name,
                                content: template.content,
                                variables: template.variables || {},
                                isPublic: template.isPublic,
                              })
                            }
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Template</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Name</Label>
                              <Input
                                value={editingTemplate?.name || ""}
                                onChange={(e) =>
                                  setEditingTemplate((prev) =>
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
                                value={editingTemplate?.content || ""}
                                onChange={(e) =>
                                  setEditingTemplate((prev) =>
                                    prev
                                      ? { ...prev, content: e.target.value }
                                      : null,
                                  )
                                }
                                rows={4}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Variables (JSON)</Label>
                              <Textarea
                                value={JSON.stringify(
                                  editingTemplate?.variables || {},
                                  null,
                                  2,
                                )}
                                onChange={(e) => {
                                  try {
                                    const vars = JSON.parse(e.target.value);
                                    setEditingTemplate((prev) =>
                                      prev
                                        ? { ...prev, variables: vars }
                                        : null,
                                    );
                                  } catch (e) {
                                    // Invalid JSON, ignore
                                  }
                                }}
                                rows={2}
                              />
                            </div>
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={editingTemplate?.isPublic || false}
                                onCheckedChange={(checked) =>
                                  setEditingTemplate((prev) =>
                                    prev
                                      ? { ...prev, isPublic: checked }
                                      : null,
                                  )
                                }
                              />
                              <Label>Public Template</Label>
                            </div>
                            <Button onClick={handleUpdateTemplate}>
                              Update Template
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteTemplate({ id: template.id })}
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
