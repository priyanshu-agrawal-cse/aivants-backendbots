import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Search, Filter, ChevronLeft, ChevronRight, Plus, Pencil, Trash2, ExternalLink, Star, Download, Send, Loader2, Mail, Sparkles, Brain, TrendingUp, Briefcase, Target, MessageSquare } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Lead {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string;
  phone: string | null;
  title: string | null;
  company_name: string | null;
  status: string;
  score: number | null;
  source: string | null;
  notes: string | null;
  website: string | null;
  linkedin: string | null;
  url: string | null;
  query: string | null;
  rating: number | null;
  reviews: number | null;
  address: string | null;
  industry: string | null;
  location: string | null;
  created_at: string;
}

interface CompanyIntelligence {
  id: string;
  lead_id: string;
  website_summary: string;
  services: string;
  growth_signals: string;
  hiring_signals: string;
  marketing_activity: string;
  industry_focus: string;
  outreach_angle: string;
  ai_opening_line: string;
  researched_at: string;
}

const emptyForm = {
  first_name: "", last_name: "", email: "", phone: "", title: "",
  company_name: "", status: "new", source: "", notes: "",
  website: "", linkedin: "", url: "", query: "",
  rating: "", reviews: "", address: "", industry: "",
};

function getScoreBadge(score: number | null) {
  if (!score) return null;
  if (score >= 90) return <Badge className="bg-success text-success-foreground">High</Badge>;
  if (score >= 70) return <Badge className="bg-warning text-warning-foreground">Medium</Badge>;
  return <Badge variant="secondary">Low</Badge>;
}

