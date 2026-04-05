import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  Plus,
  Search,
  Pencil,
  Trash2,
  Upload,
  Download,
  Send,
  Eye,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

interface Client {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
}

interface Proposal {
  id: string;
  name: string;
  client_id: string | null;
  client_name: string | null;
  industry: string | null;
  description: string | null;
  status: string;
  document_url: string | null;
  document_name: string | null;
  amount: number;
  created_at: string;
  updated_at: string;
}

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-primary/15 text-primary",
  viewed: "bg-warning/15 text-warning",
  accepted: "bg-success/15 text-success",
  rejected: "bg-destructive/15 text-destructive",
};

const statusOptions = ["draft", "sent", "viewed", "accepted", "rejected"];

const industries = [
  "Real Estate",
  "Automotive",
  "Finance",
  "Healthcare",
  "Technology",
  "Retail",
  "Government",
  "Other",
];

export default function Proposals() {
  const { user } = useAuth();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);
  const [sharingProposal, setSharingProposal] = useState<Proposal | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);

  const [form, setForm] = useState({
    name: "",
    client_id: "",
    client_name: "",
    industry: "",
    description: "",
    status: "draft",
    amount: "",
  });

  const [shareForm, setShareForm] = useState({
    to_email: "",
    subject: "",
    body: "",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    const [proposalsRes, clientsRes] = await Promise.all([
      supabase
        .from("proposals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase.from("clients").select("id, name, email, company").eq("user_id", user.id),
    ]);
    setProposals(proposalsRes.data || []);
    setClients(clientsRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const resetForm = () => {
    setForm({ name: "", client_id: "", client_name: "", industry: "", description: "", status: "draft", amount: "" });
    setSelectedFile(null);
    setEditingProposal(null);
  };

  const openEdit = (proposal: Proposal) => {
    setEditingProposal(proposal);
    setForm({
      name: proposal.name,
      client_id: proposal.client_id || "",
      client_name: proposal.client_name || "",
      industry: proposal.industry || "",
      description: proposal.description || "",
      status: proposal.status,
      amount: proposal.amount?.toString() || "",
    });
    setDialogOpen(true);
  };

  const openShare = (proposal: Proposal) => {
    setSharingProposal(proposal);
    // Try to find client email
    const client = clients.find((c) => c.id === proposal.client_id);
    const recipientEmail = client?.email || "";
    const recipientName = proposal.client_name || client?.name || "there";

    setShareForm({
      to_email: recipientEmail,
      subject: `Proposal: ${proposal.name}`,
      body: `Hi ${recipientName},\n\nPlease find attached the proposal we discussed: "${proposal.name}".\n\nLooking forward to hearing from you.\n\nBest regards`,
    });
    setShareDialogOpen(true);
  };

  const uploadDocument = async (proposalId: string, file: File): Promise<{ url: string; name: string } | null> => {
    const ext = file.name.split(".").pop();
    const path = `${user!.id}/${proposalId}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from("proposals").upload(path, file);
    if (error) {
      toast.error("Failed to upload document");
      return null;
    }

    const { data: urlData } = supabase.storage.from("proposals").getPublicUrl(path);
    return { url: urlData.publicUrl, name: file.name };
  };

  const handleSave = async () => {
    if (!user || !form.name.trim()) {
      toast.error("Proposal name is required");
      return;
    }

    setUploading(true);

    const payload = {
      user_id: user.id,
      name: form.name.trim(),
      client_id: form.client_id || null,
      client_name: form.client_name || null,
      industry: form.industry || null,
      description: form.description || null,
      status: form.status,
      amount: form.amount ? parseFloat(form.amount) : 0,
    };

    let proposalId = editingProposal?.id;

    if (editingProposal) {
      const { error } = await supabase.from("proposals").update(payload).eq("id", editingProposal.id);
      if (error) {
        toast.error("Failed to update proposal");
        setUploading(false);
        return;
      }
    } else {
      const { data, error } = await supabase.from("proposals").insert(payload).select("id").single();
      if (error) {
        toast.error("Failed to create proposal");
        setUploading(false);
        return;
      }
      proposalId = data.id;
    }

    // Upload file if selected
    if (selectedFile && proposalId) {
      const result = await uploadDocument(proposalId, selectedFile);
      if (result) {
        await supabase
          .from("proposals")
          .update({ document_url: result.url, document_name: result.name })
          .eq("id", proposalId);
      }
    }

    toast.success(editingProposal ? "Proposal updated" : "Proposal created");
    setDialogOpen(false);
    resetForm();
    setUploading(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("proposals").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete proposal");
    } else {
      toast.success("Proposal deleted");
      fetchData();
    }
  };

  const handleShareSend = async () => {
    if (!sharingProposal || !shareForm.to_email) {
      toast.error("Recipient email is required");
      return;
    }

    setSending(true);

    try {
      const { error } = await supabase.functions.invoke("send-email", {
        body: {
          to: shareForm.to_email,
          subject: shareForm.subject,
          body: shareForm.body,
          attachment_url: sharingProposal.document_url,
          attachment_name: sharingProposal.document_name,
        },
      });

      if (error) throw error;

      // Update proposal status to 'sent'
      await supabase
        .from("proposals")
        .update({ status: "sent", updated_at: new Date().toISOString() })
        .eq("id", sharingProposal.id);

      toast.success(`Proposal sent to ${shareForm.to_email}`);
      setShareDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error("Failed to send email. Check your email settings.");
    } finally {
      setSending(false);
    }
  };

  const onClientSelect = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    setForm({
      ...form,
      client_id: clientId,
      client_name: client?.name || "",
    });
  };

  const filtered = proposals.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.client_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.industry?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: proposals.length,
    draft: proposals.filter((p) => p.status === "draft").length,
    sent: proposals.filter((p) => p.status === "sent").length,
    accepted: proposals.filter((p) => p.status === "accepted").length,
    totalValue: proposals.reduce((sum, p) => sum + (p.amount || 0), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Proposal Management</h1>
          <p className="text-muted-foreground">Create, store, and share proposals with clients</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />New Proposal</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProposal ? "Edit Proposal" : "Create Proposal"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Proposal Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="AI Lead Generation Proposal" />
              </div>
              <div className="grid gap-2">
                <Label>Client</Label>
                <Select value={form.client_id} onValueChange={onClientSelect}>
                  <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name} {c.company && `(${c.company})`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Client Name</Label>
                  <Input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} placeholder="Alpha Realty" />
                </div>
                <div className="grid gap-2">
                  <Label>Industry</Label>
                  <Select value={form.industry} onValueChange={(v) => setForm({ ...form, industry: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {industries.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Amount (₹)</Label>
                  <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="270000" />
                </div>
                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Proposal details..." />
              </div>
              <div className="grid gap-2">
                <Label>Document (PDF, DOCX, etc.)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                </div>
                {editingProposal?.document_name && !selectedFile && (
                  <p className="text-sm text-muted-foreground">Current: {editingProposal.document_name}</p>
                )}
              </div>
              <Button onClick={handleSave} disabled={uploading}>
                {uploading ? "Uploading..." : editingProposal ? "Update Proposal" : "Create Proposal"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-5">
        {[
          { label: "Total", value: stats.total },
          { label: "Draft", value: stats.draft },
          { label: "Sent", value: stats.sent },
          { label: "Accepted", value: stats.accepted },
          { label: "Total Value", value: `₹${stats.totalValue.toLocaleString()}` },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search proposals..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Proposals
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground">No proposals yet. Create your first proposal!</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proposal</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[160px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((proposal) => (
                  <TableRow key={proposal.id}>
                    <TableCell className="max-w-[200px]">
                      <div>
                        <p className="font-medium truncate">{proposal.name}</p>
                        {proposal.document_name && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 truncate" title={proposal.document_name}>
                            <FileText className="h-3 w-3 shrink-0" /><span className="truncate">{proposal.document_name}</span>
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{proposal.client_name || "—"}</TableCell>
                    <TableCell>{proposal.industry || "—"}</TableCell>
                    <TableCell>₹{proposal.amount?.toLocaleString() || 0}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[proposal.status]}>{proposal.status}</Badge>
                    </TableCell>
                    <TableCell>{format(new Date(proposal.created_at), "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (proposal.document_url) {
                              window.open(proposal.document_url, "_blank");
                            } else {
                              openEdit(proposal);
                            }
                          }}
                          title={proposal.document_url ? "View document" : "View proposal details"}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openShare(proposal)}>
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(proposal)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(proposal.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Share Proposal
            </DialogTitle>
          </DialogHeader>
          {sharingProposal && (
            <div className="grid gap-4 py-4">
              <div className="p-3 rounded-lg border bg-muted/30">
                <p className="font-medium">{sharingProposal.name}</p>
                {sharingProposal.document_name && (
                  <p className="text-sm text-muted-foreground">📎 {sharingProposal.document_name}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label>Recipient Email *</Label>
                <Input
                  type="email"
                  value={shareForm.to_email}
                  onChange={(e) => setShareForm({ ...shareForm, to_email: e.target.value })}
                  placeholder="client@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label>Subject</Label>
                <Input
                  value={shareForm.subject}
                  onChange={(e) => setShareForm({ ...shareForm, subject: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Message</Label>
                <Textarea
                  value={shareForm.body}
                  onChange={(e) => setShareForm({ ...shareForm, body: e.target.value })}
                  rows={6}
                />
              </div>
              <Button onClick={handleShareSend} disabled={sending}>
                {sending ? "Sending..." : "Send Proposal"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
