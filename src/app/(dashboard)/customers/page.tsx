"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Search, Plus, Loader2, User, Eye, Trash2, Pencil } from "lucide-react";

/* ── types ── */
interface Customer {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  createdAt: string;
}

interface Prescription {
  id: string;
  customerId: string;
  odSph: number | null;
  odCyl: number | null;
  odAxis: number | null;
  odAdd: number | null;
  odVisus: string | null;
  osSph: number | null;
  osCyl: number | null;
  osAxis: number | null;
  osAdd: number | null;
  osVisus: string | null;
  pd: number | null;
  notes: string | null;
  createdAt: string;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function fmtNum(n: number | null) {
  if (n === null || n === undefined) return "-";
  return n >= 0 ? `+${n.toFixed(2)}` : n.toFixed(2);
}

export default function CustomersPage() {
  /* ── state ── */
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingRx, setLoadingRx] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // dialogs
  const [custDialogOpen, setCustDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [rxDialogOpen, setRxDialogOpen] = useState(false);
  const [editRxDialogOpen, setEditRxDialogOpen] = useState(false);
  const [deleteRxDialogOpen, setDeleteRxDialogOpen] = useState(false);
  const [editingRx, setEditingRx] = useState<Prescription | null>(null);
  const [deletingRx, setDeletingRx] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // customer form
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custAddress, setCustAddress] = useState("");

  // prescription form
  const [odSph, setOdSph] = useState("");
  const [odCyl, setOdCyl] = useState("");
  const [odAxis, setOdAxis] = useState("");
  const [odAdd, setOdAdd] = useState("");
  const [odVisus, setOdVisus] = useState("");
  const [osSph, setOsSph] = useState("");
  const [osCyl, setOsCyl] = useState("");
  const [osAxis, setOsAxis] = useState("");
  const [osAdd, setOsAdd] = useState("");
  const [osVisus, setOsVisus] = useState("");
  const [pd, setPd] = useState("");
  const [rxNotes, setRxNotes] = useState("");

