import { useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { FloatingAIWidget } from "@/components/FloatingAIWidget";
import { GlobalSearch } from "@/components/GlobalSearch";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

export function AppLayout() {
  const location = useLocation();
  // Keyboard shortcut for search
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        document.querySelector<HTMLButtonElement>("[data-search-trigger]")?.click();
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border/50 bg-background/80 backdrop-blur-xl px-4 gap-4 sticky top-0 z-30">
            <SidebarTrigger />
            <div data-search-trigger>
              <GlobalSearch />
            </div>
          </header>
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background relative flex flex-col">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="p-4 sm:p-6 md:p-8 w-full max-w-full"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
      <FloatingAIWidget />
    </SidebarProvider>
  );
}
