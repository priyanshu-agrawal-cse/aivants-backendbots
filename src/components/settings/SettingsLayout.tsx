import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Gear, Sparkle, Envelope, ChatCircle, Bell, Lightning, Link,
  Users, ShieldCheck, Code, GlobeHemisphereWest, WebhooksLogo, List, X
} from "@phosphor-icons/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";

const settingsSections = [
  { id: "general", label: "General", icon: GlobeHemisphereWest },
  { id: "ai", label: "AI & Model APIs", icon: Sparkle },
  { id: "email", label: "Email & Messaging", icon: Envelope },
  { id: "telegram", label: "Telegram Bot", icon: ChatCircle },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "automations", label: "Automation Rules", icon: Lightning },
  { id: "webhooks", label: "Webhooks", icon: WebhooksLogo },
  { id: "integrations", label: "Integrations", icon: Link },
  { id: "users", label: "Users & Permissions", icon: Users },
  { id: "security", label: "Security", icon: ShieldCheck },
  { id: "developer", label: "Developer Mode", icon: Code },
] as const;

export type SettingsSection = typeof settingsSections[number]["id"];

interface SettingsLayoutProps {
  activeSection: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
  children: React.ReactNode;
}

export function SettingsLayout({ activeSection, onSectionChange, children }: SettingsLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeLabel = settingsSections.find(s => s.id === activeSection)?.label ?? "Settings";
  const ActiveIcon = settingsSections.find(s => s.id === activeSection)?.icon ?? Gear;

  const handleSelect = (id: SettingsSection) => {
    onSectionChange(id);
    setMobileOpen(false);
  };

  const NavItems = () => (
    <nav className="space-y-1">
      {settingsSections.map((section) => {
        const Icon = section.icon;
        const active = activeSection === section.id;
        return (
          <button
            key={section.id}
            onClick={() => handleSelect(section.id)}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-2.5 text-sm rounded-xl transition-all duration-200 text-left active:scale-[0.98]",
              active
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Icon
              weight="duotone"
              className={cn("h-4 w-4 shrink-0 transition-colors", active ? "text-primary" : "opacity-70")}
            />
            {section.label}
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="flex gap-6 min-h-[calc(100vh-8rem)] relative">

      {/* ── Desktop sidebar (hidden on mobile) ── */}
      <div className="hidden md:block w-56 shrink-0">
        <div className="sticky top-4">
          <div className="flex items-center gap-2 mb-4 px-3">
            <Gear weight="duotone" className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-lg tracking-tight">Settings</h2>
          </div>
          <ScrollArea className="h-[calc(100vh-12rem)]">
            <NavItems />
          </ScrollArea>
        </div>
      </div>

      {/* ── Mobile: top bar trigger ── */}
      <div className="flex-1 min-w-0">
        {/* Mobile header — shows active section + hamburger */}
        <div className="md:hidden flex items-center gap-3 mb-4 p-3 rounded-xl bg-muted/50 border border-border/50">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex items-center gap-2 text-sm font-medium text-foreground flex-1 min-w-0"
          >
            <List weight="bold" className="h-5 w-5 text-primary shrink-0" />
            <ActiveIcon weight="duotone" className="h-4 w-4 text-primary shrink-0" />
            <span className="truncate">{activeLabel}</span>
          </button>
          <div className="text-xs text-muted-foreground bg-muted rounded-lg px-2 py-1 shrink-0">
            Settings
          </div>
        </div>

        {/* Page content */}
        <div className="max-w-3xl pb-12">
          {children}
        </div>
      </div>

      {/* ── Mobile slide-in drawer ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
            />

            {/* Drawer panel */}
            <motion.div
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="fixed left-0 top-0 h-full w-72 z-50 bg-background border-r border-border shadow-2xl md:hidden flex flex-col"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-4 py-4 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <Gear weight="duotone" className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold text-lg tracking-tight">Settings</h2>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  <X weight="bold" className="h-4 w-4" />
                </button>
              </div>

              {/* Drawer nav */}
              <ScrollArea className="flex-1 px-3 py-3">
                <NavItems />
              </ScrollArea>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
