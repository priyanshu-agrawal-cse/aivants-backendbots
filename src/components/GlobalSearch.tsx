import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

const searchRoutes = [
  { label: "Dashboard", path: "/", group: "Pages" },
  { label: "Leads", path: "/leads", group: "Pages" },
  { label: "All Leads", path: "/leads/all", group: "Pages" },
  { label: "Import Leads", path: "/import", group: "Pages" },
  { label: "Clients", path: "/clients", group: "Pages" },
  { label: "Projects", path: "/projects", group: "Pages" },
  { label: "Proposals", path: "/proposals", group: "Pages" },
  { label: "Campaigns", path: "/campaigns", group: "Pages" },
  { label: "Templates", path: "/templates", group: "Pages" },
  { label: "Scripts", path: "/scripts", group: "Pages" },
  { label: "Content Library", path: "/content", group: "Pages" },
  { label: "Sequences", path: "/sequences", group: "Pages" },
  { label: "Follow-Ups", path: "/followups", group: "Pages" },
  { label: "Pipeline", path: "/pipeline", group: "Pages" },
  { label: "Revenue", path: "/revenue", group: "Pages" },
  { label: "Analytics", path: "/analytics", group: "Pages" },
  { label: "AI Assistant", path: "/ai-assistant", group: "Pages" },
  { label: "Team Members", path: "/team", group: "Pages" },
  { label: "Settings", path: "/settings", group: "Pages" },
];

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleSelect = useCallback(
    (path: string) => {
      navigate(path);
      setOpen(false);
    },
    [navigate]
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 h-9 w-64 rounded-lg border border-input bg-background px-3 text-sm text-muted-foreground hover:bg-accent/50 transition-colors duration-150"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Search...</span>
        <kbd className="ml-auto text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded">⌘K</kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search leads, clients, projects..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Pages">
            {searchRoutes.map((route) => (
              <CommandItem
                key={route.path}
                onSelect={() => handleSelect(route.path)}
              >
                {route.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
