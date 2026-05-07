"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Search, Plus, Trash2, Loader2, Check, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";

/* ── types ── */
interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
}

interface Customer {
  id: string;
  name: string;
  phone: string | null;
}

interface Prescription {
  id: string;
  customerId: string;
  odSph: number | null; odCyl: number | null; odAxis: number | null; odAdd: number | null;
  osSph: number | null; osCyl: number | null; osAxis: number | null; osAdd: number | null;
  pd: number | null;
  createdAt: string;
}

interface CartItem {
  inventoryItemId: string;
  sku: string;
  name: string;
  unitPrice: number;
  quantity: number;
  maxStock: number;
}

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID").format(n);
}

export default function POSPage() {
  const router = useRouter();

  /* ── inventory data ── */
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loadingInv, setLoadingInv] = useState(true);

  /* ── customer data ── */
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCust, setLoadingCust] = useState(true);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustDropdown, setShowCustDropdown] = useState(false);

  /* ── prescription ── */
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);
  const [showRxDropdown, setShowRxDropdown] = useState(false);

  /* ── cart ── */
  const [cart, setCart] = useState<CartItem[]>([]);
  const [itemSearch, setItemSearch] = useState("");
  const [showItemDropdown, setShowItemDropdown] = useState(false);

  /* ── payment ── */
  const [discount, setDiscount] = useState(0);
  const [paymentAmount, setPaymentAmount] = useState("");

  /* ── processing ── */
  const [processing, setProcessing] = useState(false);
  const [successDialog, setSuccessDialog] = useState(false);
  const [successInvoice, setSuccessInvoice] = useState("");

  /* refs for dropdown dismiss */
  const custRef = useRef<HTMLDivElement>(null);
  const itemRef = useRef<HTMLDivElement>(null);
  const rxRef = useRef<HTMLDivElement>(null);

  /* ── fetch data ── */
  const fetchInventory = useCallback(async () => {
    setLoadingInv(true);
    try { setInventory(await (await fetch("/api/inventory")).json()); }
    catch { /* ignore */ }
    finally { setLoadingInv(false); }
  }, []);

  const fetchCustomers = useCallback(async () => {
    setLoadingCust(true);
    try { setCustomers(await (await fetch("/api/customers")).json()); }
    catch { /* ignore */ }
    finally { setLoadingCust(false); }
  }, []);

  const fetchPrescriptions = useCallback(async (customerId: string) => {
    try { setPrescriptions(await (await fetch(`/api/prescriptions?customerId=${customerId}`)).json()); }
    catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchInventory(); fetchCustomers(); }, [fetchInventory, fetchCustomers]);

  useEffect(() => {
    if (selectedCustomer) {
      fetchPrescriptions(selectedCustomer.id);
      setSelectedRx(null);
    } else {
      setPrescriptions([]);
      setSelectedRx(null);
    }
  }, [selectedCustomer, fetchPrescriptions]);

  /* ── close dropdowns on outside click ── */
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (custRef.current && !custRef.current.contains(e.target as Node)) setShowCustDropdown(false);
      if (itemRef.current && !itemRef.current.contains(e.target as Node)) setShowItemDropdown(false);
      if (rxRef.current && !rxRef.current.contains(e.target as Node)) setShowRxDropdown(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ── filtered lists ── */
  const filteredCustomers = useMemo(() =>
    customers.filter((c) =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      (c.phone ?? "").includes(customerSearch)
    ).slice(0, 8),
    [customers, customerSearch]
  );

  const filteredItems = useMemo(() =>
    inventory.filter((item) =>
      item.stock > 0 && (
        item.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
        item.sku.toLowerCase().includes(itemSearch.toLowerCase())
      )
    ).slice(0, 8),
    [inventory, itemSearch]
  );

  /* ── cart calculations ── */
  const subtotal = cart.reduce((sum, ci) => sum + ci.unitPrice * ci.quantity, 0);
  const total = Math.max(subtotal - discount, 0);
  const paid = Number(paymentAmount) || 0;
  const change = Math.max(paid - total, 0);

  /* ── cart actions ── */
  const addToCart = (item: InventoryItem) => {
    setCart((prev) => {
      const existing = prev.find((ci) => ci.inventoryItemId === item.id);
      if (existing) {
        if (existing.quantity >= item.stock) return prev;
        return prev.map((ci) =>
          ci.inventoryItemId === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      }
      return [...prev, {
        inventoryItemId: item.id,
        sku: item.sku,
        name: item.name,
        unitPrice: item.price,
        quantity: 1,
        maxStock: item.stock,
      }];
    });
    setItemSearch("");
    setShowItemDropdown(false);
  };

  const updateQty = (id: string, qty: number) => {
    if (qty < 1) return;
    setCart((prev) =>
      prev.map((ci) => ci.inventoryItemId === id
        ? { ...ci, quantity: Math.min(qty, ci.maxStock) }
        : ci
      )
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((ci) => ci.inventoryItemId !== id));
  };

  /* ── process payment ── */
  const handlePayment = async () => {
    if (cart.length === 0) return;
    if (paid < total) return;

    setProcessing(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomer?.id ?? null,
          prescriptionId: selectedRx?.id ?? null,
          items: cart.map((ci) => ({
            inventoryItemId: ci.inventoryItemId,
            quantity: ci.quantity,
          })),
          discount,
          paymentAmount: paid,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Gagal memproses transaksi.");
        return;
      }

      const tx = await res.json();
      setSuccessInvoice(tx.invoiceNumber);
      setSuccessDialog(true);

      // reset
      setCart([]);
      setDiscount(0);
      setPaymentAmount("");
      setSelectedCustomer(null);
      setSelectedRx(null);
      setCustomerSearch("");
      fetchInventory(); // refresh stock
    } catch {
      alert("Kesalahan jaringan.");
    } finally {
      setProcessing(false);
    }
  };

  /* ── render ── */
  return (
    <div className="h-full flex flex-col space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-primary">Kasir (POS)</h2>
        <p className="text-muted-foreground">Proses transaksi penjualan baru.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* ════════════════════════════════════════════
            Kolom Kiri: Pelanggan + Keranjang
           ════════════════════════════════════════════ */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* ── Data Pelanggan & Resep ── */}
          <Card className="shadow-sm overflow-visible">
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium">Data Pelanggan & Resep</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {/* Customer Search */}
                <div className="space-y-2 relative" ref={custRef}>
                  <Label>Cari Pelanggan</Label>
                  {selectedCustomer ? (
                    <div className="flex items-center gap-2 h-10 px-3 border border-border rounded-md bg-muted/30">
                      <span className="flex-1 font-medium text-sm">{selectedCustomer.name}</span>
                      <button
                        className="text-xs text-muted-foreground hover:text-destructive"
                        onClick={() => { setSelectedCustomer(null); setCustomerSearch(""); }}
                      >✕</button>
                    </div>
                  ) : (
                    <>
                      <Input
                        placeholder="Nama / No. HP"
                        tabIndex={1}
                        value={customerSearch}
                        onChange={(e) => { setCustomerSearch(e.target.value); setShowCustDropdown(true); }}
                        onFocus={() => setShowCustDropdown(true)}
                      />
                      {showCustDropdown && (
                        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-auto">
                          {loadingCust ? (
                            <div className="p-3 text-sm text-muted-foreground text-center">Memuat...</div>
                          ) : filteredCustomers.length === 0 ? (
                            <div className="p-3 text-sm text-muted-foreground text-center">Tidak ditemukan</div>
                          ) : (
                            filteredCustomers.map((c) => (
                              <button
                                key={c.id}
                                className="w-full text-left px-3 py-2 hover:bg-muted/50 text-sm transition-colors"
                                onClick={() => { setSelectedCustomer(c); setShowCustDropdown(false); setCustomerSearch(c.name); }}
                              >
                                <div className="font-medium">{c.name}</div>
                                <div className="text-xs text-muted-foreground">{c.phone ?? "—"}</div>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Prescription Select */}
                <div className="space-y-2 relative" ref={rxRef}>
                  <Label>Resep</Label>
                  {!selectedCustomer ? (
                    <Input placeholder="Pilih pelanggan dulu..." disabled className="bg-muted/20" />
                  ) : selectedRx ? (
                    <div className="flex items-center gap-2 h-10 px-3 border border-border rounded-md bg-muted/30">
                      <span className="flex-1 text-sm">
                        OD: {selectedRx.odSph ?? "-"} / OS: {selectedRx.osSph ?? "-"} • PD: {selectedRx.pd ?? "-"}
                      </span>
                      <button className="text-xs text-muted-foreground hover:text-destructive" onClick={() => setSelectedRx(null)}>✕</button>
                    </div>
                  ) : (
                    <>
                      <button
                        className="w-full h-10 px-3 border border-border rounded-md text-left text-sm text-muted-foreground hover:bg-muted/30 transition-colors"
                        onClick={() => setShowRxDropdown(!showRxDropdown)}
                      >
                        {prescriptions.length === 0 ? "Tidak ada resep" : `${prescriptions.length} resep tersedia — pilih`}
                      </button>
                      {showRxDropdown && prescriptions.length > 0 && (
                        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-auto">
                          {prescriptions.map((rx) => (
                            <button
                              key={rx.id}
                              className="w-full text-left px-3 py-2 hover:bg-muted/50 text-sm transition-colors"
                              onClick={() => { setSelectedRx(rx); setShowRxDropdown(false); }}
                            >
                              <div className="font-medium">
                                OD SPH: {rx.odSph ?? "-"} CYL: {rx.odCyl ?? "-"} &nbsp;|&nbsp; OS SPH: {rx.osSph ?? "-"} CYL: {rx.osCyl ?? "-"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                PD: {rx.pd ?? "-"} mm • {new Date(rx.createdAt).toLocaleDateString("id-ID")}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Keranjang Belanja ── */}
          <Card className="shadow-sm flex-1 flex flex-col min-h-[250px] overflow-visible">
            <CardHeader className="py-3 border-b border-border">
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm font-medium">Keranjang Belanja</CardTitle>
                <div className="flex items-center gap-2 relative" ref={itemRef}>
                  <div className="relative">
                    <Input
                      placeholder="Scan SKU / Cari Barang..."
                      className="w-64 h-8"
                      tabIndex={3}
                      value={itemSearch}
                      onChange={(e) => { setItemSearch(e.target.value); setShowItemDropdown(true); }}
                      onFocus={() => setShowItemDropdown(true)}
                    />
                    {showItemDropdown && (
                      <div className="absolute z-50 top-full right-0 w-80 mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                        {loadingInv ? (
                          <div className="p-3 text-sm text-muted-foreground text-center">Memuat...</div>
                        ) : filteredItems.length === 0 ? (
                          <div className="p-3 text-sm text-muted-foreground text-center">Tidak ditemukan / stok habis</div>
                        ) : (
                          filteredItems.map((item) => (
                            <button
                              key={item.id}
                              className="w-full text-left px-3 py-2 hover:bg-muted/50 text-sm transition-colors flex justify-between items-center"
                              onClick={() => addToCart(item)}
                            >
                              <div>
                                <div className="font-medium">{item.name}</div>
                                <div className="text-xs text-muted-foreground">{item.sku} • Stok: {item.stock}</div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium">Rp {fmt(item.price)}</div>
                                <div className="text-xs text-muted-foreground">{item.category}</div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground">
                  <ShoppingCart className="h-10 w-10 mb-2 opacity-20" />
                  <p className="text-sm">Keranjang kosong — cari barang di atas</p>
                </div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-muted/50 border-b border-border sticky top-0">
                    <tr>
                      <th className="px-4 py-2 font-semibold">Barang</th>
                      <th className="px-4 py-2 font-semibold w-28">Harga</th>
                      <th className="px-4 py-2 font-semibold w-20 text-center">Qty</th>
                      <th className="px-4 py-2 font-semibold w-28 text-right">Subtotal</th>
                      <th className="px-4 py-2 font-semibold w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {cart.map((ci) => (
                      <tr key={ci.inventoryItemId} className="hover:bg-muted/50">
                        <td className="px-4 py-3">
                          <div className="font-medium">{ci.name}</div>
                          <div className="text-xs text-muted-foreground">{ci.sku}</div>
                        </td>
                        <td className="px-4 py-3">Rp {fmt(ci.unitPrice)}</td>
                        <td className="px-4 py-3 text-center">
                          <Input
                            type="number"
                            min={1}
                            max={ci.maxStock}
                            value={ci.quantity}
                            onChange={(e) => updateQty(ci.inventoryItemId, Number(e.target.value))}
                            className="w-16 h-8 text-center mx-auto"
                          />
                        </td>
                        <td className="px-4 py-3 text-right font-medium">Rp {fmt(ci.unitPrice * ci.quantity)}</td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost" size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => removeFromCart(ci.inventoryItemId)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ════════════════════════════════════════════
            Kolom Kanan: Rincian Pembayaran
           ════════════════════════════════════════════ */}
        <div className="flex flex-col">
          <Card className="shadow-sm flex-1 flex flex-col">
            <CardHeader className="py-3 bg-muted/30">
              <CardTitle className="text-sm font-medium">Rincian Pembayaran</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4 p-4">
              <div className="space-y-3 flex-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Item ({cart.length})</span>
                  <span className="font-medium">Rp {fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-muted-foreground">Diskon</span>
                  <Input
                    type="number"
                    min={0}
                    placeholder="0"
                    className="w-32 h-8 text-right"
                    tabIndex={7}
                    value={discount || ""}
                    onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                  />
                </div>
                <div className="pt-3 border-t border-border mt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg">Total</span>
                    <span className="font-bold text-2xl text-primary">Rp {fmt(total)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-border">
                <div className="space-y-2">
                  <Label htmlFor="payment_amount">Jumlah Bayar</Label>
                  <Input
                    id="payment_amount"
                    type="number"
                    className="text-lg h-12 font-bold"
                    tabIndex={8}
                    placeholder="Rp 0"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Kembalian</span>
                  <span className={`font-medium ${change > 0 ? "text-green-600" : ""}`}>
                    Rp {fmt(change)}
                  </span>
                </div>

                {/* validation hints */}
                {cart.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center">Keranjang masih kosong</p>
                )}
                {cart.length > 0 && paid < total && paid > 0 && (
                  <p className="text-xs text-destructive text-center">Jumlah bayar kurang dari total</p>
                )}

                <Button
                  size="lg"
                  className="w-full h-12 text-lg font-bold mt-2"
                  tabIndex={9}
                  disabled={cart.length === 0 || paid < total || processing}
                  onClick={handlePayment}
                >
                  {processing ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Memproses...</>
                  ) : (
                    "Proses Pembayaran"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          Success Dialog
         ══════════════════════════════════════════════ */}
      <Dialog open={successDialog} onOpenChange={setSuccessDialog}>
        <DialogContent className="sm:max-w-sm text-center">
          <DialogHeader>
            <DialogTitle className="text-center">Transaksi Berhasil!</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <p className="font-bold text-lg">{successInvoice}</p>
              <p className="text-sm text-muted-foreground mt-1">Nota telah disimpan ke database</p>
            </div>
          </div>
          <DialogFooter className="sm:justify-center gap-2">
            <DialogClose render={<Button variant="outline" />}>
              Tutup
            </DialogClose>
            <Button onClick={() => { setSuccessDialog(false); router.push("/reports"); }}>
              Lihat Laporan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
