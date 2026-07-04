"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutGlobally } from "@/lib/auth/sign-out";
import { getNameInitials } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";
import { ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminUserMenu() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!user) return null;

  const displayName =
    (user.user_metadata?.name as string | undefined)?.trim() || "Admin";
  const initials = getNameInitials(displayName);

  const logout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      await signOutGlobally();
      router.refresh();
      router.push("/");
    } catch {
      setIsLoggingOut(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-auto w-full justify-start gap-3 rounded-md px-3 py-2.5 hover:bg-muted"
          aria-label={`${displayName} account menu`}
        >
          <Avatar className="h-9 w-9 shrink-0 border border-primary/15">
            <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1 text-left">
            <span className="block truncate text-sm font-medium text-foreground">
              {displayName}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {user.email}
            </span>
          </span>
          <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[calc(var(--admin-sidebar-width)-1.5rem)] min-w-56"
        align="start"
        side="top"
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 shrink-0 border border-primary/15">
              <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium leading-none">
                {displayName}
              </p>
              <p className="mt-1 truncate text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={isLoggingOut} onClick={() => void logout()}>
          {isLoggingOut ? "Signing out…" : "Log out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
