"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Banknote, Loader2, Package, ShoppingCart } from "lucide-react";

/* ── types ── */
interface TodaySummary {
  totalRevenue: number;
  transactionCount: number;
}

interface TodayTransaction {
  id: string;
  invoiceNumber: string;
  total: number;
  discount: number;
  status: string;
  createdAt: string;
  customerName: string | null;
}

interface LowStockItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
}

interface DashboardData {
  today: TodaySummary;
  todayTransactions: TodayTransaction[];
  lowStockItems: LowStockItem[];
}

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID").format(n);
}

function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard");
      setData(await res.json());
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Memuat dashboard...
      </div>
    );
  }

  const today = data?.today ?? { totalRevenue: 0, transactionCount: 0 };
  const transactions = data?.todayTransactions ?? [];
  const lowStock = data?.lowStockItems ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-primary">Dashboard</h2>
        <p className="text-muted-foreground">Ringkasan operasional toko hari ini.</p>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-l-4 border-l-primary shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendapatan Hari Ini</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {fmt(today.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Dari {today.transactionCount} transaksi hari ini
            </p>
          </CardContent>
        </Card>

        <Card className={`border-l-4 shadow-sm ${lowStock.length > 0 ? "border-l-destructive" : "border-l-green-500"}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Peringatan Stok</CardTitle>
            <AlertCircle className={`h-4 w-4 ${lowStock.length > 0 ? "text-destructive" : "text-green-500"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${lowStock.length > 0 ? "text-destructive" : "text-green-600"}`}>
              {lowStock.length} Item
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {lowStock.length > 0 ? "Stok di bawah batas minimal (≤ 5)" : "Semua stok dalam kondisi aman"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-muted shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Transaksi Terakhir</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {transactions.length > 0 ? transactions[transactions.length - 1].invoiceNumber : "—"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {transactions.length > 0
                ? `${transactions[transactions.length - 1].customerName ?? "Tanpa pelanggan"} • Rp ${fmt(transactions[transactions.length - 1].total)}`
                : "Belum ada transaksi hari ini"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Transaksi Hari Ini ── */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-primary">Transaksi Hari Ini</h3>
        <Card className="shadow-sm">
          <CardContent className="p-0">
            {transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ShoppingCart className="h-10 w-10 mb-2 opacity-20" />
                <p className="text-sm">Belum ada transaksi hari ini.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-6 py-3 font-semibold text-muted-foreground">Waktu</th>
                      <th className="px-6 py-3 font-semibold text-muted-foreground">No. Nota</th>
                      <th className="px-6 py-3 font-semibold text-muted-foreground">Pelanggan</th>
                      <th className="px-6 py-3 font-semibold text-muted-foreground text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-muted/50">
                        <td className="px-6 py-4">{fmtTime(tx.createdAt)}</td>
                        <td className="px-6 py-4 font-medium">{tx.invoiceNumber}</td>
                        <td className="px-6 py-4">{tx.customerName ?? "—"}</td>
                        <td className="px-6 py-4 text-right font-bold">Rp {fmt(tx.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-border font-bold bg-muted/30">
                    <tr>
                      <td colSpan={3} className="px-6 py-3 text-right">Total Hari Ini</td>
                      <td className="px-6 py-3 text-right text-primary">Rp {fmt(today.totalRevenue)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Barang Hampir Habis ── */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-primary">Barang Hampir Habis</h3>
        <Card className="shadow-sm">
          <CardContent className="p-0">
            {lowStock.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Package className="h-10 w-10 mb-2 opacity-20" />
                <p className="text-sm">Semua stok dalam kondisi aman. 👍</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-6 py-3 font-semibold text-muted-foreground">SKU</th>
                      <th className="px-6 py-3 font-semibold text-muted-foreground">Nama Barang</th>
                      <th className="px-6 py-3 font-semibold text-muted-foreground">Kategori</th>
                      <th className="px-6 py-3 font-semibold text-muted-foreground text-center">Sisa Stok</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {lowStock.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/50">
                        <td className="px-6 py-4">{item.sku}</td>
                        <td className="px-6 py-4 font-medium">{item.name}</td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {item.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`font-bold ${item.stock === 0 ? "text-destructive" : item.stock <= 2 ? "text-orange-500" : "text-yellow-600"}`}>
                            {item.stock}
                          </span>
                          {item.stock === 0 && (
                            <span className="ml-2 text-xs bg-destructive/10 text-destructive px-1.5 py-0.5 rounded">HABIS</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
