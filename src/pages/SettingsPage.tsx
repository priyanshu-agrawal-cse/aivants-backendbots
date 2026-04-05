import { useState } from "react";
import { SettingsLayout, type SettingsSection } from "@/components/settings/SettingsLayout";
import { GeneralSettings } from "@/components/settings/GeneralSettings";
import { AISettingsSection } from "@/components/AISettingsSection";
import { EmailSettings } from "@/components/settings/EmailSettings";
import { TelegramSettings } from "@/components/settings/TelegramSettings";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { AutomationSettings } from "@/components/settings/AutomationSettings";
import { WebhookSettings } from "@/components/settings/WebhookSettings";
import { IntegrationSettings } from "@/components/settings/IntegrationSettings";
import { UsersPermissionsSettings } from "@/components/settings/UsersPermissionsSettings";
import { SecuritySettings } from "@/components/settings/SecuritySettings";
import { DeveloperSettings } from "@/components/settings/DeveloperSettings";
import { AccountSettings } from "@/components/settings/AccountSettings";
import { Sparkle } from "@phosphor-icons/react";

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>("general");

  const renderSection = () => {
    switch (activeSection) {
      case "general":
        return (
          <div className="space-y-6">
            <GeneralSettings />
            <AccountSettings />
          </div>
        );
      case "ai":
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <div className="h-10 w-10 min-w-10 rounded-xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 flex items-center justify-center border border-primary/10 shadow-sm mr-3">
                  <Sparkle weight="duotone" className="h-5 w-5 text-indigo-500 drop-shadow-sm" />
                </div>
                AI & Model APIs
              </h1>
              <p className="text-muted-foreground text-sm">Configure AI providers, models, and behavior</p>
            </div>
            <AISettingsSection />
          </div>
        );
      case "email":
        return <EmailSettings />;
      case "telegram":
        return <TelegramSettings />;
      case "notifications":
        return <NotificationSettings />;
      case "automations":
        return <AutomationSettings />;
      case "webhooks":
        return <WebhookSettings />;
      case "integrations":
        return <IntegrationSettings />;
      case "users":
        return <UsersPermissionsSettings />;
      case "security":
        return <SecuritySettings />;
      case "developer":
        return <DeveloperSettings />;
      default:
        return <GeneralSettings />;
    }
  };

  return (
    <SettingsLayout activeSection={activeSection} onSectionChange={setActiveSection}>
      {renderSection()}
    </SettingsLayout>
  );
}
