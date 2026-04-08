import {
  SquaresFour,
  Users,
  Briefcase,
  Megaphone,
  FileText,
  Kanban,
  ChartLineUp,
  Gear,
  SignOut,
  FolderOpen,
  Clock,
  CurrencyInr,
  UsersThree,
  Sparkle,
  CaretRight,
  AddressBook,
  Path,
  Tray,
  PenNib,
  WhatsappLogo,
  MicrophoneStage
} from "@phosphor-icons/react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const navigationStructure = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: SquaresFour,
  },
  {
    title: "CRM",
    icon: AddressBook,
    items: [
      { title: "Leads", url: "/leads", icon: Users },
      { title: "Clients", url: "/clients", icon: Briefcase },
    ],
  },
  {
    title: "Work",
    icon: Path,
    items: [
      { title: "Projects", url: "/projects", icon: Path },
      { title: "Proposals", url: "/proposals", icon: FileText },
    ],
  },
  {
    title: "Marketing",
    icon: Megaphone,
    items: [
      { title: "Campaigns", url: "/campaigns", icon: Megaphone },
      { title: "Templates", url: "/templates", icon: PenNib },
      { title: "Scripts", url: "/scripts", icon: FileText },
      { title: "Content", url: "/content", icon: FolderOpen },
      { title: "Sequences", url: "/sequences", icon: Tray },
      { title: "Follow-Ups", url: "/follow-ups", icon: Clock },
    ],
  },
  {
    title: "Sales & Analytics",
    icon: ChartLineUp,
    items: [
      { title: "Pipeline", url: "/pipeline", icon: Kanban },
      { title: "Revenue", url: "/revenue", icon: CurrencyInr },
      { title: "Analytics", url: "/analytics", icon: ChartLineUp },
    ],
  },
  {
    title: "Intelligence",
    icon: Sparkle,
    items: [
      { title: "AI Calling Agent", url: "/voice-agent", icon: MicrophoneStage },
      { title: "Live Assistant", url: "/live-assistant", icon: MicrophoneStage },
      { title: "AI Assistant", url: "/ai-assistant", icon: Sparkle },
      { title: "Knowledge Base", url: "/knowledge-base", icon: FileText },
    ],
  },
  {
    title: "System",
    icon: Gear,
    items: [
      { title: "Team", url: "/team", icon: UsersThree },
      { title: "Settings", url: "/settings", icon: Gear },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { signOut } = useAuth();

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const isGroupActive = (items: { url: string }[]) => {
    return items.some((item) => isActive(item.url));
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border/40 bg-background/80 backdrop-blur-xl">
      <SidebarHeader className="h-14 p-4 flex items-center border-b border-border/40 border-transparent bg-transparent">
        <div className="flex items-center gap-2.5 w-full">
          <img src="/logo-light.png" alt="Aivants" className="h-7 w-7 object-contain rounded-md" />
          {!collapsed && (
            <span className="text-base font-semibold tracking-tight text-foreground truncate">Aivants</span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="pt-4 px-2 select-none hide-scrollbar">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1 relative">
              {navigationStructure.map((group) => {
                const isItemActive = !group.items && isActive(group.url!);
                
                if (!group.items) {
                  return (
                    <SidebarMenuItem key={group.title} className="relative z-10">
                      <SidebarMenuButton 
                        asChild 
                        isActive={isItemActive}
                        tooltip={group.title}
                        className="rounded-xl transition-all duration-200 bg-transparent active:scale-95"
                      >
                        <NavLink to={group.url!} className="relative w-full z-20" onClick={(e) => {
                          const trigger = document.querySelector('[data-sidebar="trigger"]') as HTMLButtonElement;
                          if (trigger && window.innerWidth < 768) trigger.click();
                        }}>
                          {isItemActive && (
                            <motion.div
                              layoutId="active-sidebar-pill"
                              className="absolute inset-0 bg-primary/10 rounded-xl z-[-1]"
                              initial={false}
                              transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                          )}
                          <div className={`flex items-center gap-2 ${isItemActive ? 'text-primary' : 'text-muted-foreground'}`}>
                            <group.icon weight="duotone" className="h-5 w-5" />
                            <span className="text-[14px] font-medium">{group.title}</span>
                          </div>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }

                return (
                  <Collapsible
                    key={group.title}
                    defaultOpen={isGroupActive(group.items)}
                    className="group/collapsible relative z-10"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={group.title} className="rounded-xl transition-all duration-200 text-muted-foreground active:scale-95">
                          <group.icon weight="duotone" className="h-5 w-5" />
                          <span className="text-[14px] font-medium">{group.title}</span>
                          <CaretRight weight="bold" className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 opacity-50" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub className="pr-0 mr-0 border-border/40 ml-4 py-1.5 gap-1 relative z-10">
                          {group.items.map((subItem) => {
                            const active = isActive(subItem.url);
                            return (
                              <SidebarMenuSubItem key={subItem.title} className="relative z-20">
                                <SidebarMenuSubButton 
                                  asChild 
                                  isActive={active} 
                                  className={`rounded-lg h-8 transition-colors bg-transparent active:scale-[0.97]`}
                                >
                                  <NavLink to={subItem.url} className="relative w-full z-20" onClick={(e) => {
                                      const trigger = document.querySelector('[data-sidebar="trigger"]') as HTMLButtonElement;
                                      if (trigger && window.innerWidth < 768) trigger.click();
                                  }}>
                                    {active && (
                                      <motion.div
                                        layoutId="active-sidebar-subpill"
                                        className="absolute inset-0 bg-primary/10 rounded-lg z-[-1]"
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 350, damping: 25 }}
                                      />
                                    )}
                                    <div className={`flex items-center gap-2 ${active ? 'text-primary' : 'text-muted-foreground hover:text-foreground transition-colors'}`}>
                                      <subItem.icon weight="duotone" className="h-[14px] w-[14px]" />
                                      <span className="text-[13px] font-medium">{subItem.title}</span>
                                    </div>
                                  </NavLink>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/40 p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={signOut} 
              className="rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all duration-200 text-muted-foreground active:scale-95"
            >
              <SignOut weight="duotone" className="h-5 w-5" />
              {!collapsed && <span className="text-[14px] font-medium">Sign Out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
