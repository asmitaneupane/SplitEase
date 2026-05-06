"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Receipt,
  LayoutDashboard,
  Users,
  History,
  LogOut,
  Settings,
  Home,
} from "lucide-react";
import type { Profile } from "@/lib/types";
import { cn } from "@/lib/utils";

interface DashboardNavProps {
  user: User;
  profile: Profile | null;
}

export function DashboardNav({ user, profile }: DashboardNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/groups", label: "Groups", icon: Users },
    { href: "/household", label: "Households", icon: Home },
    { href: "/activity", label: "Activity", icon: History },
  ];

  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : (user.email?.[0]?.toUpperCase() ?? "U");

  return (
    <header className="border-b border-border/40 glass sticky top-0 z-50 backdrop-blur-2xl bg-background/60">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-10">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="p-2.5 bg-gradient-to-br from-primary to-indigo-600 rounded-xl group-hover:rotate-6 transition-all duration-500 shadow-xl shadow-primary/30 active:scale-90">
              <Receipt className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-black tracking-tight hidden sm:inline bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 group-hover:from-primary group-hover:to-indigo-500 transition-all duration-500">
              SplitEase
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-2.5 px-5 py-2.5 text-sm font-bold rounded-full transition-all duration-500 hover:bg-primary/5",
                    isActive
                      ? "text-primary bg-primary/10 shadow-[0_0_20px_-5px_rgba(var(--primary),0.3)]"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <item.icon className={cn("h-4 w-4 transition-transform duration-500", isActive ? "scale-110" : "group-hover:scale-110")} />
                  {item.label}
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full blur-[2px] animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-11 w-11 rounded-full p-0 overflow-hidden ring-2 ring-transparent hover:ring-primary/20 transition-all duration-500">
                <Avatar className="h-11 w-11 ring-1 ring-border/50">
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-black text-sm">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 glass-darker p-3 mt-4 border-white/10 animate-in zoom-in-95 duration-300">
              <div className="flex items-center gap-4 px-4 py-4 mb-3 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/10">
                <Avatar className="h-10 w-10 ring-2 ring-white/20">
                  <AvatarFallback className="bg-primary text-primary-foreground font-black">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black tracking-tight truncate">
                    {profile?.full_name || "Welcome Back"}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate uppercase tracking-widest font-bold">{user.email}</p>
                </div>
              </div>
              <DropdownMenuSeparator className="bg-border/20 mx-2" />
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer rounded-xl px-4 py-3 text-sm font-bold hover:bg-primary/10 transition-all duration-300 group">
                  <Settings className="mr-3 h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:rotate-90 transition-all duration-500" />
                  Account Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/20 mx-2" />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="cursor-pointer rounded-xl px-4 py-3 text-sm font-bold text-destructive hover:bg-destructive/10 transition-all duration-300"
              >
                <LogOut className="mr-3 h-4 w-4" />
                Secure Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile nav */}
      <nav className="md:hidden flex items-center justify-around border-t border-border/40 glass-darker px-4 py-4 pb-safe-offset-4 rounded-t-3xl shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.3)]">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1.5 transition-all duration-500",
                isActive ? "text-primary scale-110" : "text-muted-foreground hover:text-foreground active:scale-95",
              )}
            >
              <div className={cn(
                "p-2.5 rounded-2xl transition-all duration-500",
                isActive ? "bg-primary/10 shadow-lg shadow-primary/5" : ""
              )}>
                <item.icon className={cn("h-5 w-5", isActive ? "animate-pulse" : "")} />
              </div>
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
