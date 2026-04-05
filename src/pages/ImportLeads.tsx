import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, XCircle, FolderOpen, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface ParsedLead {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company_name: string;
  title: string;
  source: string;
  website: string;
  linkedin: string;
  url: string;
  query: string;
  rating: number | null;
  reviews: number | null;
  address: string;
  industry: string;
  location: string;
}

function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim().replace(/^["']|["']$/g, ""));
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim().replace(/^["']|["']$/g, ""));
  return result;
}

function parseCSV(text: string): ParsedLead[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = splitCSVLine(lines[0]).map((h) => h.toLowerCase().replace(/['"]/g, "").trim());

  const colMap: Record<string, number> = {};
  const aliases: Record<string, string[]> = {
    full_name: ["full name", "full_name", "name", "contact name", "contact", "business name", "company name"],
    first_name: ["first_name", "firstname", "first name", "fname"],
    last_name: ["last_name", "lastname", "last name", "lname"],
    email: ["email", "email_address", "e-mail", "mail"],
    phone: ["phone", "phone_number", "telephone", "tel", "mobile", "phone number"],
    company_name: ["company_name", "company", "organization", "org"],
    title: ["title", "job_title", "position", "role", "job title", "designation"],
    source: ["source", "lead_source", "origin", "lead source"],
    website: ["website", "web", "site", "homepage", "web url"],
    url: ["url", "link", "page url", "profile url", "google maps url", "maps url"],
    linkedin: ["linkedin", "linkedin_url", "linkedin url", "linkedin profile"],
    query: ["query", "search query", "keyword", "search term", "search", "category"],
    rating: ["rating", "stars", "score", "google rating"],
    reviews: ["reviews", "review count", "review_count", "num reviews", "total reviews", "number of reviews"],
    address: ["address", "location", "full address", "street address", "street", "city", "place"],
    industry: ["industry", "sector", "vertical", "niche", "type", "business type"],
    location: ["location", "city", "state", "region", "area", "geo"],
  };

  // First pass: exact match
  headers.forEach((h, i) => {
    for (const [field, names] of Object.entries(aliases)) {
      if (names.includes(h) && !(field in colMap)) {
        colMap[field] = i;
        break;
      }
    }
  });

  // Resolve conflicts: if "address" and "location" both map, keep both
  // If only one exists, that's fine

  const getVal = (cols: string[], field: string) => {
    const idx = colMap[field];
    if (idx === undefined) return "";
    return (cols[idx] || "").trim();
  };

  const results: ParsedLead[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCSVLine(lines[i]);
    if (cols.every((c) => !c)) continue; // skip empty rows

    // Handle "Name" / "Full Name" → split into first/last
    let firstName = getVal(cols, "first_name");
    let lastName = getVal(cols, "last_name");
    if (!firstName && colMap.full_name !== undefined) {
      const fullName = getVal(cols, "full_name");
      const parts = fullName.split(/\s+/);
      firstName = parts[0] || "";
      lastName = parts.slice(1).join(" ");
    }

    // For business leads (Google Maps style), name might be the business name
    const companyName = getVal(cols, "company_name") || (colMap.full_name !== undefined && !colMap.first_name ? getVal(cols, "full_name") : "");

    const email = getVal(cols, "email");
    const phone = getVal(cols, "phone");

    // Allow import if we have at least a name (even without email for business leads)
    if (!firstName && !companyName) continue;

    // If email exists, validate it
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) continue;

    const ratingStr = getVal(cols, "rating");
    const reviewsStr = getVal(cols, "reviews");

    results.push({
      first_name: firstName.slice(0, 100),
      last_name: lastName.slice(0, 100),
      email: email ? email.slice(0, 255).toLowerCase() : "",
      phone: phone.slice(0, 50),
      company_name: companyName.slice(0, 200),
      title: getVal(cols, "title").slice(0, 200),
      source: getVal(cols, "source").slice(0, 100) || "csv_import",
      website: getVal(cols, "website").slice(0, 500),
      url: getVal(cols, "url").slice(0, 500),
      linkedin: getVal(cols, "linkedin").slice(0, 500),
      query: getVal(cols, "query").slice(0, 200),
      rating: ratingStr ? parseFloat(ratingStr) || null : null,
      reviews: reviewsStr ? parseInt(reviewsStr, 10) || null : null,
      address: getVal(cols, "address").slice(0, 500),
      industry: getVal(cols, "industry").slice(0, 200),
      location: getVal(cols, "location").slice(0, 200),
    });
  }

  return results;
}

export default function ImportLeads() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const preselectedCategory = searchParams.get("category") || "";

  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<ParsedLead[]>([]);
  const [detectedCols, setDetectedCols] = useState<string[]>([]);
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: number } | null>(null);

  // Category/Sheet selection
  const [categories, setCategories] = useState<{ id: string; name: string; industry_type: string }[]>([]);
  const [sheets, setSheets] = useState<{ id: string; name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(preselectedCategory);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [createNewCategory, setCreateNewCategory] = useState(false);
  const [createNewSheet, setCreateNewSheet] = useState(!preselectedCategory);
  const [newCatForm, setNewCatForm] = useState({ name: "", industry_type: "Other", description: "" });
  const [newSheetName, setNewSheetName] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase.from("lead_categories").select("id, name, industry_type").eq("user_id", user.id).order("name").then(({ data }) => {
      setCategories(data || []);
      if (!preselectedCategory && (data || []).length === 0) setCreateNewCategory(true);
    });
  }, [user]);

  useEffect(() => {
    if (!selectedCategory) { setSheets([]); return; }
    supabase.from("lead_sheets").select("id, name").eq("category_id", selectedCategory).order("name").then(({ data }) => {
      setSheets(data || []);
      setCreateNewSheet((data || []).length === 0);
    });
  }, [selectedCategory]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files[0];
    if (f && f.name.endsWith(".csv")) {
      handleFileSelected(f);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFileSelected(f);
  };

  const handleFileSelected = async (f: File) => {
    setFile(f);
    setResult(null);
    setPreview([]);
    setDetectedCols([]);

    try {
      const text = await f.text();
      const parsed = parseCSV(text);
      setPreview(parsed.slice(0, 5));

      // Detect which columns have data
      const cols: string[] = [];
      if (parsed.some((p) => p.first_name)) cols.push("Name");
      if (parsed.some((p) => p.email)) cols.push("Email");
      if (parsed.some((p) => p.phone)) cols.push("Phone");
      if (parsed.some((p) => p.company_name)) cols.push("Company");
      if (parsed.some((p) => p.website)) cols.push("Website");
      if (parsed.some((p) => p.url)) cols.push("URL");
      if (parsed.some((p) => p.query)) cols.push("Query");
      if (parsed.some((p) => p.rating !== null)) cols.push("Rating");
      if (parsed.some((p) => p.reviews !== null)) cols.push("Reviews");
      if (parsed.some((p) => p.address)) cols.push("Address");
      if (parsed.some((p) => p.industry)) cols.push("Industry");
      if (parsed.some((p) => p.linkedin)) cols.push("LinkedIn");
      setDetectedCols(cols);
    } catch {
      // Will handle errors on import
    }
  };

  const handleImport = async () => {
    if (!file || !user) return;
    setImporting(true);
    setProgress(0);
    setResult(null);

    try {
      const text = await file.text();
      const parsed = parseCSV(text);

      if (parsed.length === 0) {
        toast({ title: "No valid leads found", description: "Check your CSV has at least a Name column.", variant: "destructive" });
        setImporting(false);
        return;
      }

      // Resolve category
      let categoryId = selectedCategory;
      if (createNewCategory && newCatForm.name.trim()) {
        const { data: newCat, error: catErr } = await supabase.from("lead_categories").insert([{
          user_id: user.id, name: newCatForm.name, industry_type: newCatForm.industry_type, description: newCatForm.description,
        }]).select("id").single();
        if (catErr || !newCat) { toast({ title: "Error creating category", description: catErr?.message, variant: "destructive" }); setImporting(false); return; }
        categoryId = newCat.id;
      }

      // Resolve sheet
      let sheetId: string | null = selectedSheet || null;
      const sheetName = createNewSheet && newSheetName.trim() ? newSheetName : file.name.replace(/\.csv$/i, "");
      if (categoryId && (createNewSheet || !sheetId)) {
        const { data: newSheet, error: sheetErr } = await supabase.from("lead_sheets").insert([{
          user_id: user.id, category_id: categoryId, name: sheetName,
        }]).select("id").single();
        if (sheetErr || !newSheet) { toast({ title: "Error creating sheet", description: sheetErr?.message, variant: "destructive" }); setImporting(false); return; }
        sheetId = newSheet.id;
      }

      // Get existing emails to detect duplicates
      const { data: existingLeads } = await supabase
        .from("leads")
        .select("email")
        .eq("user_id", user.id);

      const existingEmails = new Set(
        (existingLeads || []).filter((l) => l.email).map((l) => l.email.toLowerCase())
      );

      let imported = 0;
      let skipped = 0;
      let errors = 0;

      const newLeads = parsed.filter((lead) => {
        if (lead.email && existingEmails.has(lead.email)) {
          skipped++;
          return false;
        }
        if (lead.email) existingEmails.add(lead.email);
        return true;
      });

      setProgress(20);

      const batchSize = 50;
      for (let i = 0; i < newLeads.length; i += batchSize) {
        const batch = newLeads.slice(i, i + batchSize).map((lead) => ({
          user_id: user.id,
          first_name: lead.first_name || lead.company_name || "Unknown",
          last_name: lead.last_name || null,
          email: lead.email || `no-email-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@placeholder.local`,
          phone: lead.phone || null,
          company_name: lead.company_name || null,
          title: lead.title || null,
          source: lead.source || "csv_import",
          website: lead.website || null,
          linkedin: lead.linkedin || null,
          url: lead.url || null,
          query: lead.query || null,
          rating: lead.rating,
          reviews: lead.reviews ?? 0,
          address: lead.address || null,
          industry: lead.industry || null,
          sheet_id: sheetId || null,
          status: "new" as const,
        }));

        const { error, data } = await supabase.from("leads").insert(batch).select("id");

        if (error) {
          errors += batch.length;
        } else {
          imported += (data || []).length;
          const pipelineEntries = (data || []).map((lead) => ({
            user_id: user.id,
            lead_id: lead.id,
            stage: "New Lead",
          }));
          await supabase.from("pipeline_stages").insert(pipelineEntries);
        }

        setProgress(20 + Math.round(((i + batchSize) / newLeads.length) * 80));
      }

      // Update sheet lead_count
      if (sheetId && imported > 0) {
        const { data: currentSheet } = await supabase.from("lead_sheets").select("lead_count").eq("id", sheetId).single();
        await supabase.from("lead_sheets").update({ lead_count: (currentSheet?.lead_count || 0) + imported, updated_at: new Date().toISOString() }).eq("id", sheetId);
      }

      setProgress(100);
      setResult({ imported, skipped, errors });
      toast({ title: "Import complete", description: `${imported} leads imported successfully.` });
    } catch {
      toast({ title: "Import failed", description: "Could not parse the CSV file.", variant: "destructive" });
    }

    setImporting(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Import Leads</h1>
        <p className="text-muted-foreground">Upload a CSV file to import leads</p>
      </div>

      {/* Step 1: Category & Sheet Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FolderOpen className="h-5 w-5" /> Step 1 — Select Category & Sheet</CardTitle>
          <CardDescription>Organize your imported leads into an industry category</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Category</Label>
              {!createNewCategory ? (
                <div className="space-y-2">
                  <Select value={selectedCategory} onValueChange={(v) => { setSelectedCategory(v); setSelectedSheet(""); }}>
                    <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name} — {c.industry_type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="link" size="sm" className="px-0 h-auto text-xs" onClick={() => setCreateNewCategory(true)}>
                    <Plus className="h-3 w-3 mr-1" /> Create new category
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 rounded-lg border p-3">
                  <Input placeholder="Category name" value={newCatForm.name} onChange={(e) => setNewCatForm((f) => ({ ...f, name: e.target.value }))} />
                  <Select value={newCatForm.industry_type} onValueChange={(v) => setNewCatForm((f) => ({ ...f, industry_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Real Estate", "Automotive", "Finance", "Government", "Healthcare", "Technology", "Retail", "Other"].map((ind) => (
                        <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input placeholder="Description (optional)" value={newCatForm.description} onChange={(e) => setNewCatForm((f) => ({ ...f, description: e.target.value }))} />
                  {categories.length > 0 && (
                    <Button variant="link" size="sm" className="px-0 h-auto text-xs" onClick={() => setCreateNewCategory(false)}>
                      Use existing category
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Lead Sheet</Label>
              {!createNewSheet ? (
                <div className="space-y-2">
                  <Select value={selectedSheet} onValueChange={setSelectedSheet}>
                    <SelectTrigger><SelectValue placeholder="Select a sheet" /></SelectTrigger>
                    <SelectContent>
                      {sheets.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="link" size="sm" className="px-0 h-auto text-xs" onClick={() => setCreateNewSheet(true)}>
                    <Plus className="h-3 w-3 mr-1" /> Create new sheet
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Input placeholder="Sheet name (or auto-generated from filename)" value={newSheetName} onChange={(e) => setNewSheetName(e.target.value)} />
                  {sheets.length > 0 && (
                    <Button variant="link" size="sm" className="px-0 h-auto text-xs" onClick={() => setCreateNewSheet(false)}>
                      Use existing sheet
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Upload File */}
      <Card>
        <CardHeader>
          <CardTitle>Step 2 — Upload File</CardTitle>
          <CardDescription>Auto-detects columns from your CSV headers</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors ${
              dragActive ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <Upload className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Drag & drop your CSV here</p>
            <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
            <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" id="file-upload" />
            <Button variant="outline" onClick={() => document.getElementById("file-upload")?.click()}>
              Browse Files
            </Button>
          </div>

          {file && (
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-3 rounded-lg border p-4">
                <FileSpreadsheet className="h-8 w-8 text-primary" />
                <div className="flex-1">
                  <div className="font-medium">{file.name}</div>
                  <div className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</div>
                </div>
                <Button onClick={handleImport} disabled={importing}>
                  {importing ? "Importing..." : "Start Import"}
                </Button>
              </div>

              {detectedCols.length > 0 && (
                <div className="rounded-lg border p-4 space-y-2">
                  <div className="text-sm font-medium">Detected Columns</div>
                  <div className="flex flex-wrap gap-2">
                    {detectedCols.map((col) => (
                      <Badge key={col} variant="secondary">{col}</Badge>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {preview.length > 0 && `Preview: ${preview.length} of ${preview.length}+ rows parsed`}
                  </div>
                </div>
              )}

              {preview.length > 0 && (
                <div className="rounded-lg border overflow-auto max-h-[200px]">
                  <table className="w-full text-xs">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="p-2 text-left font-medium">Name</th>
                        {detectedCols.includes("Email") && <th className="p-2 text-left font-medium">Email</th>}
                        {detectedCols.includes("Phone") && <th className="p-2 text-left font-medium">Phone</th>}
                        {detectedCols.includes("Company") && <th className="p-2 text-left font-medium">Company</th>}
                        {detectedCols.includes("Rating") && <th className="p-2 text-left font-medium">Rating</th>}
                        {detectedCols.includes("Address") && <th className="p-2 text-left font-medium">Address</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((lead, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-2">{lead.first_name} {lead.last_name}</td>
                          {detectedCols.includes("Email") && <td className="p-2 text-muted-foreground">{lead.email || "—"}</td>}
                          {detectedCols.includes("Phone") && <td className="p-2">{lead.phone || "—"}</td>}
                          {detectedCols.includes("Company") && <td className="p-2">{lead.company_name || "—"}</td>}
                          {detectedCols.includes("Rating") && <td className="p-2">{lead.rating ?? "—"}</td>}
                          {detectedCols.includes("Address") && <td className="p-2 max-w-[200px] truncate">{lead.address || "—"}</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {importing && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing leads...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {result && (
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-3 rounded-lg border p-4">
                <CheckCircle className="h-5 w-5 text-success" />
                <div>
                  <div className="text-2xl font-bold">{result.imported}</div>
                  <div className="text-sm text-muted-foreground">Imported</div>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border p-4">
                <AlertCircle className="h-5 w-5 text-warning" />
                <div>
                  <div className="text-2xl font-bold">{result.skipped}</div>
                  <div className="text-sm text-muted-foreground">Skipped (duplicates)</div>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border p-4">
                <XCircle className="h-5 w-5 text-destructive" />
                <div>
                  <div className="text-2xl font-bold">{result.errors}</div>
                  <div className="text-sm text-muted-foreground">Errors</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Supported CSV Columns</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            The importer auto-detects columns from your CSV headers. It supports many common formats including:
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { col: "Name / Full Name", desc: "Auto-splits into first & last name" },
              { col: "Email", desc: "Email address (validated)" },
              { col: "Phone", desc: "Phone or mobile number" },
              { col: "Company", desc: "Company or organization name" },
              { col: "URL", desc: "Profile or Google Maps URL" },
              { col: "Query", desc: "Search query or category" },
              { col: "Rating", desc: "Star rating (numeric)" },
              { col: "Reviews", desc: "Number of reviews" },
              { col: "Address", desc: "Full street address" },
              { col: "Website", desc: "Company website URL" },
              { col: "LinkedIn", desc: "LinkedIn profile URL" },
              { col: "Title / Role", desc: "Job title or position" },
              { col: "Industry", desc: "Business sector or vertical" },
              { col: "Source", desc: "Lead source or origin" },
            ].map((item) => (
              <div key={item.col} className="rounded border p-2">
                <div className="text-sm font-medium">{item.col}</div>
                <div className="text-xs text-muted-foreground">{item.desc}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Minimum required: <strong>Name</strong> (or first_name). Email is optional for business leads.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
