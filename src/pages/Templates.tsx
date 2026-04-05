import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Edit, Copy, Trash2, Variable } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: string | null;
  created_at: string;
}

const variables = ["{first_name}", "{last_name}", "{company_name}", "{industry}", "{location}"];

export default function Templates() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");

  const fetchTemplates = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("email_templates")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else setTemplates(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchTemplates(); }, [user]);

  const openCreate = () => {
    setEditing(null);
    setEditName("");
    setEditSubject("");
    setEditBody("");
    setShowEditor(true);
  };

  const openEdit = (t: Template) => {
    setEditing(t);
    setEditName(t.name);
    setEditSubject(t.subject);
    setEditBody(t.body);
    setShowEditor(true);
  };

  const handleSave = async () => {
    if (!user || !editName.trim() || !editSubject.trim() || !editBody.trim()) return;

    if (editing) {
      const { error } = await supabase
        .from("email_templates")
        .update({ name: editName, subject: editSubject, body: editBody, updated_at: new Date().toISOString() })
        .eq("id", editing.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Template updated" });
    } else {
      const { error } = await supabase
        .from("email_templates")
        .insert({ user_id: user.id, name: editName, subject: editSubject, body: editBody });
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Template created" });
    }

    setShowEditor(false);
    fetchTemplates();
  };

  const handleDuplicate = async (t: Template) => {
    if (!user) return;
    const { error } = await supabase
      .from("email_templates")
      .insert({ user_id: user.id, name: `${t.name} (Copy)`, subject: t.subject, body: t.body });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Template duplicated" });
    fetchTemplates();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("email_templates").delete().eq("id", deleteId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Template deleted" });
    setDeleteId(null);
    fetchTemplates();
  };

  const insertVariable = (v: string) => setEditBody((prev) => prev + v);

  const previewBody = editBody
    .replace(/{first_name}/g, "John")
    .replace(/{last_name}/g, "Smith")
    .replace(/{company_name}/g, "Alpha Realty")
    .replace(/{industry}/g, "Real Estate")
    .replace(/{location}/g, "New York");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Templates</h1>
          <p className="text-muted-foreground">Create reusable email templates with variables</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      {showEditor && (
        <Card>
          <CardHeader>
            <CardTitle>{editing ? "Edit Template" : "New Template"}</CardTitle>
            <CardDescription>Use variables like {"{first_name}"} to personalize emails</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Template name" value={editName} onChange={(e) => setEditName(e.target.value)} />
            <Input placeholder="Email subject" value={editSubject} onChange={(e) => setEditSubject(e.target.value)} />
            <div className="flex flex-wrap gap-2">
              {variables.map((v) => (
                <Button key={v} variant="outline" size="sm" onClick={() => insertVariable(v)}>
                  <Variable className="h-3 w-3 mr-1" />
                  {v}
                </Button>
              ))}
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <label className="text-sm font-medium mb-2 block">Template Body</label>
                <Textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                  placeholder="Write your email template..."
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Preview</label>
                <div className="min-h-[200px] rounded-md border bg-muted/30 p-4 text-sm whitespace-pre-wrap">
                  {previewBody || "Start typing to see preview..."}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={!editName.trim() || !editSubject.trim() || !editBody.trim()}>
                {editing ? "Save Changes" : "Save Template"}
              </Button>
              <Button variant="outline" onClick={() => setShowEditor(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-muted-foreground">Loading templates…</p>
      ) : templates.length === 0 && !showEditor ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No templates yet. Create your first email template to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{template.name}</h3>
                    <div className="text-sm text-muted-foreground mt-1">
                      Subject: <span className="font-mono">{template.subject}</span>
                    </div>
                    <div className="mt-3 text-sm whitespace-pre-wrap text-muted-foreground line-clamp-3">
                      {template.body}
                    </div>
                  </div>
                  <div className="flex gap-1 ml-4">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(template)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDuplicate(template)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(template.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete template?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this email template.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
