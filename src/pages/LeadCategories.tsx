import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Search, Plus, FolderOpen, Users, FileSpreadsheet, Megaphone, MessageSquare, Pencil, Trash2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const DEFAULT_INDUSTRIES = [
  "Real Estate", "Automotive", "Finance", "Government",
  "Healthcare", "Technology", "Retail", "Other",
];

const INDUSTRY_COLORS: Record<string, string> = {
  "Real Estate": "#f59e0b",
  "Automotive": "#3b82f6",
  "Finance": "#10b981",
  "Government": "#8b5cf6",
  "Healthcare": "#ef4444",
  "Technology": "#06b6d4",
  "Retail": "#f97316",
  "Other": "#6b7280",
};

interface Category {
  id: string;
  name: string;
  industry_type: string;
  description: string;
  color: string;
  created_at: string;
  lead_count: number;
  sheet_count: number;
}

export default function LeadCategories() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", industry_type: "Other", description: "", color: "#6366f1" });

  const fetchCategories = async () => {
    if (!user) return;
    setLoading(true);

    const { data: cats, error } = await supabase
      .from("lead_categories")
      .select("*")
      .eq("user_id", user.id)
      .order("name");

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    // Get sheet counts and lead counts per category
    const catIds = (cats || []).map((c: any) => c.id);
    let sheetData: any[] = [];
    if (catIds.length > 0) {
      const { data: sheets } = await supabase
        .from("lead_sheets")
        .select("id, category_id, lead_count")
        .in("category_id", catIds);
      sheetData = sheets || [];
    }

    const enriched: Category[] = (cats || []).map((c: any) => {
      const sheets = sheetData.filter((s) => s.category_id === c.id);
      return {
        ...c,
        sheet_count: sheets.length,
        lead_count: sheets.reduce((sum: number, s: any) => sum + (s.lead_count || 0), 0),
      };
    });

    setCategories(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, [user]);

  const filtered = categories.filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.industry_type.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", industry_type: "Other", description: "", color: "#6366f1" });
    setDialogOpen(true);
  };

  const openEdit = (cat: Category, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(cat);
    setForm({ name: cat.name, industry_type: cat.industry_type, description: cat.description || "", color: cat.color });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user || !form.name.trim()) return;
    const payload = {
      name: form.name,
      industry_type: form.industry_type,
      description: form.description,
      color: form.color || INDUSTRY_COLORS[form.industry_type] || "#6366f1",
      updated_at: new Date().toISOString(),
    };

    if (editing) {
      const { error } = await supabase.from("lead_categories").update(payload).eq("id", editing.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Category updated" });
    } else {
      const { error } = await supabase.from("lead_categories").insert([{ ...payload, user_id: user.id }]);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Category created" });
    }
    setDialogOpen(false);
    fetchCategories();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("lead_categories").delete().eq("id", deleteId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Category deleted" });
    setDeleteId(null);
    fetchCategories();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lead Categories</h1>
          <p className="text-muted-foreground">Organize leads by industry workspace</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Category
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse h-48" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No categories yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Create your first industry category to organize leads</p>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Category
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((cat) => (
            <Card
              key={cat.id}
              className="cursor-pointer hover:shadow-md transition-shadow group relative"
              onClick={() => navigate(`/leads/category/${cat.id}`)}
            >
              <div className="h-2 rounded-t-lg" style={{ backgroundColor: cat.color }} />
              <CardContent className="pt-4 pb-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">{cat.name}</h3>
                    <Badge variant="secondary" className="text-xs">{cat.industry_type}</Badge>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => openEdit(cat, e)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(cat.id); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                {cat.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{cat.description}</p>
                )}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="flex items-center gap-1.5 text-sm">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium">{cat.lead_count.toLocaleString()}</span>
                    <span className="text-muted-foreground text-xs">leads</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <FileSpreadsheet className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium">{cat.sheet_count}</span>
                    <span className="text-muted-foreground text-xs">sheets</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Category" : "Create Category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Category Name</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Real Estate" />
            </div>
            <div>
              <Label>Industry Type</Label>
              <Select value={form.industry_type} onValueChange={(v) => setForm((f) => ({ ...f, industry_type: v, color: INDUSTRY_COLORS[v] || f.color }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DEFAULT_INDUSTRIES.map((ind) => (
                    <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Brief description of this category" rows={3} />
            </div>
            <div>
              <Label>Color Label</Label>
              <div className="flex gap-2 mt-1">
                {["#f59e0b", "#3b82f6", "#10b981", "#8b5cf6", "#ef4444", "#06b6d4", "#f97316", "#ec4899", "#6366f1"].map((c) => (
                  <button
                    key={c}
                    className={`h-8 w-8 rounded-full border-2 transition-transform ${form.color === c ? "scale-110 border-foreground" : "border-transparent"}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setForm((f) => ({ ...f, color: c }))}
                  />
                ))}
              </div>
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
            <AlertDialogTitle>Delete Category?</AlertDialogTitle>
            <AlertDialogDescription>This will delete the category and all its lead sheets. Leads will be preserved but unlinked.</AlertDialogDescription>
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
