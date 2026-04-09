"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, MessageSquare, BarChart3,
  UserCog, Settings, Shield,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { SessionUser } from "@/types";

const NAV_ITEMS = [
  { key: "overview",  label: "Dashboard",    href: "/dashboard/overview",  icon: LayoutDashboard },
  { key: "leads",     label: "Leads",        href: "/dashboard/leads",     icon: Users },
  { key: "chat",      label: "Chat History", href: "/dashboard/chat",      icon: MessageSquare },
  { key: "analytics", label: "Analytics",    href: "/dashboard/analytics", icon: BarChart3 },
  { key: "team",      label: "Team",         href: "/dashboard/team",      icon: UserCog },
  { key: "settings",  label: "Settings",     href: "/dashboard/settings",  icon: Settings },
];

interface SidebarNavProps {
  user: SessionUser;
  newLeadsCount?: number;
  agentName?: string;
  agentPhotoUrl?: string | null;
}

export function SidebarNav({
  user,
  newLeadsCount = 0,
  agentName = "Emma",
  agentPhotoUrl,
}: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Shield className="size-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-sidebar-foreground leading-tight">Majestic</p>
            <p className="text-xs text-sidebar-foreground/50">Insurance Agency</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = pathname.startsWith(item.href);
              return (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
                    <Link href={item.href}>
                      <Icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                  {item.key === "leads" && newLeadsCount > 0 && (
                    <SidebarMenuBadge>{newLeadsCount}</SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      <div className="px-4 py-3">
        <p className="mb-2 text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wide">
          Active Agent
        </p>
        <div className="flex items-center gap-2.5">
          <Avatar className="size-8">
            <AvatarImage src={agentPhotoUrl ?? undefined} alt={agentName} />
            <AvatarFallback>{agentName[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium text-sidebar-foreground">{agentName}</p>
            <div className="flex items-center gap-1.5 text-xs text-sidebar-foreground/50">
              <span className="size-1.5 rounded-full bg-green-500" />
              Online
            </div>
          </div>
        </div>
      </div>

      <SidebarSeparator />

      <SidebarFooter className="p-4">
        <div className="flex items-center gap-2.5">
          <Avatar className="size-8">
            <AvatarFallback className="text-xs font-semibold">
              {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-sidebar-foreground">{user.name}</p>
            <p className="text-xs text-sidebar-foreground/50 capitalize">
              {user.role.toLowerCase().replace("_", " ")}
            </p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
