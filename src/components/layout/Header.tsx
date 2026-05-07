"use client";

import { useSession } from "@/lib/auth-client";
import { useTheme } from "@/components/ThemeProvider";
import { Sun, Moon } from "lucide-react";

export function Header() {
  const { data: session, isPending } = useSession();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 bg-background/80 backdrop-blur-md border-b border-border shadow-sm print:hidden">
      <div className="flex flex-1 justify-between px-4 md:px-8">
        <div className="flex flex-1" />
        <div className="ml-4 flex items-center md:ml-6">
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors"
              title={theme === "light" ? "Mode Gelap" : "Mode Terang"}
            >
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>

            {/* User Info */}
            {isPending ? (
              <span className="text-sm text-muted-foreground">Loading...</span>
            ) : session ? (
              <>
                <span className="text-sm font-medium">{session.user.name}</span>
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                  {session.user.name?.charAt(0).toUpperCase() ?? "S"}
                </div>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">Tidak masuk</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
