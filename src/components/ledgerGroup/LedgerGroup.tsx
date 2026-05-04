"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { trpc } from "@/app/_trpc/client";

// ─── Types ────────────────────────────────────────────────────────────────────
type LedgerGroup = {
  rowid: number;
  ledgrpcd: string;
  ledgrplvlcd: string;
  ledgrpnm: string;
  ledgrptyp: string;
  ledgrpid: number;
  ledgrppntid: number;
};

type TreeNode = LedgerGroup & { children: TreeNode[] };

const TYPES = ["INCOME", "EXPENDITURE", "EXPENSE", "LIABILITY"] as const;
type LedgerType = (typeof TYPES)[number];

const TYPE_BADGE: Record<LedgerType, string> = {
  INCOME:      "bg-emerald-100 text-emerald-800",
  EXPENDITURE: "bg-amber-100 text-amber-800",
  EXPENSE:     "bg-red-100 text-red-800",
  LIABILITY:   "bg-violet-100 text-violet-800",
};

// ─── Build tree from flat list ────────────────────────────────────────────────
function buildTree(items: LedgerGroup[]): TreeNode[] {
  const map = new Map<number, TreeNode>();
  items.forEach((item) => map.set(item.ledgrpid, { ...item, children: [] }));

  const roots: TreeNode[] = [];
  map.forEach((node) => {
    if (node.ledgrppntid === 0 || !map.has(node.ledgrppntid)) {
      roots.push(node);
    } else {
      map.get(node.ledgrppntid)!.children.push(node);
    }
  });
  return roots;
}

function findInTree(nodes: TreeNode[], id: number): TreeNode | undefined {
  for (const n of nodes) {
    if (n.ledgrpid === id) return n;
    const found = findInTree(n.children, id);
    if (found) return found;
  }
}

// ─── TreeItem ─────────────────────────────────────────────────────────────────
function TreeItem({
  node,
  depth,
  onSelect,
  selectedId,
  excludeId,
}: {
  node: TreeNode;
  depth: number;
  onSelect: (node: TreeNode) => void;
  selectedId: number | null;
  excludeId?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = node.children.length > 0;
  const isSelected = selectedId === node.ledgrpid;

  if (excludeId !== undefined && node.ledgrpid === excludeId) return null;

  return (
    <div>
      <div
        className={`flex items-center gap-1.5 px-2.5 py-1.5 cursor-pointer text-sm select-none transition-colors
          ${isSelected
            ? "bg-blue-50 text-blue-700 font-medium"
            : "text-slate-700 hover:bg-slate-50"
          }`}
        style={{ paddingLeft: `${depth * 18 + 10}px` }}
        onClick={() => onSelect(node)}
      >
        {/* Expand toggle */}
        <span
          className="w-3.5 text-[10px] text-slate-400 shrink-0 text-center"
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) setExpanded((v) => !v);
          }}
        >
          {hasChildren ? (expanded ? "▾" : "▸") : ""}
        </span>
        <span className="text-sm shrink-0">{hasChildren ? "📁" : "📄"}</span>
        <span className="flex-1 truncate">{node.ledgrpnm}</span>
        <span className="text-[10px] text-slate-400 font-mono shrink-0">
          {node.ledgrplvlcd}
        </span>
      </div>
      {hasChildren && expanded &&
        node.children.map((child) => (
          <TreeItem
            key={child.rowid}
            node={child}
            depth={depth + 1}
            onSelect={onSelect}
            selectedId={selectedId}
            excludeId={excludeId}
          />
        ))}
    </div>
  );
}

