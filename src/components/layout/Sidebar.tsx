"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, ShoppingCart, Package, Users, FileText, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/auth-client";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Transaksi (POS)", href: "/pos", icon: ShoppingCart },
  { name: "Inventaris", href: "/inventory", icon: Package },
  { name: "Pelanggan & Resep", href: "/customers", icon: Users },
  { name: "Laporan", href: "/reports", icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/login");
        },
      },
    });
  };

  return (
    <div className="hidden border-r bg-background print:hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-[80]">
      <div className="flex flex-col flex-grow pt-5 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4 mb-8">
          <span className="text-2xl font-bold text-primary tracking-tight">OptiDash</span>
        </div>
        <div className="mt-5 flex-grow flex flex-col">
          <nav className="flex-1 px-2 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    "group flex items-center px-2 py-3 text-sm font-medium rounded-md transition-colors"
                  )}
                >
                  <item.icon
                    className={cn(
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                      "mr-3 flex-shrink-0 h-5 w-5"
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex-shrink-0 flex border-t border-border p-4">
          <button
            onClick={handleLogout}
            className="flex-shrink-0 w-full group block text-left"
          >
            <div className="flex items-center">
              <LogOut className="inline-block h-5 w-5 rounded-full text-muted-foreground group-hover:text-destructive" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground group-hover:text-destructive">
                  Logout
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
