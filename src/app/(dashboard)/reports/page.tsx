"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer, Loader2, FileText } from "lucide-react";

/* ── types ── */
interface Transaction {
  id: string;
  invoiceNumber: string;
  customerId: string | null;
  subtotal: number;
  discount: number;
  total: number;
  paymentAmount: number;
  change: number;
  status: string;
  createdAt: string;
  customerName: string | null;
}


const MONTHS = [
  { value: "01", label: "Januari" },
  { value: "02", label: "Februari" },
  { value: "03", label: "Maret" },
  { value: "04", label: "April" },
  { value: "05", label: "Mei" },
  { value: "06", label: "Juni" },
  { value: "07", label: "Juli" },
  { value: "08", label: "Agustus" },
  { value: "09", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Desember" },
];

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID").format(n);
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function getMonthLabel(m: string) {
  return MONTHS.find((x) => x.value === m)?.label ?? m;
}

export default function ReportsPage() {
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1).padStart(2, "0"));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/transactions?month=${month}&year=${year}`);
      setTransactions(await res.json());
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ── derived stats ── */
  const totalRevenue = transactions.reduce((s, t) => s + t.total, 0);
  const totalDiscount = transactions.reduce((s, t) => s + t.discount, 0);
  const netRevenue = totalRevenue;
  const grossRevenue = totalRevenue + totalDiscount;

  const handlePrint = () => window.print();

  /* ── year options ── */
  const currentYear = now.getFullYear();
  const years = Array.from({ length: 3 }, (_, i) => String(currentYear - i));

  return (
    <div className="space-y-6">
      {/* ── Controls (hidden on print) ── */}
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary">Laporan Bulanan</h2>
          <p className="text-muted-foreground">Pilih periode untuk melihat dan mencetak laporan.</p>
        </div>
        <div className="flex gap-3">
          <Select value={month} onValueChange={(val) => { setMonth(val ?? ""); setLoading(true); }}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Bulan" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={year} onValueChange={(val) => { setYear(val ?? ""); setLoading(true); }}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Tahun" />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Cetak Laporan
          </Button>
        </div>
      </div>

      {/* ── Report Content (printable) ── */}
      <div className="print:bg-white print:text-black">
        <Card className="shadow-sm print:shadow-none print:border-none">
          <CardHeader className="text-center border-b border-border print:border-black pb-6">
            <CardTitle className="text-2xl uppercase tracking-widest font-bold">Laporan Penjualan</CardTitle>
            <p className="text-muted-foreground print:text-black mt-1">
              OptiDash Store — {getMonthLabel(month)} {year}
            </p>
          </CardHeader>
          <CardContent className="pt-6 space-y-8">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Memuat data laporan...
              </div>
            ) : (
              <>
                {/* ── Summary Cards ── */}
                <div>
                  <h3 className="font-bold text-lg mb-4 print:text-black">Ringkasan Pendapatan</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-muted/50 rounded-lg print:bg-transparent print:border print:border-black print:p-2">
                      <div className="text-sm text-muted-foreground print:text-black">Total Transaksi</div>
                      <div className="text-xl font-bold mt-1">{transactions.length}</div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg print:bg-transparent print:border print:border-black print:p-2">
                      <div className="text-sm text-muted-foreground print:text-black">Pendapatan Kotor</div>
                      <div className="text-xl font-bold mt-1">Rp {fmt(grossRevenue)}</div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg print:bg-transparent print:border print:border-black print:p-2">
                      <div className="text-sm text-muted-foreground print:text-black">Total Diskon</div>
                      <div className="text-xl font-bold mt-1">Rp {fmt(totalDiscount)}</div>
                    </div>
                    <div className="p-4 bg-primary/10 rounded-lg print:bg-transparent print:border print:border-black print:p-2">
                      <div className="text-sm text-primary font-medium print:text-black">Pendapatan Bersih</div>
                      <div className="text-xl font-bold text-primary print:text-black mt-1">Rp {fmt(netRevenue)}</div>
                    </div>
                  </div>
                </div>

                {/* ── Transaction Table ── */}
                <div>
                  <h3 className="font-bold text-lg mb-4 print:text-black">Rincian Transaksi</h3>
                  {transactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <FileText className="h-10 w-10 mb-2 opacity-20" />
                      <p>Tidak ada transaksi pada periode ini.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs uppercase bg-muted/50 border-y border-border print:bg-transparent print:border-black">
                          <tr>
                            <th className="px-4 py-3 font-semibold print:text-black">No</th>
                            <th className="px-4 py-3 font-semibold print:text-black">Tanggal</th>
                            <th className="px-4 py-3 font-semibold print:text-black">No. Nota</th>
                            <th className="px-4 py-3 font-semibold print:text-black">Pelanggan</th>
                            <th className="px-4 py-3 font-semibold text-right print:text-black">Subtotal</th>
                            <th className="px-4 py-3 font-semibold text-right print:text-black">Diskon</th>
                            <th className="px-4 py-3 font-semibold text-right print:text-black">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border print:divide-black">
                          {transactions.map((tx, i) => (
                            <tr key={tx.id} className="hover:bg-muted/50 print:hover:bg-transparent">
                              <td className="px-4 py-3 text-muted-foreground print:text-black">{i + 1}</td>
                              <td className="px-4 py-3">{fmtDate(tx.createdAt)}</td>
                              <td className="px-4 py-3 font-medium">{tx.invoiceNumber}</td>
                              <td className="px-4 py-3">{tx.customerName ?? "—"}</td>
                              <td className="px-4 py-3 text-right">Rp {fmt(tx.subtotal)}</td>
                              <td className="px-4 py-3 text-right">{tx.discount > 0 ? `Rp ${fmt(tx.discount)}` : "—"}</td>
                              <td className="px-4 py-3 text-right font-medium">Rp {fmt(tx.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="border-t-2 border-border print:border-black font-bold">
                          <tr>
                            <td colSpan={4} className="px-4 py-3 text-right">TOTAL</td>
                            <td className="px-4 py-3 text-right">Rp {fmt(grossRevenue)}</td>
                            <td className="px-4 py-3 text-right">Rp {fmt(totalDiscount)}</td>
                            <td className="px-4 py-3 text-right text-primary print:text-black">Rp {fmt(netRevenue)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>

                {/* ── Print-only footer ── */}
                <div className="print:block hidden text-center pt-16 text-sm">
                  <p>Dicetak pada: {new Date().toLocaleDateString("id-ID")} {new Date().toLocaleTimeString("id-ID")}</p>
                  <p className="mt-12 pt-8 border-t inline-block w-48 border-black">Tanda Tangan Pemilik / Manajer</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
