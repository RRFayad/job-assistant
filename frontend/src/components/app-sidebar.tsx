"use client";

import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";
import {
  BriefcaseIcon,
  CreditCardIcon,
  FileTextIcon,
  SparklesIcon,
  UserRoundIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { tw } from "@/lib/utils";
import { routes } from "@/lib/routes";

const workspaceNavigation = [
  {
    title: "Profile",
    href: routes.workspace.profile,
    icon: FileTextIcon,
  },
  { title: "Applications", href: null, icon: BriefcaseIcon },
];

const settingsNavigation = [
  {
    title: "Account",
    href: routes.settings.account,
    icon: UserRoundIcon,
  },
  {
    title: "Billing",
    href: routes.settings.billing,
    icon: CreditCardIcon,
  },
];

const styles = {
  header: tw("flex-row items-center justify-between pt-3"),
  brand: tw(
    "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-semibold",
  ),
  brandIcon: tw("size-4 text-primary"),
  brandLabel: tw("truncate group-data-[collapsible=icon]:hidden"),
  desktopSidebarTrigger: tw("hidden md:inline-flex"),
  account: tw("flex items-center gap-2 rounded-md px-2 py-1.5"),
  accountContent: tw("min-w-0 group-data-[collapsible=icon]:hidden"),
  accountLabel: tw("truncate text-sm font-medium text-sidebar-foreground"),
  accountEmail: tw("mt-0.5 truncate text-xs text-sidebar-foreground/60"),
};

export const AppSidebar = () => {
  const pathname = usePathname();
  const { user } = useUser();
  const { isMobile, state } = useSidebar();
  const accountName = user?.fullName ?? user?.firstName ?? "Signed in";
  const accountEmail = user?.primaryEmailAddress?.emailAddress;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className={styles.header}>
        <Link href={routes.workspace.profile} className={styles.brand}>
          <SparklesIcon className={styles.brandIcon} />
          <span className={styles.brandLabel}>Job Assistant</span>
        </Link>
        {!isMobile && state === "expanded" && (
          <SidebarTrigger className={styles.desktopSidebarTrigger} />
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {workspaceNavigation.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={item.href !== null && pathname === item.href}
                    render={item.href ? <Link href={item.href} /> : undefined}
                    tooltip={item.title}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Settings</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {settingsNavigation.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  isActive={pathname === item.href}
                  render={<Link href={item.href} />}
                  tooltip={item.title}
                >
                  <item.icon />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      <SidebarFooter>
        <div className={styles.account}>
          <UserButton />
          <div className={styles.accountContent}>
            <p className={styles.accountLabel}>{accountName}</p>
            {accountEmail && (
              <p className={styles.accountEmail}>{accountEmail}</p>
            )}
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
};
