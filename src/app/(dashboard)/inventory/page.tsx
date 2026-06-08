"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Plus, Search, Filter, Loader2, Pencil, Trash2 } from "lucide-react";

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = ["Frame", "Lensa", "Softlens", "Aksesoris"] as const;

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID").format(n);
}

export default function InventoryPage() {
  /* ── state ── */
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  // form fields (shared for add)
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [formError, setFormError] = useState("");

  // edit fields
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editSku, setEditSku] = useState("");
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editStock, setEditStock] = useState("");
  const [editError, setEditError] = useState("");

  /* ── fetch ── */
  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch("/api/inventory");
      const data = await res.json();
      setItems(data);
    } catch {
      console.error("Failed to fetch inventory");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  /* ── add item ── */
  const resetForm = () => {
    setSku("");
    setName("");
    setCategory("");
    setPrice("");
    setStock("");
    setFormError("");
  };

  const handleOpenDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!sku.trim() || !name.trim() || !category) {
      setFormError("SKU, Nama, dan Kategori wajib diisi.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: sku.trim(),
          name: name.trim(),
          category,
          price: Number(price) || 0,
          stock: Number(stock) || 0,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setFormError(err.error || "Gagal menyimpan barang.");
        return;
      }

      setDialogOpen(false);
      setLoading(true);
      fetchItems();
    } catch {
      setFormError("Terjadi kesalahan jaringan.");
    } finally {
      setSaving(false);
    }
  };

  /* ── edit item ── */
  const openEditDialog = (item: InventoryItem) => {
    setEditingItem(item);
    setEditSku(item.sku);
    setEditName(item.name);
    setEditCategory(item.category);
    setEditPrice(String(item.price));
    setEditStock(String(item.stock));
    setEditError("");
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError("");
    if (!editingItem) return;

    if (!editSku.trim() || !editName.trim() || !editCategory) {
      setEditError("SKU, Nama, dan Kategori wajib diisi.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/inventory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingItem.id,
          sku: editSku.trim(),
          name: editName.trim(),
          category: editCategory,
          price: Number(editPrice) || 0,
          stock: Number(editStock) || 0,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setEditError(err.error || "Gagal menyimpan perubahan.");
        return;
      }

      setEditDialogOpen(false);
      setEditingItem(null);
      setLoading(true);
      fetchItems();
    } catch {
      setEditError("Terjadi kesalahan jaringan.");
    } finally {
      setSaving(false);
    }
  };

  /* ── delete item ── */
  const openDeleteDialog = (item: InventoryItem) => {
    setEditingItem(item);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!editingItem) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/inventory?id=${editingItem.id}`, { method: "DELETE" });
      if (!res.ok) { alert("Gagal menghapus barang."); return; }
      setDeleteDialogOpen(false);
      setEditingItem(null);
      setLoading(true);
      fetchItems();
    } catch { alert("Kesalahan jaringan."); } finally { setDeleting(false); }
  };

  /* ── filter + search ── */
  const filtered = items.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      filterCategory === "all" ||
      item.category.toLowerCase() === filterCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  /* ── render ── */
  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary">Inventaris</h2>
          <p className="text-muted-foreground">Kelola stok Frame, Lensa, Softlens, dan Aksesoris.</p>
        </div>
        <Button onClick={handleOpenDialog}>
          <Plus className="mr-2 h-4 w-4" /> Tambah Barang
        </Button>
      </div>

      {/* ── Table ── */}
      <Card className="flex-1 flex flex-col shadow-sm">
        <CardHeader className="py-4 border-b border-border">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex flex-1 gap-2 max-w-sm">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Cari nama atau SKU..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filterCategory} onValueChange={(val) => setFilterCategory(val ?? "all")}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  <SelectItem value="frame">Frame</SelectItem>
                  <SelectItem value="lensa">Lensa</SelectItem>
                  <SelectItem value="softlens">Softlens</SelectItem>
                  <SelectItem value="aksesoris">Aksesoris</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Memuat data...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <p>Belum ada barang.</p>
              <Button variant="link" onClick={handleOpenDialog} className="mt-2">
                Tambah barang pertama
              </Button>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/50 border-b border-border sticky top-0">
                <tr>
                  <th className="px-6 py-3 font-semibold">SKU</th>
                  <th className="px-6 py-3 font-semibold">Nama Barang</th>
                  <th className="px-6 py-3 font-semibold">Kategori</th>
                  <th className="px-6 py-3 font-semibold">Harga Jual</th>
                  <th className="px-6 py-3 font-semibold text-center">Stok</th>
                  <th className="px-6 py-3 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4">{item.sku}</td>
                    <td className="px-6 py-4 font-medium">{item.name}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">Rp {formatRupiah(item.price)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`font-bold ${item.stock < 5 ? "text-destructive" : ""}`}>
                        {item.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(item)}>
                        <Pencil className="mr-1 h-3 w-3" /> Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => openDeleteDialog(item)}>
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

      {/* ── Dialog Tambah Barang ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Barang Baru</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="add-sku">SKU <span className="text-destructive">*</span></Label>
              <Input
                id="add-sku"
                placeholder="FRM-001"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                autoFocus
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="add-name">Nama Barang <span className="text-destructive">*</span></Label>
              <Input
                id="add-name"
                placeholder="RayBan Clubmaster"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="add-category">Kategori <span className="text-destructive">*</span></Label>
              <Select value={category} onValueChange={(val) => setCategory(val ?? "")}>
                <SelectTrigger id="add-category">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="add-price">Harga Jual (Rp)</Label>
                <Input
                  id="add-price"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="add-stock">Stok Awal</Label>
                <Input
                  id="add-stock"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                />
              </div>
            </div>

            {formError && (
              <p className="text-sm text-destructive text-center">{formError}</p>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <DialogClose render={<Button type="button" variant="outline" />}>
                Batal
              </DialogClose>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</>
                ) : (
                  "Simpan"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Dialog Edit Barang ── */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Barang</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="edit-sku">SKU <span className="text-destructive">*</span></Label>
              <Input
                id="edit-sku"
                placeholder="FRM-001"
                value={editSku}
                onChange={(e) => setEditSku(e.target.value)}
                autoFocus
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nama Barang <span className="text-destructive">*</span></Label>
              <Input
                id="edit-name"
                placeholder="RayBan Clubmaster"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-category">Kategori <span className="text-destructive">*</span></Label>
              <Select value={editCategory} onValueChange={(val) => setEditCategory(val ?? "")}>
                <SelectTrigger id="edit-category">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-price">Harga Jual (Rp)</Label>
                <Input
                  id="edit-price"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-stock">Stok</Label>
                <Input
                  id="edit-stock"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={editStock}
                  onChange={(e) => setEditStock(e.target.value)}
                />
              </div>
            </div>

            {editError && (
              <p className="text-sm text-destructive text-center">{editError}</p>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <DialogClose render={<Button type="button" variant="outline" />}>
                Batal
              </DialogClose>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</>
                ) : (
                  "Simpan Perubahan"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Dialog Hapus Barang ── */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Barang</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <p className="text-sm">
              Apakah Anda yakin ingin menghapus <strong>{editingItem?.name}</strong> ({editingItem?.sku})?
            </p>
            <p className="text-sm text-destructive">
              Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose render={<Button type="button" variant="outline" />}>Batal</DialogClose>
            <Button variant="destructive" disabled={deleting} onClick={handleDelete}>
              {deleting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menghapus...</> : "Ya, Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
