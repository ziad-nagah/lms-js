import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Copy,
  Plus,
  Trash2,
  Ticket,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  Hash,
} from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import CustomAlert from "@/components/global/CustomAlert";

// ── Types ─────────────────────────────────────────────────────────────────────
interface ActivationCode {
  _id: string;
  code: string;
  discount: number;
  isUsed: boolean;
  usedAt?: string;
  usedBy?: { name: string; email: string };
  expiresAt: string;
  generatedBy?: { name: string; email: string };
  status: "active" | "used" | "expired";
  createdAt: string;
}

interface Stats {
  total: number;
  used: number;
  active: number;
  expired: number;
}

interface Pagination {
  total: number;
  page: number;
  pages: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const statusConfig = {
  active: { label: "Active", icon: CheckCircle2, className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  used: { label: "Used", icon: CheckCircle2, className: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  expired: { label: "Expired", icon: XCircle, className: "bg-red-500/15 text-red-400 border-red-500/30" },
};

const StatusBadge = ({ status }: { status: keyof typeof statusConfig }) => {
  const cfg = statusConfig[status];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.className}`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
};

// ── Finance Page ──────────────────────────────────────────────────────────────
const Finance = () => {
  const [codes, setCodes] = useState<ActivationCode[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, used: 0, active: 0, expired: 0 });
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Generate dialog state
  const [isGenOpen, setIsGenOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [expiresAt, setExpiresAt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<ActivationCode[]>([]);

  // Revoke alert state
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [isRevokeOpen, setIsRevokeOpen] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchCodes = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      if (statusFilter !== "all") params.set("status", statusFilter);
      const { data } = await api.get(`/finance/codes?${params}`);
      setCodes(data.codes);
      setStats(data.stats);
      setPagination(data.pagination);
    } catch {
      toast.error("Failed to load codes");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchCodes(); }, [fetchCodes]);

  // ── Generate ───────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!expiresAt) return toast.error("Please set an expiration date");
    try {
      setGenerating(true);
      const { data } = await api.post("/finance/generate", { quantity, expiresAt });
      setLastGenerated(data.codes);
      toast.success(`${data.codes.length} code(s) generated!`);
      fetchCodes();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to generate codes");
    } finally {
      setGenerating(false);
    }
  };

  // ── Revoke ─────────────────────────────────────────────────────────────────
  const confirmRevoke = async () => {
    if (!revokeId) return;
    try {
      await api.delete(`/finance/codes/${revokeId}`);
      toast.success("Code revoked");
      fetchCodes();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to revoke");
    } finally {
      setIsRevokeOpen(false);
      setRevokeId(null);
    }
  };

  // ── Copy ───────────────────────────────────────────────────────────────────
  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Copied: ${code}`);
  };

  // ── Stat cards ─────────────────────────────────────────────────────────────
  const statCards = [
    { label: "Total Generated", value: stats.total, icon: Ticket, color: "text-violet-400", bg: "bg-violet-500/10" },
    { label: "Active", value: stats.active, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Used", value: stats.used, icon: Hash, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Expired", value: stats.expired, icon: Clock, color: "text-red-400", bg: "bg-red-500/10" },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Finance</h1>
          <p className="text-muted-foreground mt-1">
            Generate and manage 100% discount activation codes for students.
          </p>
        </div>
        <Button onClick={() => { setLastGenerated([]); setIsGenOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Generate Codes
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-xl border bg-card p-5 flex items-center gap-4">
              <div className={`p-3 rounded-lg ${s.bg}`}>
                <Icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters + Table */}
      <div className="rounded-xl border bg-card">
        <div className="flex items-center gap-2 p-4 border-b">
          {["all", "active", "used", "expired"].map((f) => (
            <Button
              key={f}
              variant={statusFilter === f ? "default" : "ghost"}
              size="sm"
              onClick={() => setStatusFilter(f)}
              className="capitalize"
            >
              {f}
            </Button>
          ))}
          <Button variant="ghost" size="icon" className="ml-auto" onClick={() => fetchCodes()}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Used By</TableHead>
              <TableHead>Generated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <TableCell key={j}>
                      <div className="h-4 rounded bg-muted animate-pulse w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : codes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                  <Ticket className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  No codes found. Generate some!
                </TableCell>
              </TableRow>
            ) : (
              codes.map((c) => (
                <TableRow key={c._id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="font-mono font-semibold text-primary">{c.code}</code>
                      <button
                        onClick={() => copyCode(c.code)}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{c.discount}% OFF</Badge>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={c.status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(c.expiresAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-sm">
                    {c.usedBy ? (
                      <div>
                        <p className="font-medium">{c.usedBy.name}</p>
                        <p className="text-xs text-muted-foreground">{c.usedBy.email}</p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {!c.isUsed && c.status !== "expired" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        onClick={() => { setRevokeId(c._id); setIsRevokeOpen(true); }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between p-4 border-t text-sm text-muted-foreground">
            <span>Page {pagination.page} of {pagination.pages}</span>
            <div className="flex gap-2">
              <Button
                variant="outline" size="sm"
                disabled={pagination.page <= 1}
                onClick={() => fetchCodes(pagination.page - 1)}
              >Previous</Button>
              <Button
                variant="outline" size="sm"
                disabled={pagination.page >= pagination.pages}
                onClick={() => fetchCodes(pagination.page + 1)}
              >Next</Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Generate Dialog ─────────────────────────────────────────────── */}
      <Dialog open={isGenOpen} onOpenChange={setIsGenOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-primary" />
              Generate Activation Codes
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Number of Codes (max 50)</Label>
              <Input
                type="number"
                min={1}
                max={50}
                value={quantity}
                onChange={(e) => setQuantity(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
              />
            </div>
            <div className="space-y-2">
              <Label>Expiration Date</Label>
              <Input
                type="date"
                value={expiresAt}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>

            <div className="rounded-lg bg-muted/50 border p-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">How it works</p>
              <p>Each code grants a student <strong className="text-primary">100% access</strong> to all LMS content. Codes are single-use and expire on the selected date.</p>
            </div>

            {/* Show last generated codes */}
            {lastGenerated.length > 0 && (
              <div className="space-y-2">
                <Label className="text-emerald-400">✓ Generated — Click to copy</Label>
                <div className="rounded-lg border bg-card p-3 space-y-1.5 max-h-40 overflow-y-auto">
                  {lastGenerated.map((c) => (
                    <div
                      key={c._id}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-pointer group"
                      onClick={() => copyCode(c.code)}
                    >
                      <code className="font-mono text-sm font-semibold text-primary">{c.code}</code>
                      <Copy className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsGenOpen(false)}>Cancel</Button>
            <Button onClick={handleGenerate} disabled={generating}>
              {generating ? (
                <><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Generating...</>
              ) : (
                <><Plus className="mr-2 h-4 w-4" />Generate {quantity} Code{quantity > 1 ? "s" : ""}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Revoke Confirm ─────────────────────────────────────────────── */}
      <CustomAlert
        isOpen={isRevokeOpen}
        setIsOpen={setIsRevokeOpen}
        handleDelete={confirmRevoke}
        title="Revoke Code"
        description="This will permanently delete the code. This action cannot be undone."
      />
    </div>
  );
};

export default Finance;
