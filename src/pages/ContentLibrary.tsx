import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus, Trash2, FileText, Presentation, Video, BookOpen, Link2,
  FileSpreadsheet, Upload, Loader2, ExternalLink,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Asset {
  id: string;
  title: string;
  description: string;
  file_url: string;
  type: string;
  category: string;
  created_at: string;
}

const ASSET_TYPES = [
  { value: "pdf", label: "PDF", icon: FileText },
  { value: "ppt", label: "Presentation", icon: Presentation },
  { value: "video", label: "Video", icon: Video },
  { value: "case_study", label: "Case Study", icon: BookOpen },
  { value: "demo_link", label: "Demo Link", icon: Link2 },
  { value: "product_sheet", label: "Product Sheet", icon: FileSpreadsheet },
];

const TYPE_ICONS: Record<string, React.ElementType> = {
  pdf: FileText,
  ppt: Presentation,
  video: Video,
  case_study: BookOpen,
  demo_link: Link2,
  product_sheet: FileSpreadsheet,
};

export default function ContentLibrary() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("pdf");
  const [category, setCategory] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const fetchAssets = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("content_assets")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else setAssets((data as Asset[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchAssets(); }, [user]);

  const openCreate = () => {
    setTitle("");
    setDescription("");
    setType("pdf");
    setCategory("");
    setFileUrl("");
    setFile(null);
    setShowForm(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (selected.size > 20 * 1024 * 1024) {
        toast({ title: "File too large", description: "Maximum file size is 20MB.", variant: "destructive" });
        return;
      }
      setFile(selected);
    }
  };

  const handleSave = async () => {
    if (!user || !title.trim()) return;

    let url = fileUrl;

    // Upload file if selected
    if (file) {
      setUploading(true);
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("content-assets")
        .upload(path, file);
      if (uploadError) {
        toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
        setUploading(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("content-assets").getPublicUrl(path);
      url = urlData.publicUrl;
      setUploading(false);
    }

    if (!url.trim() && type !== "demo_link") {
      toast({ title: "Missing file", description: "Please upload a file or provide a URL.", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("content_assets").insert({
      user_id: user.id,
      title: title.trim(),
      description: description.trim(),
      file_url: url.trim(),
      type,
      category: category.trim(),
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Asset added!" });
    setShowForm(false);
    fetchAssets();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("content_assets").delete().eq("id", deleteId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Asset deleted" });
    setDeleteId(null);
    fetchAssets();
  };

  const getTypeLabel = (t: string) => ASSET_TYPES.find((a) => a.value === t)?.label || t;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Library</h1>
          <p className="text-muted-foreground">Manage sales assets to share during outreach campaigns</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Asset
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Content Asset</CardTitle>
            <CardDescription>Upload or link a sales asset for use in campaigns and follow-ups</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Company Presentation 2025" />
              </div>
              <div className="space-y-2">
                <Label>Asset Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ASSET_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        <span className="flex items-center gap-2">
                          <t.icon className="h-4 w-4" />
                          {t.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of this asset..." rows={2} />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Sales, Marketing, Product" />
            </div>

            {type === "demo_link" || type === "video" ? (
              <div className="space-y-2">
                <Label>URL *</Label>
                <Input value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="https://..." />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Upload File</Label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer rounded-md border border-input bg-background px-4 py-2 text-sm hover:bg-muted transition-colors">
                      <Upload className="h-4 w-4" />
                      {file ? file.name : "Choose file"}
                      <input type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx" />
                    </label>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Or paste URL</Label>
                  <Input value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="https://..." />
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={!title.trim() || uploading}>
                {uploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {uploading ? "Uploading…" : "Save Asset"}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Asset Grid */}
      {loading ? (
        <p className="text-muted-foreground">Loading assets…</p>
      ) : assets.length === 0 && !showForm ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">No content assets yet. Add PDFs, presentations, videos, and more to use in your campaigns.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset) => {
            const Icon = TYPE_ICONS[asset.type] || FileText;
            return (
              <Card key={asset.id} className="group relative">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{asset.title}</h3>
                      <Badge variant="outline" className="text-xs mt-1">{getTypeLabel(asset.type)}</Badge>
                      {asset.description && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{asset.description}</p>
                      )}
                      {asset.category && (
                        <Badge variant="secondary" className="text-xs mt-2">{asset.category}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 mt-3 justify-end">
                    {asset.file_url && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={asset.file_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Open
                        </a>
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteId(asset.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete asset?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this content asset.</AlertDialogDescription>
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
