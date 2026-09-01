"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function NavBar({ displayName }: { displayName: string }) {
  const router = useRouter();
  const initial = displayName.charAt(0).toUpperCase();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="border-border bg-background/90 sticky top-0 z-30 border-b backdrop-blur-md">
      <div className="flex h-[62px] w-full items-center justify-between px-4 sm:px-8">
        <Link href="/trips" className="flex items-baseline gap-2.5">
          <span className="font-heading text-[24px] italic tracking-[-0.01em]">
            Wanderplan
          </span>
          <span className="data-label hidden tracking-[0.14em] sm:inline">
            Shared itineraries
          </span>
        </Link>

        <div className="flex items-center gap-3.5">
          <ThemeToggle />

          <Link
            href="/trips/new"
            className="border-primary text-foreground hover:bg-primary hover:text-primary-foreground hidden h-[34px] items-center gap-[7px] rounded-full border-[1.5px] px-[15px] text-[13px] font-semibold transition-colors duration-150 sm:inline-flex"
          >
            <Plus className="size-[15px]" />
            Start a trip
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  aria-label="Account"
                  className="focus-visible:ring-ring/50 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                />
              }
            >
              <Avatar className="size-[34px]">
                <AvatarFallback className="bg-brand font-heading text-[16px] font-normal text-primary-foreground">
                  {initial}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="truncate font-normal">
                  {displayName}
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<Link href="/trips/new" />} className="sm:hidden">
                <Plus className="size-4" />
                Start a trip
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut}>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