  /* ── fetch customers ── */
  const fetchCustomers = useCallback(async () => {
    setLoadingCustomers(true);
    try {
      const res = await fetch("/api/customers");
      setCustomers(await res.json());
    } catch { /* ignore */ } finally {
      setLoadingCustomers(false);
    }
  }, []);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  /* ── fetch prescriptions for selected customer ── */
  const fetchPrescriptions = useCallback(async (customerId: string) => {
    setLoadingRx(true);
    try {
      const res = await fetch(`/api/prescriptions?customerId=${customerId}`);
      setPrescriptions(await res.json());
    } catch { /* ignore */ } finally {
      setLoadingRx(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId) fetchPrescriptions(selectedId);
    else setPrescriptions([]);
  }, [selectedId, fetchPrescriptions]);

  const selected = customers.find((c) => c.id === selectedId) ?? null;

  /* ── add customer ── */
  const openCustDialog = () => {
    setCustName(""); setCustPhone(""); setCustAddress(""); setFormError("");
    setCustDialogOpen(true);
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!custName.trim()) { setFormError("Nama wajib diisi."); return; }

    setSaving(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: custName.trim(),
          phone: custPhone.trim() || null,
          address: custAddress.trim() || null,
        }),
      });
      if (!res.ok) { setFormError((await res.json()).error || "Gagal menyimpan."); return; }
      const created: Customer = await res.json();
      setCustDialogOpen(false);
      await fetchCustomers();
      setSelectedId(created.id);
    } catch { setFormError("Kesalahan jaringan."); } finally { setSaving(false); }
  };

  /* ── delete customer ── */
  const handleDeleteCustomer = async () => {
    if (!selectedId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/customers?id=${selectedId}`, { method: "DELETE" });
      if (!res.ok) { alert("Gagal menghapus pelanggan."); return; }
      setDeleteDialogOpen(false);
      setSelectedId(null);
      fetchCustomers();
    } catch { alert("Kesalahan jaringan."); } finally { setDeleting(false); }
  };

  /* ── add prescription ── */
  const openRxDialog = () => {
    setOdSph(""); setOdCyl(""); setOdAxis(""); setOdAdd(""); setOdVisus("");
    setOsSph(""); setOsCyl(""); setOsAxis(""); setOsAdd(""); setOsVisus("");
    setPd(""); setRxNotes(""); setFormError("");
    setRxDialogOpen(true);
  };

  const validateRxForm = () => {
    if (!odSph || !odCyl || !odAxis || !odAdd || !odVisus ||
        !osSph || !osCyl || !osAxis || !osAdd || !osVisus || !pd) {
      setFormError("Semua field kecuali catatan wajib diisi.");
      return false;
    }
    return true;
  };

  const buildRxPayload = () => ({
    odSph: Number(odSph), odCyl: Number(odCyl), odAxis: Number(odAxis),
    odAdd: Number(odAdd), odVisus: odVisus,
    osSph: Number(osSph), osCyl: Number(osCyl), osAxis: Number(osAxis),
    osAdd: Number(osAdd), osVisus: osVisus,
    pd: Number(pd), notes: rxNotes || null,
  });

  const handleAddPrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!selectedId) return;
    if (!validateRxForm()) return;

    setSaving(true);
    try {
      const res = await fetch("/api/prescriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: selectedId, ...buildRxPayload() }),
      });
      if (!res.ok) { setFormError((await res.json()).error || "Gagal menyimpan resep."); return; }
      setRxDialogOpen(false);
      fetchPrescriptions(selectedId);
    } catch { setFormError("Kesalahan jaringan."); } finally { setSaving(false); }
  };

  /* ── edit prescription ── */
  const openEditRxDialog = (rx: Prescription) => {
    setEditingRx(rx);
    setOdSph(rx.odSph != null ? String(rx.odSph) : ""); setOdCyl(rx.odCyl != null ? String(rx.odCyl) : "");
    setOdAxis(rx.odAxis != null ? String(rx.odAxis) : ""); setOdAdd(rx.odAdd != null ? String(rx.odAdd) : "");
    setOdVisus(rx.odVisus ?? "");
    setOsSph(rx.osSph != null ? String(rx.osSph) : ""); setOsCyl(rx.osCyl != null ? String(rx.osCyl) : "");
    setOsAxis(rx.osAxis != null ? String(rx.osAxis) : ""); setOsAdd(rx.osAdd != null ? String(rx.osAdd) : "");
    setOsVisus(rx.osVisus ?? "");
    setPd(rx.pd != null ? String(rx.pd) : ""); setRxNotes(rx.notes ?? "");
    setFormError(""); setEditRxDialogOpen(true);
  };

  const handleEditPrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!editingRx || !selectedId) return;
    if (!validateRxForm()) return;

    setSaving(true);
    try {
      const res = await fetch("/api/prescriptions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingRx.id, ...buildRxPayload() }),
      });
      if (!res.ok) { setFormError((await res.json()).error || "Gagal menyimpan."); return; }
      setEditRxDialogOpen(false); setEditingRx(null);
      fetchPrescriptions(selectedId);
    } catch { setFormError("Kesalahan jaringan."); } finally { setSaving(false); }
  };

  /* ── delete prescription ── */
  const handleDeletePrescription = async () => {
    if (!editingRx || !selectedId) return;
    setDeletingRx(true);
    try {
      const res = await fetch(`/api/prescriptions?id=${editingRx.id}`, { method: "DELETE" });
      if (!res.ok) { alert("Gagal menghapus resep."); return; }
      setDeleteRxDialogOpen(false); setEditingRx(null);
      fetchPrescriptions(selectedId);
    } catch { alert("Kesalahan jaringan."); } finally { setDeletingRx(false); }
  };

  /* ── filter ── */
  const filtered = customers.filter((c) =>
    !searchQuery ||
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.phone ?? "").includes(searchQuery)
  );

  /* ── render ── */
  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary">Pelanggan & Resep</h2>
          <p className="text-muted-foreground">Basis data pelanggan dan riwayat resep kacamata.</p>
        </div>
        <Button onClick={openCustDialog}>
          <Plus className="mr-2 h-4 w-4" /> Tambah Pelanggan
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* ── Left: Customer List ── */}
        <Card className="lg:col-span-1 shadow-sm flex flex-col">
          <CardHeader className="py-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Cari nama / no HP..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-auto">
            {loadingCustomers ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Memuat...
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <User className="h-10 w-10 mb-2 opacity-30" />
                <p className="text-sm">Belum ada pelanggan.</p>
                <Button variant="link" size="sm" onClick={openCustDialog}>Tambah sekarang</Button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filtered.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={`w-full text-left p-4 transition-colors ${
                      selectedId === c.id
                        ? "bg-primary/10 border-l-2 border-l-primary"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="font-medium">{c.name}</div>
                    <div className="text-sm text-muted-foreground mt-1">{c.phone ?? "—"}</div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Right: Detail + Prescriptions ── */}
        <Card className="lg:col-span-2 shadow-sm flex flex-col">
          {!selected ? (
            <CardContent className="flex-1 flex flex-col items-center justify-center text-muted-foreground py-20">
              <Eye className="h-12 w-12 mb-3 opacity-20" />
              <p>Pilih pelanggan dari daftar di samping</p>
            </CardContent>
          ) : (
            <>
              <CardHeader className="py-4 border-b border-border bg-muted/20">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Detail Pelanggan</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="mr-1 h-4 w-4" /> Hapus
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 flex-1 overflow-auto">
                <div className="mb-8">
                  <h3 className="text-xl font-bold mb-1">{selected.name}</h3>
                  <p className="text-muted-foreground">
                    {selected.phone ?? "—"} • Bergabung {fmtDate(selected.createdAt)}
                  </p>
                  {selected.address && (
                    <p className="text-sm text-muted-foreground mt-1">{selected.address}</p>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-border pb-2">
                    <h4 className="font-semibold text-primary">Riwayat Resep</h4>
                    <Button variant="outline" size="sm" onClick={openRxDialog}>
                      <Plus className="mr-1 h-3 w-3" /> Tambah Resep
                    </Button>
                  </div>

                  {loadingRx ? (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin mr-2" /> Memuat resep...
                    </div>
                  ) : prescriptions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">Belum ada resep untuk pelanggan ini.</p>
                      <Button variant="link" size="sm" onClick={openRxDialog}>Tambah resep pertama</Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {prescriptions.map((rx) => (
                        <div key={rx.id} className="bg-muted/20 p-4 rounded-lg border border-border">
                          <div className="flex justify-between items-center mb-3">
                            <p className="text-xs text-muted-foreground">
                              Tanggal: {fmtDate(rx.createdAt)}
                            </p>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => openEditRxDialog(rx)}>
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => { setEditingRx(rx); setDeleteRxDialogOpen(true); }}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="grid md:grid-cols-2 gap-6">
                            {/* OD */}
                            <div>
                              <div className="font-semibold mb-2 text-center bg-primary/10 py-1 rounded text-primary text-sm">
                                Kanan (OD)
                              </div>
                              <div className="space-y-1.5 text-sm">
                                <div className="flex justify-between"><span className="text-muted-foreground">SPH:</span> <span className="font-medium">{fmtNum(rx.odSph)}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">CYL:</span> <span className="font-medium">{fmtNum(rx.odCyl)}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">AXIS:</span> <span className="font-medium">{rx.odAxis ?? "-"}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">ADD:</span> <span className="font-medium">{fmtNum(rx.odAdd)}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Visus:</span> <span className="font-medium">{rx.odVisus ?? "-"}</span></div>
                              </div>
                            </div>
                            {/* OS */}
                            <div>
                              <div className="font-semibold mb-2 text-center bg-primary/10 py-1 rounded text-primary text-sm">
                                Kiri (OS)
                              </div>
                              <div className="space-y-1.5 text-sm">
                                <div className="flex justify-between"><span className="text-muted-foreground">SPH:</span> <span className="font-medium">{fmtNum(rx.osSph)}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">CYL:</span> <span className="font-medium">{fmtNum(rx.osCyl)}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">AXIS:</span> <span className="font-medium">{rx.osAxis ?? "-"}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">ADD:</span> <span className="font-medium">{fmtNum(rx.osAdd)}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Visus:</span> <span className="font-medium">{rx.osVisus ?? "-"}</span></div>
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-center border-t border-border pt-3 mt-3">
                            <div className="flex gap-4 text-sm font-medium">
                              <span className="text-muted-foreground">PD:</span> <span>{rx.pd ?? "-"} mm</span>
                            </div>
                          </div>
                          {rx.notes && (
                            <p className="text-xs text-muted-foreground mt-2 italic">Catatan: {rx.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>

      {/* ══════════════════════════════════════════════
          Dialog: Tambah Pelanggan
         ══════════════════════════════════════════════ */}
      <Dialog open={custDialogOpen} onOpenChange={setCustDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Pelanggan Baru</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddCustomer} className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="cust-name">Nama <span className="text-destructive">*</span></Label>
              <Input id="cust-name" placeholder="Nama lengkap" value={custName} onChange={(e) => setCustName(e.target.value)} autoFocus />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cust-phone">No. HP</Label>
              <Input id="cust-phone" placeholder="0812-xxxx-xxxx" value={custPhone} onChange={(e) => setCustPhone(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cust-address">Alamat</Label>
              <Input id="cust-address" placeholder="Alamat (opsional)" value={custAddress} onChange={(e) => setCustAddress(e.target.value)} />
            </div>
            {formError && <p className="text-sm text-destructive text-center">{formError}</p>}
            <DialogFooter className="gap-2 sm:gap-0">
              <DialogClose render={<Button type="button" variant="outline" />}>Batal</DialogClose>
              <Button type="submit" disabled={saving}>
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</> : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════
          Dialog: Tambah Resep
         ══════════════════════════════════════════════ */}
      <Dialog open={rxDialogOpen} onOpenChange={setRxDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tambah Resep — {selected?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddPrescription} className="grid gap-5 py-2">
            {/* OD */}
            <fieldset className="space-y-3">
              <legend className="font-semibold text-sm text-primary bg-primary/10 px-3 py-1 rounded w-full text-center">
                Mata Kanan (OD)
              </legend>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1">
                  <Label htmlFor="rx-od-sph" className="text-xs">SPH <span className="text-destructive">*</span></Label>
                  <Input id="rx-od-sph" type="number" step="0.25" placeholder="-2.00" value={odSph} onChange={(e) => setOdSph(e.target.value)} />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="rx-od-cyl" className="text-xs">CYL <span className="text-destructive">*</span></Label>
                  <Input id="rx-od-cyl" type="number" step="0.25" placeholder="-0.50" value={odCyl} onChange={(e) => setOdCyl(e.target.value)} />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="rx-od-axis" className="text-xs">AXIS <span className="text-destructive">*</span></Label>
                  <Input id="rx-od-axis" type="number" min={0} max={180} placeholder="180" value={odAxis} onChange={(e) => setOdAxis(e.target.value)} />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="rx-od-add" className="text-xs">ADD <span className="text-destructive">*</span></Label>
                  <Input id="rx-od-add" type="number" step="0.25" placeholder="+0.00" value={odAdd} onChange={(e) => setOdAdd(e.target.value)} />
                </div>
              </div>
              <div className="grid gap-1">
                <Label htmlFor="rx-od-visus" className="text-xs">Visus <span className="text-destructive">*</span></Label>
                <Input id="rx-od-visus" placeholder="6/6" value={odVisus} onChange={(e) => setOdVisus(e.target.value)} />
              </div>
            </fieldset>

            {/* OS */}
            <fieldset className="space-y-3">
              <legend className="font-semibold text-sm text-primary bg-primary/10 px-3 py-1 rounded w-full text-center">
                Mata Kiri (OS)
              </legend>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1">
                  <Label htmlFor="rx-os-sph" className="text-xs">SPH <span className="text-destructive">*</span></Label>
                  <Input id="rx-os-sph" type="number" step="0.25" placeholder="-1.75" value={osSph} onChange={(e) => setOsSph(e.target.value)} />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="rx-os-cyl" className="text-xs">CYL <span className="text-destructive">*</span></Label>
                  <Input id="rx-os-cyl" type="number" step="0.25" placeholder="0.00" value={osCyl} onChange={(e) => setOsCyl(e.target.value)} />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="rx-os-axis" className="text-xs">AXIS <span className="text-destructive">*</span></Label>
                  <Input id="rx-os-axis" type="number" min={0} max={180} placeholder="0" value={osAxis} onChange={(e) => setOsAxis(e.target.value)} />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="rx-os-add" className="text-xs">ADD <span className="text-destructive">*</span></Label>
                  <Input id="rx-os-add" type="number" step="0.25" placeholder="+0.00" value={osAdd} onChange={(e) => setOsAdd(e.target.value)} />
                </div>
              </div>
              <div className="grid gap-1">
                <Label htmlFor="rx-os-visus" className="text-xs">Visus <span className="text-destructive">*</span></Label>
                <Input id="rx-os-visus" placeholder="6/6" value={osVisus} onChange={(e) => setOsVisus(e.target.value)} />
              </div>
            </fieldset>

            {/* PD + Notes */}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1">
                <Label htmlFor="rx-pd" className="text-xs">PD (mm) <span className="text-destructive">*</span></Label>
                <Input id="rx-pd" type="number" step="0.5" placeholder="62" value={pd} onChange={(e) => setPd(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-1">
              <Label htmlFor="rx-notes" className="text-xs">Catatan</Label>
              <Input id="rx-notes" placeholder="Catatan tambahan (opsional)" value={rxNotes} onChange={(e) => setRxNotes(e.target.value)} />
            </div>

            {formError && <p className="text-sm text-destructive text-center">{formError}</p>}

            <DialogFooter className="gap-2 sm:gap-0">
              <DialogClose render={<Button type="button" variant="outline" />}>Batal</DialogClose>
              <Button type="submit" disabled={saving}>
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</> : "Simpan Resep"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* ══════════════════════════════════════════════
          Dialog: Hapus Pelanggan
         ══════════════════════════════════════════════ */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Pelanggan</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <p className="text-sm">
              Apakah Anda yakin ingin menghapus pelanggan <strong>{selected?.name}</strong>?
            </p>
            <p className="text-sm text-destructive">
              Semua data resep pelanggan ini juga akan ikut terhapus. Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose render={<Button type="button" variant="outline" />}>Batal</DialogClose>
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={handleDeleteCustomer}
            >
              {deleting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menghapus...</> : "Ya, Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════
          Dialog: Edit Resep
         ══════════════════════════════════════════════ */}
      <Dialog open={editRxDialogOpen} onOpenChange={setEditRxDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Resep — {selected?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditPrescription} className="grid gap-5 py-2">
            <fieldset className="space-y-3">
              <legend className="font-semibold text-sm text-primary bg-primary/10 px-3 py-1 rounded w-full text-center">Mata Kanan (OD)</legend>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1"><Label className="text-xs">SPH <span className="text-destructive">*</span></Label><Input type="number" step="0.25" value={odSph} onChange={(e) => setOdSph(e.target.value)} /></div>
                <div className="grid gap-1"><Label className="text-xs">CYL <span className="text-destructive">*</span></Label><Input type="number" step="0.25" value={odCyl} onChange={(e) => setOdCyl(e.target.value)} /></div>
                <div className="grid gap-1"><Label className="text-xs">AXIS <span className="text-destructive">*</span></Label><Input type="number" min={0} max={180} value={odAxis} onChange={(e) => setOdAxis(e.target.value)} /></div>
                <div className="grid gap-1"><Label className="text-xs">ADD <span className="text-destructive">*</span></Label><Input type="number" step="0.25" value={odAdd} onChange={(e) => setOdAdd(e.target.value)} /></div>
              </div>
              <div className="grid gap-1"><Label className="text-xs">Visus <span className="text-destructive">*</span></Label><Input value={odVisus} onChange={(e) => setOdVisus(e.target.value)} /></div>
            </fieldset>
            <fieldset className="space-y-3">
              <legend className="font-semibold text-sm text-primary bg-primary/10 px-3 py-1 rounded w-full text-center">Mata Kiri (OS)</legend>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1"><Label className="text-xs">SPH <span className="text-destructive">*</span></Label><Input type="number" step="0.25" value={osSph} onChange={(e) => setOsSph(e.target.value)} /></div>
                <div className="grid gap-1"><Label className="text-xs">CYL <span className="text-destructive">*</span></Label><Input type="number" step="0.25" value={osCyl} onChange={(e) => setOsCyl(e.target.value)} /></div>
                <div className="grid gap-1"><Label className="text-xs">AXIS <span className="text-destructive">*</span></Label><Input type="number" min={0} max={180} value={osAxis} onChange={(e) => setOsAxis(e.target.value)} /></div>
                <div className="grid gap-1"><Label className="text-xs">ADD <span className="text-destructive">*</span></Label><Input type="number" step="0.25" value={osAdd} onChange={(e) => setOsAdd(e.target.value)} /></div>
              </div>
              <div className="grid gap-1"><Label className="text-xs">Visus <span className="text-destructive">*</span></Label><Input value={osVisus} onChange={(e) => setOsVisus(e.target.value)} /></div>
            </fieldset>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1"><Label className="text-xs">PD (mm) <span className="text-destructive">*</span></Label><Input type="number" step="0.5" value={pd} onChange={(e) => setPd(e.target.value)} /></div>
            </div>
            <div className="grid gap-1"><Label className="text-xs">Catatan</Label><Input placeholder="Catatan tambahan (opsional)" value={rxNotes} onChange={(e) => setRxNotes(e.target.value)} /></div>
            {formError && <p className="text-sm text-destructive text-center">{formError}</p>}
            <DialogFooter className="gap-2 sm:gap-0">
              <DialogClose render={<Button type="button" variant="outline" />}>Batal</DialogClose>
              <Button type="submit" disabled={saving}>
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</> : "Simpan Perubahan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════
          Dialog: Hapus Resep
         ══════════════════════════════════════════════ */}
      <Dialog open={deleteRxDialogOpen} onOpenChange={setDeleteRxDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Resep</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <p className="text-sm">
              Apakah Anda yakin ingin menghapus resep tanggal <strong>{editingRx ? fmtDate(editingRx.createdAt) : ""}</strong>?
            </p>
            <p className="text-sm text-destructive">Tindakan ini tidak dapat dibatalkan.</p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose render={<Button type="button" variant="outline" />}>Batal</DialogClose>
            <Button variant="destructive" disabled={deletingRx} onClick={handleDeletePrescription}>
              {deletingRx ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menghapus...</> : "Ya, Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