function getStatusBadge(status: string) {
  const colors: Record<string, string> = {
    new: "bg-primary/10 text-primary",
    contacted: "bg-chart-3/10 text-warning",
    interested: "bg-success/10 text-success",
    meeting: "bg-chart-4/10 text-chart-4",
  };
  return (
    <Badge variant="outline" className={colors[status] || ""}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

export default function Leads() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [reviewsFilter, setReviewsFilter] = useState("all");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [detailLead, setDetailLead] = useState<Lead | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailTarget, setEmailTarget] = useState<Lead | null>(null);
  const [emailForm, setEmailForm] = useState({ subject: "", body: "", from_email: "" });
  const [sendingEmail, setSendingEmail] = useState(false);
  const [savedFromEmail, setSavedFromEmail] = useState("");
  const [researching, setResearching] = useState<string | null>(null);
  const [intelligence, setIntelligence] = useState<CompanyIntelligence | null>(null);
  const [loadingIntel, setLoadingIntel] = useState(false);
  const perPage = 10;

  const fetchLeads = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setLeads(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchLeads(); }, [user]);

  const industries = Array.from(new Set(leads.map((l) => l.industry).filter(Boolean) as string[])).sort();

  const filtered = leads.filter((lead) => {
    const matchesSearch =
      !search ||
      `${lead.first_name} ${lead.last_name || ""} ${lead.company_name || ""} ${lead.email} ${lead.address || ""} ${lead.query || ""}`
        .toLowerCase()
        .includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    const matchesRating =
      ratingFilter === "all" ||
      (ratingFilter === "4+" && (lead.rating ?? 0) >= 4) ||
      (ratingFilter === "3+" && (lead.rating ?? 0) >= 3) ||
      (ratingFilter === "2+" && (lead.rating ?? 0) >= 2) ||
      (ratingFilter === "unrated" && lead.rating == null);
    const matchesReviews =
      reviewsFilter === "all" ||
      (reviewsFilter === "100+" && (lead.reviews ?? 0) >= 100) ||
      (reviewsFilter === "50+" && (lead.reviews ?? 0) >= 50) ||
      (reviewsFilter === "10+" && (lead.reviews ?? 0) >= 10) ||
      (reviewsFilter === "none" && (!lead.reviews || lead.reviews === 0));
    const matchesIndustry = industryFilter === "all" || lead.industry === industryFilter;
    return matchesSearch && matchesStatus && matchesRating && matchesReviews && matchesIndustry;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (lead: Lead) => {
    setEditing(lead);
    setForm({
      first_name: lead.first_name,
      last_name: lead.last_name || "",
      email: lead.email,
      phone: lead.phone || "",
      title: lead.title || "",
      company_name: lead.company_name || "",
      status: lead.status,
      source: lead.source || "",
      notes: lead.notes || "",
      website: lead.website || "",
      linkedin: lead.linkedin || "",
      url: lead.url || "",
      query: lead.query || "",
      rating: lead.rating?.toString() || "",
      reviews: lead.reviews?.toString() || "",
      address: lead.address || "",
      industry: lead.industry || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user || !form.first_name.trim()) return;

    const payload: Record<string, unknown> = {
      first_name: form.first_name,
      last_name: form.last_name || null,
      email: form.email || `no-email-${Date.now()}@placeholder.local`,
      phone: form.phone || null,
      title: form.title || null,
      company_name: form.company_name || null,
      status: form.status,
      source: form.source || null,
      notes: form.notes || null,
      website: form.website || null,
      linkedin: form.linkedin || null,
      url: form.url || null,
      query: form.query || null,
      rating: form.rating ? parseFloat(form.rating) : null,
      reviews: form.reviews ? parseInt(form.reviews, 10) : 0,
      address: form.address || null,
      industry: form.industry || null,
      updated_at: new Date().toISOString(),
    };

    if (editing) {
      const { error } = await supabase.from("leads").update(payload).eq("id", editing.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Lead updated" });
    } else {
      const { error } = await supabase.from("leads").insert([{ ...payload, user_id: user.id }] as any);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Lead created" });
    }

    setDialogOpen(false);
    fetchLeads();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("leads").delete().eq("id", deleteId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Lead deleted" });
    setDeleteId(null);
    fetchLeads();
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === paginated.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paginated.map((l) => l.id)));
    }
  };

  const selectAllFiltered = () => setSelected(new Set(filtered.map((l) => l.id)));

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    const { error } = await supabase.from("leads").delete().in("id", ids);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: `${ids.length} leads deleted` });
    setSelected(new Set());
    setBulkDeleteOpen(false);
    fetchLeads();
  };

  const handleBulkStatus = async (newStatus: string) => {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    const { error } = await supabase
      .from("leads")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .in("id", ids);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: `${ids.length} leads updated to ${newStatus}` });
    setSelected(new Set());
    fetchLeads();
  };

  const handleExport = () => {
    const leadsToExport = selected.size > 0
      ? filtered.filter((l) => selected.has(l.id))
      : filtered;

    const headers = ["First Name","Last Name","Email","Phone","Company","Title","Status","Rating","Reviews","Address","Website","URL","LinkedIn","Query","Industry","Source"];
    const rows = leadsToExport.map((l) => [
      l.first_name, l.last_name || "", l.email, l.phone || "", l.company_name || "",
      l.title || "", l.status, l.rating?.toString() || "", l.reviews?.toString() || "",
      l.address || "", l.website || "", l.url || "", l.linkedin || "",
      l.query || "", l.industry || "", l.source || "",
    ].map((v) => `"${v.replace(/"/g, '""')}"`).join(","));

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: `${leadsToExport.length} leads exported` });
  };

  // Load saved from_email from user_settings
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("user_settings")
        .select("from_email")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data?.from_email) setSavedFromEmail(data.from_email);
    })();
  }, [user]);

  const openEmailDialog = (lead: Lead) => {
    setEmailTarget(lead);
    setEmailForm({
      subject: `Hi ${lead.first_name}, reaching out from our team`,
      body: `<p>Hi ${lead.first_name},</p><p>I wanted to reach out regarding your business${lead.company_name ? ` at ${lead.company_name}` : ""}.</p><p>Would you be available for a quick call this week?</p><p>Best regards</p>`,
      from_email: savedFromEmail,
    });
    setEmailDialogOpen(true);
  };

  const handleSendEmail = async () => {
    if (!emailTarget || !emailForm.subject || !emailForm.body) return;
    setSendingEmail(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-email", {
        body: {
          to: emailTarget.email,
          subject: emailForm.subject,
          body: emailForm.body,
          from_email: emailForm.from_email || undefined,
          lead_id: emailTarget.id,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error + (data.details ? `: ${data.details}` : ""));
      toast({ title: "Email sent!", description: `Email delivered to ${emailTarget.email}` });
      setEmailDialogOpen(false);
    } catch (err: any) {
      toast({ title: "Failed to send", description: err.message, variant: "destructive" });
    } finally {
      setSendingEmail(false);
    }
  };

  const updateField = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  // AI Company Research
  const handleResearch = async (lead: Lead) => {
    if (!lead.website && !lead.url) {
      toast({ title: "No website", description: "This lead has no website or URL to research.", variant: "destructive" });
      return;
    }
    setResearching(lead.id);
    try {
      const { data, error } = await supabase.functions.invoke("ai-research-company", {
        body: { lead_id: lead.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setIntelligence(data as CompanyIntelligence);
      toast({ title: "Research complete!", description: `Intelligence gathered for ${lead.company_name || lead.first_name}` });
    } catch (err: any) {
      toast({ title: "Research failed", description: err.message, variant: "destructive" });
    } finally {
      setResearching(null);
    }
  };

  // Load intelligence when detail sheet opens
  const openDetail = async (lead: Lead) => {
    setDetailLead(lead);
    setIntelligence(null);
    setLoadingIntel(true);
    const { data } = await supabase
      .from("company_intelligence")
      .select("*")
      .eq("lead_id", lead.id)
      .order("researched_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) setIntelligence(data as CompanyIntelligence);
    setLoadingIntel(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
          <p className="text-muted-foreground">Manage your lead database</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            {selected.size > 0 ? `Export (${selected.size})` : "Export All"}
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Lead
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg">All Leads ({filtered.length})</CardTitle>
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 sm:w-56">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search leads..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="interested">Interested</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                </SelectContent>
              </Select>
              <Select value={ratingFilter} onValueChange={(v) => { setRatingFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="4+">★ 4+</SelectItem>
                  <SelectItem value="3+">★ 3+</SelectItem>
                  <SelectItem value="2+">★ 2+</SelectItem>
                  <SelectItem value="unrated">Unrated</SelectItem>
                </SelectContent>
              </Select>
              <Select value={reviewsFilter} onValueChange={(v) => { setReviewsFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Reviews" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reviews</SelectItem>
                  <SelectItem value="100+">100+ reviews</SelectItem>
                  <SelectItem value="50+">50+ reviews</SelectItem>
                  <SelectItem value="10+">10+ reviews</SelectItem>
                  <SelectItem value="none">No reviews</SelectItem>
                </SelectContent>
              </Select>
              {industries.length > 0 && (
                <Select value={industryFilter} onValueChange={(v) => { setIndustryFilter(v); setPage(1); }}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Industries</SelectItem>
                    {industries.map((ind) => (
                      <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading leads…</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {leads.length === 0 ? "No leads yet. Add your first lead or import a CSV." : "No leads match your filters."}
            </div>
          ) : (
            <>
              {selected.size > 0 && (
                <div className="flex items-center gap-3 border-b px-4 py-2 bg-muted/50">
                  <span className="text-sm font-medium">{selected.size} selected</span>
                  {selected.size < filtered.length && (
                    <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={selectAllFiltered}>
                      Select all {filtered.length}
                    </Button>
                  )}
                  <div className="ml-auto flex gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">Change Status</Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleBulkStatus("new")}>New</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleBulkStatus("contacted")}>Contacted</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleBulkStatus("interested")}>Interested</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleBulkStatus("meeting")}>Meeting</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="destructive" size="sm" onClick={() => setBulkDeleteOpen(true)}>
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>Clear</Button>
                  </div>
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">
                      <Checkbox
                        checked={paginated.length > 0 && paginated.every((l) => selected.has(l.id))}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead className="hidden md:table-cell">Phone</TableHead>
                    <TableHead className="hidden lg:table-cell">Rating</TableHead>
                    <TableHead className="hidden xl:table-cell">Address</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((lead) => (
                    <TableRow
                      key={lead.id}
                      className={`cursor-pointer hover:bg-muted/50 ${selected.has(lead.id) ? "bg-muted/30" : ""}`}
                      onClick={() => openDetail(lead)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selected.has(lead.id)}
                          onCheckedChange={() => toggleSelect(lead.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div>{lead.first_name} {lead.last_name || ""}</div>
                        {lead.email && !lead.email.includes("placeholder") && (
                          <div className="text-xs text-muted-foreground">{lead.email}</div>
                        )}
                      </TableCell>
                      <TableCell>{lead.company_name || "—"}</TableCell>
                      <TableCell className="hidden md:table-cell">{lead.phone || "—"}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {lead.rating != null ? (
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-warning text-warning" />
                            <span className="text-sm">{lead.rating}</span>
                            {lead.reviews != null && lead.reviews > 0 && (
                              <span className="text-xs text-muted-foreground">({lead.reviews})</span>
                            )}
                          </div>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell max-w-[200px] truncate">
                        {lead.address || "—"}
                      </TableCell>
                      <TableCell>{getStatusBadge(lead.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          {(lead.website || lead.url) && (
                            <Button
                              variant="ghost" size="icon" className="h-8 w-8"
                              onClick={() => handleResearch(lead)}
                              disabled={researching === lead.id}
                              title="AI Research"
                            >
                              {researching === lead.id
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : <Brain className="h-3.5 w-3.5 text-accent-foreground" />}
                            </Button>
                          )}
                          {lead.email && !lead.email.includes("placeholder") && (
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEmailDialog(lead)} title="Send Email">
                              <Mail className="h-3.5 w-3.5 text-primary" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(lead)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteId(lead.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between border-t p-4">
                <div className="text-sm text-muted-foreground">Page {page} of {totalPages}</div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Lead Detail Sheet */}
      <Sheet open={!!detailLead} onOpenChange={(open) => !open && setDetailLead(null)}>
        <SheetContent className="overflow-y-auto">
          {detailLead && (
            <>
              <SheetHeader>
                <SheetTitle>{detailLead.first_name} {detailLead.last_name || ""}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                {detailLead.company_name && (
                  <DetailRow label="Company" value={detailLead.company_name} />
                )}
                {detailLead.email && !detailLead.email.includes("placeholder") && (
                  <DetailRow label="Email" value={detailLead.email} />
                )}
                {detailLead.phone && <DetailRow label="Phone" value={detailLead.phone} />}
                {detailLead.title && <DetailRow label="Title" value={detailLead.title} />}
                {detailLead.address && <DetailRow label="Address" value={detailLead.address} />}
                {detailLead.industry && <DetailRow label="Industry" value={detailLead.industry} />}
                {detailLead.query && <DetailRow label="Query / Category" value={detailLead.query} />}
                {detailLead.rating != null && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Rating</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-warning text-warning" />
                      <span className="text-sm font-medium">{detailLead.rating}</span>
                      {detailLead.reviews != null && detailLead.reviews > 0 && (
                        <span className="text-xs text-muted-foreground">({detailLead.reviews} reviews)</span>
                      )}
                    </div>
                  </div>
                )}
                {detailLead.website && (
                  <LinkRow label="Website" url={detailLead.website} />
                )}
                {detailLead.url && (
                  <LinkRow label="URL" url={detailLead.url} />
                )}
                {detailLead.linkedin && (
                  <LinkRow label="LinkedIn" url={detailLead.linkedin} />
                )}
                {detailLead.source && <DetailRow label="Source" value={detailLead.source} />}
                <DetailRow label="Status" value={detailLead.status} />
                {detailLead.notes && <DetailRow label="Notes" value={detailLead.notes} />}

                <div className="pt-4 flex flex-wrap gap-2">
                  {(detailLead.website || detailLead.url) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResearch(detailLead)}
                      disabled={researching === detailLead.id}
                    >
                      {researching === detailLead.id ? (
                        <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> Researching…</>
                      ) : (
                        <><Brain className="h-3.5 w-3.5 mr-1" /> AI Research</>
                      )}
                    </Button>
                  )}
                  {detailLead.email && !detailLead.email.includes("placeholder") && (
                    <Button size="sm" variant="default" onClick={() => { setDetailLead(null); openEmailDialog(detailLead); }}>
                      <Send className="h-3.5 w-3.5 mr-1" /> Send Email
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => { setDetailLead(null); openEdit(detailLead); }}>
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => { setDetailLead(null); setDeleteId(detailLead.id); }}>
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                  </Button>
                </div>

                {/* AI Intelligence Panel */}
                {loadingIntel && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-3">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading intelligence…
                  </div>
                )}
                {intelligence && (
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Brain className="h-4 w-4 text-primary" />
                      AI Company Intelligence
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Researched {new Date(intelligence.researched_at).toLocaleDateString()}
                    </div>

                    {intelligence.ai_opening_line && (
                      <div className="rounded-lg border bg-primary/5 p-3 space-y-1">
                        <div className="flex items-center gap-1 text-xs font-medium text-primary">
                          <MessageSquare className="h-3 w-3" /> AI Opening Line
                        </div>
                        <p className="text-sm italic">"{intelligence.ai_opening_line}"</p>
                      </div>
                    )}

                    {intelligence.website_summary && (
                      <IntelSection icon={Briefcase} label="Summary" value={intelligence.website_summary} />
                    )}
                    {intelligence.services && (
                      <IntelSection icon={Target} label="Services" value={intelligence.services} />
                    )}
                    {intelligence.growth_signals && intelligence.growth_signals !== "No clear signals" && (
                      <IntelSection icon={TrendingUp} label="Growth Signals" value={intelligence.growth_signals} />
                    )}
                    {intelligence.hiring_signals && intelligence.hiring_signals !== "No hiring signals" && (
                      <IntelSection icon={Briefcase} label="Hiring Signals" value={intelligence.hiring_signals} />
                    )}
                    {intelligence.marketing_activity && (
                      <IntelSection icon={Sparkles} label="Marketing Activity" value={intelligence.marketing_activity} />
                    )}
                    {intelligence.industry_focus && (
                      <IntelSection icon={Target} label="Industry Focus" value={intelligence.industry_focus} />
                    )}
                    {intelligence.outreach_angle && (
                      <IntelSection icon={Send} label="Outreach Angle" value={intelligence.outreach_angle} />
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Lead" : "Add Lead"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name *</Label>
                <Input value={form.first_name} onChange={(e) => updateField("first_name", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input value={form.last_name} onChange={(e) => updateField("last_name", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => updateField("phone", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company</Label>
                <Input value={form.company_name} onChange={(e) => updateField("company_name", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Title / Role</Label>
                <Input value={form.title} onChange={(e) => updateField("title", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={form.address} onChange={(e) => updateField("address", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Industry</Label>
                <Input value={form.industry} onChange={(e) => updateField("industry", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Query / Category</Label>
                <Input value={form.query} onChange={(e) => updateField("query", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rating</Label>
                <Input type="number" step="0.1" min="0" max="5" value={form.rating} onChange={(e) => updateField("rating", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Reviews</Label>
                <Input type="number" min="0" value={form.reviews} onChange={(e) => updateField("reviews", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input value={form.website} onChange={(e) => updateField("website", e.target.value)} placeholder="https://" />
            </div>
            <div className="space-y-2">
              <Label>URL (Maps / Profile)</Label>
              <Input value={form.url} onChange={(e) => updateField("url", e.target.value)} placeholder="https://" />
            </div>
            <div className="space-y-2">
              <Label>LinkedIn</Label>
              <Input value={form.linkedin} onChange={(e) => updateField("linkedin", e.target.value)} placeholder="https://linkedin.com/in/..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Source</Label>
                <Input value={form.source} onChange={(e) => updateField("source", e.target.value)} placeholder="e.g. Google Maps, LinkedIn" />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => updateField("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="interested">Interested</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => updateField("notes", e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.first_name.trim()}>
              {editing ? "Save Changes" : "Add Lead"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete lead?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this lead and all associated data.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selected.size} leads?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the selected leads and all associated data.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete}>Delete All</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Email Compose Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Send Email to {emailTarget?.first_name} {emailTarget?.last_name || ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="text-sm text-muted-foreground">
              To: <span className="font-medium text-foreground">{emailTarget?.email}</span>
            </div>
            <div className="space-y-2">
              <Label>From Email {savedFromEmail ? "" : "(configure in Settings)"}</Label>
              <Input
                type="email"
                value={emailForm.from_email}
                onChange={(e) => setEmailForm({ ...emailForm, from_email: e.target.value })}
                placeholder={savedFromEmail || "Configure in Settings → Email Configuration"}
              />
              {!savedFromEmail && (
                <p className="text-xs text-muted-foreground">Set your default sender email in Settings to avoid errors.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Subject *</Label>
              <Input
                value={emailForm.subject}
                onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Body (HTML) *</Label>
              <Textarea
                value={emailForm.body}
                onChange={(e) => setEmailForm({ ...emailForm, body: e.target.value })}
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSendEmail} disabled={sendingEmail || !emailForm.subject || !emailForm.body}>
              {sendingEmail ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              {sendingEmail ? "Sending…" : "Send Email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right max-w-[60%]">{value}</span>
    </div>
  );
}

function LinkRow({ label, url }: { label: string; url: string }) {
  const href = url.startsWith("http") ? url : `https://${url}`;
  return (
    <div className="flex justify-between py-2 border-b">
      <span className="text-sm text-muted-foreground">{label}</span>
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm text-primary flex items-center gap-1 hover:underline">
        <ExternalLink className="h-3 w-3" /> Link
      </a>
    </div>
  );
}

function IntelSection({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <p className="text-sm">{value}</p>
    </div>
  );
}
