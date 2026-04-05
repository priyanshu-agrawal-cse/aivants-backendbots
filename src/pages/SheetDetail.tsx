import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft, Search, Users, Download, Trash2, Star, ExternalLink, ChevronLeft, ChevronRight,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Lead {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string;
  phone: string | null;
  company_name: string | null;
  status: string;
  rating: number | null;
  reviews: number | null;
  industry: string | null;
  address: string | null;
  website: string | null;
}

interface SheetInfo {
  id: string;
  name: string;
  description: string;
  tags: string[];
  lead_count: number;
  category_id: string;
}

export default function SheetDetail() {
  const { sheetId } = useParams<{ sheetId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [sheet, setSheet] = useState<SheetInfo | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const perPage = 20;

  const fetchData = async () => {
    if (!user || !sheetId) return;
    setLoading(true);

    const [sheetRes, leadsRes] = await Promise.all([
      supabase.from("lead_sheets").select("*").eq("id", sheetId).single(),
      supabase.from("leads").select("id, first_name, last_name, email, phone, company_name, status, rating, reviews, industry, address, website").eq("sheet_id", sheetId).eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);

    if (sheetRes.data) setSheet(sheetRes.data as SheetInfo);
    if (leadsRes.data) setLeads(leadsRes.data as Lead[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user, sheetId]);

  const filtered = leads.filter((l) =>
    !search || `${l.first_name} ${l.last_name || ""} ${l.company_name || ""} ${l.email}`.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === paginated.length) setSelected(new Set());
    else setSelected(new Set(paginated.map((l) => l.id)));
  };

  const handleExport = () => {
    const toExport = selected.size > 0 ? filtered.filter((l) => selected.has(l.id)) : filtered;
    const headers = ["First Name", "Last Name", "Email", "Phone", "Company", "Status", "Rating", "Reviews", "Industry", "Address", "Website"];
    const rows = toExport.map((l) => [l.first_name, l.last_name || "", l.email, l.phone || "", l.company_name || "", l.status, l.rating?.toString() || "", l.reviews?.toString() || "", l.industry || "", l.address || "", l.website || ""].map((v) => `"${v.replace(/"/g, '""')}"`).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${sheet?.name || "leads"}-export.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: `${toExport.length} leads exported` });
  };

  const handleBulkRemove = async () => {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    // Just unlink from sheet, don't delete leads
    const { error } = await supabase.from("leads").update({ sheet_id: null }).in("id", ids);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    // Update sheet lead_count
    if (sheet) {
      await supabase.from("lead_sheets").update({ lead_count: Math.max(0, (sheet.lead_count || 0) - ids.length), updated_at: new Date().toISOString() }).eq("id", sheet.id);
    }
    toast({ title: `${ids.length} leads removed from sheet` });
    setSelected(new Set());
    setBulkDeleteOpen(false);
    fetchData();
  };

  if (loading) return <div className="flex items-center justify-center py-20 text-muted-foreground">Loading...</div>;

  if (!sheet) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground mb-4">Sheet not found</p>
        <Button variant="outline" onClick={() => navigate("/leads")}><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/leads/category/${sheet.category_id}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{sheet.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary"><Users className="h-3 w-3 mr-1" /> {leads.length} leads</Badge>
            {(sheet.tags || []).map((t) => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}
          </div>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" /> Export
        </Button>
      </div>

      {/* Search & Bulk */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search leads..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
        </div>
        {selected.size > 0 && (
          <Button variant="destructive" size="sm" onClick={() => setBulkDeleteOpen(true)}>
            <Trash2 className="h-4 w-4 mr-1" /> Remove {selected.size} from sheet
          </Button>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"><Checkbox checked={paginated.length > 0 && selected.size === paginated.length} onCheckedChange={toggleSelectAll} /></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">No leads in this sheet</TableCell>
                </TableRow>
              ) : paginated.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell><Checkbox checked={selected.has(lead.id)} onCheckedChange={() => toggleSelect(lead.id)} /></TableCell>
                  <TableCell className="font-medium">{lead.first_name} {lead.last_name || ""}</TableCell>
                  <TableCell className="text-muted-foreground">{lead.email}</TableCell>
                  <TableCell>{lead.company_name || "—"}</TableCell>
                  <TableCell>
                    {lead.rating ? (
                      <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-warning fill-warning" /> {lead.rating}</span>
                    ) : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{lead.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages} ({filtered.length} leads)</span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}

      {/* Bulk Remove Dialog */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove leads from sheet?</AlertDialogTitle>
            <AlertDialogDescription>Leads will be removed from this sheet but not deleted from your database.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkRemove} className="bg-destructive text-destructive-foreground">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
