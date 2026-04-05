import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import LandingLight from "./pages/LandingLight";
import Leads from "./pages/Leads";
import LeadCategories from "./pages/LeadCategories";
import CategoryDetail from "./pages/CategoryDetail";
import SheetDetail from "./pages/SheetDetail";
import ImportLeads from "./pages/ImportLeads";
import Campaigns from "./pages/Campaigns";
import Templates from "./pages/Templates";
import Pipeline from "./pages/Pipeline";
import Analytics from "./pages/Analytics";
import Scripts from "./pages/Scripts";
import ContentLibrary from "./pages/ContentLibrary";
import Sequences from "./pages/Sequences";
import FollowUps from "./pages/FollowUps";
import Orchestrator from "./pages/Orchestrator";
import SettingsPage from "./pages/SettingsPage";
import Clients from "./pages/Clients";
import Projects from "./pages/Projects";
import Proposals from "./pages/Proposals";
import Revenue from "./pages/Revenue";
import TeamMembers from "./pages/TeamMembers";
import AIAssistant from "./pages/AIAssistant";
import AIKnowledgeBase from "./pages/AIKnowledgeBase";
import VoiceAgentPage from "./pages/VoiceAgentPage";
import WhatsAppIntegration from "./pages/WhatsAppIntegration";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/" element={<LandingLight />} />
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Index />} />
              <Route path="/leads" element={<LeadCategories />} />
              <Route path="/leads/all" element={<Leads />} />
              <Route path="/leads/category/:categoryId" element={<CategoryDetail />} />
              <Route path="/leads/sheet/:sheetId" element={<SheetDetail />} />
              <Route path="/import" element={<ImportLeads />} />
              <Route path="/campaigns" element={<Campaigns />} />
              <Route path="/templates" element={<Templates />} />
              <Route path="/scripts" element={<Scripts />} />
              <Route path="/content" element={<ContentLibrary />} />
              <Route path="/sequences" element={<Sequences />} />
              <Route path="/follow-ups" element={<FollowUps />} />
              <Route path="/followups" element={<Navigate to="/follow-ups" replace />} />
              <Route path="/pipeline" element={<Pipeline />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/orchestrator" element={<Orchestrator />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/proposals" element={<Proposals />} />
              <Route path="/revenue" element={<Revenue />} />
              <Route path="/team" element={<TeamMembers />} />
              <Route path="/ai-assistant" element={<AIAssistant />} />
              <Route path="/voice-agent" element={<VoiceAgentPage />} />
              <Route path="/knowledge-base" element={<AIKnowledgeBase />} />
              <Route path="/whatsapp" element={<WhatsAppIntegration />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