// ─── TreeDropdown ─────────────────────────────────────────────────────────────
function TreeDropdown({
  tree,
  selected,
  onSelect,
  excludeId,
}: {
  tree: TreeNode[];
  selected: TreeNode | null;
  onSelect: (node: TreeNode | null) => void;
  excludeId?: number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm
          border border-slate-300 rounded-lg bg-white text-left
          hover:border-blue-400 focus:outline-none focus:border-blue-500
          focus:ring-2 focus:ring-blue-500/10 transition-colors"
      >
        <span className="flex items-center gap-1.5 min-w-0">
          {selected ? (
            <>
              <span>📁</span>
              <span className="truncate font-medium text-slate-800">{selected.ledgrpnm}</span>
              <span className="text-[10px] font-mono text-slate-400 shrink-0">
                {selected.ledgrplvlcd}
              </span>
            </>
          ) : (
            <span className="text-slate-400">— None (Top Level) —</span>
          )}
        </span>
        <span className="text-[10px] text-slate-400 shrink-0">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="absolute z-50 top-[calc(100%+4px)] left-0 w-full min-w-72
          bg-white border border-slate-200 rounded-xl shadow-xl
          max-h-60 overflow-y-auto py-1">
          {/* None / top-level option */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1.5 cursor-pointer text-sm select-none transition-colors
              ${!selected ? "bg-blue-50 text-blue-700 font-medium" : "text-slate-600 hover:bg-slate-50"}`}
            style={{ paddingLeft: "10px" }}
            onClick={() => { onSelect(null); setOpen(false); }}
          >
            <span className="w-3.5" />
            <span>🌐</span>
            <span>— None (Top Level) —</span>
          </div>

          {tree.map((node) => (
            <TreeItem
              key={node.rowid}
              node={node}
              depth={0}
              onSelect={(n) => { onSelect(n); setOpen(false); }}
              selectedId={selected?.ledgrpid ?? null}
              excludeId={excludeId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SearchTable ──────────────────────────────────────────────────────────────
function SearchTable({
  items,
  tree,
  onEdit,
  onDelete,
}: {
  items: LedgerGroup[];
  tree: TreeNode[];
  onEdit: (item: LedgerGroup) => void;
  onDelete: (rowid: number) => void;
}) {
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const findNode = useCallback(
    (id: number) => findInTree(tree, id),
    [tree]
  );

  const filtered = items.filter((item) => {
    const matchQ = item.ledgrpnm.toLowerCase().includes(q.toLowerCase());
    const matchT = typeFilter === "ALL" || item.ledgrptyp === typeFilter;
    return matchQ && matchT;
  });

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex gap-2">
        <input
          className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg
            focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-colors"
          placeholder="Search by name..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white
            focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="ALL">All Types</option>
          {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Code</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Group Name</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Type</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Parent</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Level Code</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400 text-sm">
                  No records found
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const parent = item.ledgrppntid ? findNode(item.ledgrppntid) : null;
                return (
                  <tr key={item.rowid} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{item.ledgrpcd}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{item.ledgrpnm}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold
                        ${TYPE_BADGE[item.ledgrptyp as LedgerType] ?? "bg-slate-100 text-slate-600"}`}>
                        {item.ledgrptyp}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-sm">{parent ? parent.ledgrpnm : "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{item.ledgrplvlcd}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onEdit(item)}
                          className="px-3 py-1 text-xs font-medium rounded-md
                            bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDelete(item.rowid)}
                          className="px-3 py-1 text-xs font-medium rounded-md
                            bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LedgerGroupPage() {
  const utils = trpc.useUtils();
  const { data: items = [], isLoading } = trpc.ledgerGroup.getAll.useQuery();
  const tree = buildTree(items);

  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editRowid, setEditRowid] = useState<number | null>(null);
  const [ledgrpnm, setLedgrpnm] = useState("");
  const [ledgrptyp, setLedgrptyp] = useState<LedgerType>("INCOME");
  const [parentNode, setParentNode] = useState<TreeNode | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const createMutation = trpc.ledgerGroup.create.useMutation({
    onSuccess: () => { utils.ledgerGroup.getAll.invalidate(); resetForm(); flash("✓ Ledger group saved successfully."); },
    onError: (e: any) => setError(e.message),
  });

  const updateMutation = trpc.ledgerGroup.update.useMutation({
    onSuccess: () => { utils.ledgerGroup.getAll.invalidate(); resetForm(); flash("✓ Ledger group updated successfully."); },
    onError: (e: any) => setError(e.message),
  });

  const deleteMutation = trpc.ledgerGroup.delete.useMutation({
    onSuccess: () => { utils.ledgerGroup.getAll.invalidate(); flash("✓ Deleted successfully."); },
    onError: (e: any) => setError(e.message),
  });

  function flash(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  }

  function resetForm() {
    setMode("create");
    setEditRowid(null);
    setLedgrpnm("");
    setLedgrptyp("INCOME");
    setParentNode(null);
    setError("");
  }

  function handleEdit(item: LedgerGroup) {
    setMode("edit");
    setEditRowid(item.rowid);
    setLedgrpnm(item.ledgrpnm);
    setLedgrptyp(item.ledgrptyp as LedgerType);
    if (item.ledgrppntid) {
      setParentNode(findInTree(tree, item.ledgrppntid) ?? null);
    } else {
      setParentNode(null);
    }
    setShowSearch(false);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleSave() {
    setError("");
    if (!ledgrpnm.trim()) { setError("Ledger Group Name is required."); return; }

    if (mode === "create") {
      createMutation.mutate({
        ledgrpnm,
        ledgrptyp,
        ledgrppntid: parentNode?.ledgrpid ?? 0,
      });
    } else if (editRowid !== null) {
      updateMutation.mutate({ rowid: editRowid, ledgrpnm, ledgrptyp });
    }
  }

  function handleDelete(rowid: number) {
    if (confirm("Delete this ledger group? This cannot be undone.")) {
      deleteMutation.mutate({ rowid });
    }
  }

  const isBusy = createMutation.isPending || updateMutation.isPending;
  const editingLedgrpid = mode === "edit" && editRowid
    ? items.find((i: any) => i.rowid === editRowid)?.ledgrpid
    : undefined;

  // Field style helpers
  const inputBase = "w-full px-3 py-2 text-sm border rounded-lg bg-white text-slate-800 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10";

  return (
    <div className="max-w-7xl mx-auto px-5 py-8 space-y-5">

      {/* Page header */}
      <div className="flex items-center gap-3.5 mb-1">
        <div className="w-1.5 h-10 rounded-full bg-linear-to-b from-blue-600 to-violet-600 shrink-0" />
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Ledger Group Information</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage ledger group hierarchy for accounts classification</p>
        </div>
      </div>

      {/* Success toast */}
      {success && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium">
          {success}
        </div>
      )}

      {/* Form card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
        {/* Card header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 bg-slate-50/70">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Group Details</span>
          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide
            ${mode === "create" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
            {mode === "create" ? "New Entry" : "Editing"}
          </span>
        </div>

        {/* Form body */}
        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm font-medium">
              {error}
            </div>
          )}

          {/* Ledger Group Name */}
          <div className="grid grid-cols-[160px_1fr] items-center gap-4">
            <label className="text-sm font-medium text-slate-600 text-right">
              Ledger Group Name <span className="text-red-500">*</span>
            </label>
            <input
              className={`${inputBase} ${error && !ledgrpnm.trim() ? "border-red-400" : "border-slate-300"}`}
              type="text"
              placeholder="Enter group name..."
              value={ledgrpnm}
              onChange={(e) => setLedgrpnm(e.target.value.toUpperCase())}
            />
          </div>

          {/* Ledger Group Type */}
          <div className="grid grid-cols-[160px_1fr] items-center gap-4">
            <label className="text-sm font-medium text-slate-600 text-right">
              Ledger Group Type <span className="text-red-500">*</span>
            </label>
            <select
              className={`${inputBase} border-slate-300 cursor-pointer appearance-none
                bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236B7280' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")]
                bg-no-repeat bg-position-[right_12px_center] pr-8`}
              value={ledgrptyp}
              onChange={(e) => setLedgrptyp(e.target.value as LedgerType)}
            >
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Under Parent Group */}
          <div className="grid grid-cols-[160px_1fr] items-center gap-4">
            <label className="text-sm font-medium text-slate-600 text-right">
              Under Parent Group
            </label>
            <TreeDropdown
              tree={tree}
              selected={parentNode}
              onSelect={setParentNode}
              excludeId={editingLedgrpid}
            />
          </div>

          {/* Level preview (read-only hint when editing) */}
          {mode === "edit" && editRowid && (() => {
            const cur = items.find((i: any) => i.rowid === editRowid);
            return cur ? (
              <div className="grid grid-cols-[160px_1fr] items-center gap-4">
                <span className="text-sm font-medium text-slate-600 text-right">Level Code</span>
                <span className="px-3 py-2 text-sm font-mono text-slate-500 bg-slate-50 border border-slate-200 rounded-lg">
                  {cur.ledgrplvlcd}
                </span>
              </div>
            ) : null;
          })()}
        </div>

        {/* Button row */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 border-t border-slate-100 bg-slate-50/70">
          {mode === "edit" && (
            <button
              onClick={resetForm}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200
                text-slate-600 bg-white hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={() => setShowSearch((v) => !v)}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200
              text-slate-600 bg-white hover:bg-slate-50 transition-colors flex items-center gap-1.5"
          >
            <span className={`text-[10px] transition-transform ${showSearch ? "rotate-90" : ""}`}>▶</span>
            {showSearch ? "Hide Search" : "Search"}
          </button>
          <button
            onClick={handleSave}
            disabled={isBusy}
            className="px-5 py-2 text-sm font-semibold rounded-lg
              bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800
              disabled:opacity-50 disabled:cursor-not-allowed transition-colors
              flex items-center gap-2"
          >
            {isBusy ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>{mode === "create" ? "💾 Save" : "💾 Update"}</>
            )}
          </button>
        </div>
      </div>

      {/* Search / list card */}
      {showSearch && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm ">
          <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 bg-slate-50/70">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Ledger Groups</span>
            <span className="text-xs text-slate-400">{items.length} records</span>
          </div>
          <div className="p-5">
            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-slate-400 text-sm gap-2">
                <span className="w-5 h-5 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
                Loading...
              </div>
            ) : (
              <SearchTable
                items={items}
                tree={tree}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}