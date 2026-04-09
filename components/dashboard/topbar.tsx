"use client";

import { useRouter } from "next/navigation";
import { Bell, LogOut } from "lucide-react";
import Image from "next/image";
import axios from "axios";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ThemeSwitcher } from "@/components/theme-switcher";
import type { SessionUser } from "@/types";

const NOTIFS = [
  { text: "New lead captured via website", time: "8m ago" },
  { text: "Marcus Bell started a chat", time: "22m ago" },
  { text: "Sandra Mensah filed a claim", time: "2h ago" },
];

interface TopbarProps {
  user: SessionUser;
  agentName?: string;
  agentPhotoUrl?: string | null;
}

export function Topbar({ user, agentName = "Emma", agentPhotoUrl }: TopbarProps) {
  const router = useRouter();

  const logout = async () => {
    await axios.post("/api/auth/logout");
    router.push("/auth/login");
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-sm">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-4" />

      {/* Agent pill */}
      <div className="flex items-center gap-1.5 rounded-full border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
        <div className="relative size-5 overflow-hidden rounded-full bg-muted flex items-center justify-center shrink-0">
          {agentPhotoUrl ? (
            <Image src={agentPhotoUrl} alt={agentName} width={20} height={20} className="size-full object-cover" />
          ) : (
            <span className="text-[10px]">AI</span>
          )}
        </div>
        <span className="size-1.5 rounded-full bg-green-500" />
        <span className="font-medium text-foreground">{agentName}</span>
        <span>· active</span>
      </div>

      <div className="flex-1 text-xs text-muted-foreground">
        {new Date().toLocaleDateString("en-US", {
          weekday: "long", year: "numeric", month: "long", day: "numeric",
        })}
      </div>

      {/* Notifications */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" className="relative">
            <Bell className="size-4" />
            <Badge className="absolute -top-1 -right-1 size-4 p-0 flex items-center justify-center text-[10px]">
              {NOTIFS.length}
            </Badge>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel>Notifications</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {NOTIFS.map((n, i) => (
            <DropdownMenuItem key={i} className="flex flex-col items-start gap-0.5 py-2">
              <span className="text-sm">{n.text}</span>
              <span className="text-xs text-muted-foreground">{n.time}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <ThemeSwitcher />

      <Button variant="ghost" size="sm" onClick={logout} className="gap-1.5">
        <LogOut className="size-3.5" />
        Logout
      </Button>
    </header>
  );
}
