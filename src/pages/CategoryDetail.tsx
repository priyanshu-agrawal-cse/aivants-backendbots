import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft, Plus, Search, FileSpreadsheet, Users, Calendar, Pencil, Trash2, Upload, Download, MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface LeadSheet {
  id: string;
  name: string;
  description: string;
  tags: string[];
  lead_count: number;
  created_at: string;
  updated_at: string;
}

interface CategoryInfo {
  id: string;
  name: string;
  industry_type: string;
  description: string;
  color: string;
  created_at: string;
}

export default function CategoryDetail() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [category, setCategory] = useState<CategoryInfo | null>(null);
  const [sheets, setSheets] = useState<LeadSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LeadSheet | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "", tags: "" });

  const fetchData = async () => {
    if (!user || !categoryId) return;
    setLoading(true);

    const [catRes, sheetsRes] = await Promise.all([
      supabase.from("lead_categories").select("*").eq("id", categoryId).single(),
      supabase.from("lead_sheets").select("*").eq("category_id", categoryId).eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);

    if (catRes.data) setCategory(catRes.data as CategoryInfo);
    if (sheetsRes.data) setSheets(sheetsRes.data as LeadSheet[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user, categoryId]);

  const filtered = sheets.filter((s) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalLeads = sheets.reduce((sum, s) => sum + s.lead_count, 0);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", description: "", tags: "" });
    setDialogOpen(true);
  };

  const openEdit = (sheet: LeadSheet) => {
    setEditing(sheet);
    setForm({ name: sheet.name, description: sheet.description || "", tags: (sheet.tags || []).join(", ") });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user || !categoryId || !form.name.trim()) return;
    const tagsArr = form.tags.split(",").map((t) => t.trim()).filter(Boolean);
    const payload = {
      name: form.name,
      description: form.description,
      tags: tagsArr,
      updated_at: new Date().toISOString(),
    };

    if (editing) {
      const { error } = await supabase.from("lead_sheets").update(payload).eq("id", editing.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Sheet updated" });
    } else {
      const { error } = await supabase.from("lead_sheets").insert([{ ...payload, category_id: categoryId, user_id: user.id }]);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Sheet created" });
    }
    setDialogOpen(false);
    fetchData();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    // Unlink leads from this sheet
    await supabase.from("leads").update({ sheet_id: null }).eq("sheet_id", deleteId);
    const { error } = await supabase.from("lead_sheets").delete().eq("id", deleteId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Sheet deleted" });
    setDeleteId(null);
    fetchData();
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">Loading...</div>;
  }

  if (!category) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground mb-4">Category not found</p>
        <Button variant="outline" onClick={() => navigate("/leads")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Categories
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/leads")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="h-4 w-1 rounded-full" style={{ backgroundColor: category.color }} />
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{category.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary">{category.industry_type}</Badge>
            {category.description && <span className="text-sm text-muted-foreground">— {category.description}</span>}
          </div>
        </div>
        <Button variant="outline" onClick={() => navigate(`/import?category=${categoryId}`)}>
          <Upload className="h-4 w-4 mr-2" /> Import Leads
        </Button>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> Add Sheet
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <div className="text-2xl font-bold">{totalLeads.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Leads</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <FileSpreadsheet className="h-8 w-8 text-primary" />
            <div>
              <div className="text-2xl font-bold">{sheets.length}</div>
              <div className="text-sm text-muted-foreground">Lead Sheets</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <Calendar className="h-8 w-8 text-primary" />
            <div>
              <div className="text-2xl font-bold">{format(new Date(category.created_at), "MMM d, yyyy")}</div>
              <div className="text-sm text-muted-foreground">Created</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search sheets..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Sheets Table */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileSpreadsheet className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No lead sheets yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Create a sheet or import leads into this category</p>
            <div className="flex gap-2">
              <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Create Sheet</Button>
              <Button variant="outline" onClick={() => navigate(`/import?category=${categoryId}`)}>
                <Upload className="h-4 w-4 mr-2" /> Import CSV
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sheet Name</TableHead>
                  <TableHead>Leads</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((sheet) => (
                  <TableRow
                    key={sheet.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/leads/sheet/${sheet.id}`)}
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium">{sheet.name}</div>
                        {sheet.description && <div className="text-xs text-muted-foreground truncate max-w-[300px]">{sheet.description}</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{sheet.lead_count.toLocaleString()}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {(sheet.tags || []).slice(0, 3).map((t) => (
                          <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(sheet.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(sheet.updated_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEdit(sheet); }}>
                            <Pencil className="h-4 w-4 mr-2" /> Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(sheet.id); }}>
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Sheet" : "Create Lead Sheet"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Sheet Name</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. USA Real Estate CEOs" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Brief description" rows={2} />
            </div>
            <div>
              <Label>Tags (comma-separated)</Label>
              <Input value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} placeholder="e.g. High Value, Verified, Priority" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name.trim()}>{editing ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lead Sheet?</AlertDialogTitle>
            <AlertDialogDescription>Leads in this sheet will be preserved but unlinked from the sheet.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
