import type { ReactNode } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/subscribed/app-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { siteConfig } from "@/lib/site-config";
import { requireCurrentUserSubscriptionPlan } from "@/lib/subscription/subscription";
import { SubscriptionPlan } from "@/types/database";
import { tw } from "@/lib/utils";

type SubscribedLayoutProps = {
  children: ReactNode;
};

const styles = {
  inset: tw("min-h-svh"),
  content: tw("flex-1 p-4 lg:p-6"),
};

const SubscribedLayout = async ({ children }: SubscribedLayoutProps) => {
  await requireCurrentUserSubscriptionPlan(SubscriptionPlan.Basic);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className={styles.inset}>
        <AppHeader github={siteConfig.github} />
        <div className={styles.content}>{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default SubscribedLayout;
