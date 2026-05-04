"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { trpc } from "../../app/_trpc/client";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type LockInfo = {
  rowid: number;
  lockcd: string;
  lockdt: string;
  sts: string;
};

type UnitNode = {
  untcd: string;
  untnm: string;
  lock: LockInfo | null;
};

type CityNode = {
  ctycd: string;
  ctynm: string;
  units: UnitNode[];
};

type StateNode = {
  stcd: string;
  stnm: string;
  cities: CityNode[];
};

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ toast }: { toast: { type: "success" | "error"; msg: string } | null }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className={`fixed top-4 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium shadow-lg border
            ${toast.type === "success" ? "bg-white border-green-200 text-green-700" : "bg-white border-red-200 text-red-600"}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${toast.type === "success" ? "bg-green-500" : "bg-red-500"}`} />
          {toast.msg}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Checkbox ─────────────────────────────────────────────────────────────────

function Checkbox({
  checked,
  indeterminate,
  onChange,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      className={cn(
        "w-4 h-4 rounded flex items-center justify-center border -shrink-0 transition-all duration-150",
        checked
          ? "bg-[#1a1a1a] border-[#1a1a1a]"
          : indeterminate
          ? "bg-[#1a1a1a]/10 border-[#1a1a1a]/40"
          : "bg-white border-[#D0CEC9] hover:border-[#999]"
      )}
    >
      {checked && (
        <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1.5 5l2.5 2.5 4.5-4" />
        </svg>
      )}
      {!checked && indeterminate && (
        <div className="w-2 h-0.5 bg-[#1a1a1a]/60 rounded-full" />
      )}
    </button>
  );
}

// ─── Chevron ──────────────────────────────────────────────────────────────────

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="11" height="11" viewBox="0 0 12 12" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      className={cn("transition-transform duration-200 shrink-0 text-[#bbb]", open && "rotate-90")}
    >
      <path d="M4 2l4 4-4 4" />
    </svg>
  );
}

// ─── Tree ─────────────────────────────────────────────────────────────────────

function TreeView({
  tree,
  selected,
  onToggleUnit,
  onToggleCity,
  onToggleState,
  onToggleAll,
}: {
  tree: StateNode[];
  selected: Set<string>;
  onToggleUnit: (untcd: string) => void;
  onToggleCity: (city: CityNode) => void;
  onToggleState: (state: StateNode) => void;
  onToggleAll: () => void;
}) {
  const [openStates, setOpenStates] = useState<Set<string>>(new Set());
  const [openCities, setOpenCities] = useState<Set<string>>(new Set());

  const allUntcds = tree.flatMap((s) => s.cities.flatMap((c) => c.units.map((u) => u.untcd)));
  const allChecked = allUntcds.length > 0 && allUntcds.every((id) => selected.has(id));
  const someChecked = allUntcds.some((id) => selected.has(id)) && !allChecked;

  const toggleStateOpen = (stcd: string) =>
    setOpenStates((prev) => { const n = new Set(prev); n.has(stcd) ? n.delete(stcd) : n.add(stcd); return n; });
  const toggleCityOpen = (ctycd: string) =>
    setOpenCities((prev) => { const n = new Set(prev); n.has(ctycd) ? n.delete(ctycd) : n.add(ctycd); return n; });

  return (
    <div className="flex flex-col gap-0.5 select-none">
      {/* All Locations */}
      <div
        className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-[#F5F4F0] cursor-pointer"
        onClick={onToggleAll}
      >
        <div className="w-3 shrink-0" />
        <Checkbox checked={allChecked} indeterminate={someChecked} onChange={onToggleAll} />
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round">
          <path d="M2 4h12M2 8h12M2 12h12" />
        </svg>
        <span className="text-sm font-semibold text-[#1a1a1a]">All Locations</span>
        <span className="text-xs text-[#ccc] ml-auto">{allUntcds.length} units</span>
      </div>

      {/* States */}
      {tree.map((state) => {
        const stateUntcds = state.cities.flatMap((c) => c.units.map((u) => u.untcd));
        const stateChecked = stateUntcds.length > 0 && stateUntcds.every((id) => selected.has(id));
        const stateIndeterminate = stateUntcds.some((id) => selected.has(id)) && !stateChecked;
        const stateOpen = openStates.has(state.stcd);
        const validCities = state.cities.filter((c) => c.units.length > 0);
        if (validCities.length === 0) return null;

        return (
          <div key={state.stcd} className="ml-3">
            <div
              className="flex items-center gap-2 px-2 py-1.5 hover:bg-[#F5F4F0] rounded-lg cursor-pointer"
              onClick={() => toggleStateOpen(state.stcd)}
            >
              <Chevron open={stateOpen} />
              <Checkbox checked={stateChecked} indeterminate={stateIndeterminate} onChange={() => onToggleState(state)} />
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="#f59e0b" strokeWidth="1.4" strokeLinecap="round">
                <path d="M2 3.5h10v8.5H2z" /><path d="M5 3.5V2h4v1.5" />
              </svg>
              <span className="text-sm font-medium text-[#222]">{state.stnm}</span>
              <span className="text-xs text-[#ddd] ml-auto">{stateUntcds.length}</span>
            </div>

            <AnimatePresence initial={false}>
              {stateOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden"
                >
                  <div className="ml-5 border-l border-[#EBEBEB] pl-0.5">
                    {validCities.map((city) => {
                      const cityUntcds = city.units.map((u) => u.untcd);
                      const cityChecked = cityUntcds.every((id) => selected.has(id));
                      const cityIndeterminate = cityUntcds.some((id) => selected.has(id)) && !cityChecked;
                      const cityOpen = openCities.has(city.ctycd);

                      return (
                        <div key={city.ctycd}>
                          <div
                            className="flex items-center gap-2 px-2 py-1.5 hover:bg-[#F5F4F0] rounded-lg cursor-pointer"
                            onClick={() => toggleCityOpen(city.ctycd)}
                          >
                            <Chevron open={cityOpen} />
                            <Checkbox checked={cityChecked} indeterminate={cityIndeterminate} onChange={() => onToggleCity(city)} />
                            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="#3b82f6" strokeWidth="1.4" strokeLinecap="round">
                              <rect x="1" y="5" width="12" height="8" rx="1" /><path d="M4 5V3a3 3 0 0 1 6 0v2" />
                            </svg>
                            <span className="text-sm text-[#333]">{city.ctynm}</span>
                            <span className="text-xs text-[#ddd] ml-auto">{cityUntcds.length}</span>
                          </div>

                          <AnimatePresence initial={false}>
                            {cityOpen && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.12 }}
                                className="overflow-hidden"
                              >
                                <div className="ml-5 border-l border-[#EBEBEB] pl-0.5">
                                  {city.units.map((unit) => (
                                    <div
                                      key={unit.untcd}
                                      className="flex items-center gap-2 px-2 py-1.5 hover:bg-[#F5F4F0] rounded-lg cursor-pointer"
                                      onClick={() => onToggleUnit(unit.untcd)}
                                    >
                                      <div className="w-3 shrink-0" />
                                      <Checkbox checked={selected.has(unit.untcd)} onChange={() => onToggleUnit(unit.untcd)} />
                                      <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="#94a3b8" strokeWidth="1.4" strokeLinecap="round">
                                        <rect x="2" y="4" width="10" height="9" rx="1" /><path d="M5 13V9h4v4M2 7h10" />
                                      </svg>
                                      <span className="text-sm text-[#444]">{unit.untnm}</span>
                                      {unit.lock && (
                                        <span className={cn(
                                          "ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded border shrink-0",
                                          unit.lock.sts === "Lock"
                                            ? "text-red-500 bg-red-50 border-red-200"
                                            : "text-green-600 bg-green-50 border-green-200"
                                        )}>
                                          {unit.lock.sts} · {unit.lock.lockdt.slice(0, 10)}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

// ─── MAIN PANEL ───────────────────────────────────────────────────────────────

export function DateLockPanelContent() {
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [sts, setSts] = useState<"Lock" | "Unlock">("Lock");
  const [date, setDate] = useState("");
  const [dateErr, setDateErr] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const { data: tree = [], refetch, isLoading } = trpc.dateLock.getTree.useQuery();
  const createMutation = trpc.dateLock.create.useMutation();
  const updateMutation = trpc.dateLock.update.useMutation();

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const unitMap = useMemo(() => {
    const map = new Map<string, UnitNode>();
    tree.forEach((s) => s.cities.forEach((c) => c.units.forEach((u) => map.set(u.untcd, u))));
    return map;
  }, [tree]);

  // Pre-select locked units whenever tree data arrives / changes
  useEffect(() => {
    if (tree.length === 0) return;
    const lockedUntcds = new Set<string>();
    tree.forEach((s) => s.cities.forEach((c) => c.units.forEach((u) => {
      if (u.lock?.sts === "Lock") lockedUntcds.add(u.untcd);
    })));
    setSelected(lockedUntcds);
  }, [tree]);

  const allUntcds = useMemo(() => Array.from(unitMap.keys()), [unitMap]);

  const toggleUnit = (untcd: string) =>
    setSelected((prev) => { const n = new Set(prev); n.has(untcd) ? n.delete(untcd) : n.add(untcd); return n; });

  const toggleCity = (city: CityNode) => {
    const ids = city.units.map((u) => u.untcd);
    const allIn = ids.every((id) => selected.has(id));
    setSelected((prev) => { const n = new Set(prev); ids.forEach((id) => allIn ? n.delete(id) : n.add(id)); return n; });
  };

  const toggleState = (state: StateNode) => {
    const ids = state.cities.flatMap((c) => c.units.map((u) => u.untcd));
    const allIn = ids.every((id) => selected.has(id));
    setSelected((prev) => { const n = new Set(prev); ids.forEach((id) => allIn ? n.delete(id) : n.add(id)); return n; });
  };

  const toggleAll = () => {
    const allIn = allUntcds.every((id) => selected.has(id));
    setSelected(allIn ? new Set() : new Set(allUntcds));
  };

  const handleSave = async () => {
    if (!date) { setDateErr(true); return; }
    if (selected.size === 0) { showToast("error", "Select at least one unit"); return; }
    setDateErr(false);
    setSaving(true);

    try {
      await Promise.all(
        Array.from(selected).map((untcd) => {
          const unit = unitMap.get(untcd);
          if (!unit) return Promise.resolve();
          return unit.lock
            ? updateMutation.mutateAsync({ rowid: unit.lock.rowid, lockdt: date, sts })
            : createMutation.mutateAsync({ untcd, lockdt: date, sts });
        })
      );
      showToast("success", `${sts === "Lock" ? "Locked" : "Unlocked"} ${selected.size} unit${selected.size !== 1 ? "s" : ""}`);
      setSelected(new Set());
      refetch();
    } catch (e: unknown) {
      showToast("error", (e as Error).message ?? "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <Toast toast={toast} />

      {/* ── Top form ── */}
      <div className="border border-[#E8E6E1] rounded-xl bg-white overflow-hidden shrink-0">
        <div className="px-4 py-2.5 bg-[#F5F4F0] border-b border-[#E8E6E1]">
          <h2 className="text-sm font-semibold text-[#1a1a1a]">Date Lock Information</h2>
        </div>
        <div className="px-4 py-3 flex flex-col gap-3">
          {/* Status */}
          <div className="flex items-center gap-4">
            <label className="text-sm text-[#666] w-36 shrink-0">Status</label>
            <div className="flex gap-1.5">
              {(["Lock", "Unlock"] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setSts(opt)}
                  className={cn(
                    "h-8 px-4 rounded-lg border text-sm font-medium transition-all duration-150 flex items-center gap-1.5",
                    sts === opt
                      ? opt === "Lock"
                        ? "bg-red-500 border-red-500 text-white shadow-sm"
                        : "bg-green-500 border-green-500 text-white shadow-sm"
                      : "bg-white border-[#E0DEDB] text-[#888] hover:border-[#bbb] hover:text-[#444]"
                  )}
                >
                  {opt === "Lock" ? (
                    <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="6" width="10" height="7" rx="1.5" /><path d="M4.5 6V4a2.5 2.5 0 0 1 5 0v2" />
                    </svg>
                  ) : (
                    <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="6" width="10" height="7" rx="1.5" /><path d="M4.5 6V4a2.5 2.5 0 0 1 3 0" />
                    </svg>
                  )}
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div className="flex items-center gap-4">
            <label className="text-sm text-[#666] w-36 shrink-0">Date Lock As On</label>
            <div className="flex flex-col gap-0.5">
              <input
                type="date"
                value={date}
                onChange={(e) => { setDate(e.target.value); setDateErr(false); }}
                className={cn(
                  "h-8 px-3 text-sm rounded-lg border bg-white text-[#1a1a1a]",
                  "focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#888] transition-all duration-150",
                  dateErr ? "border-red-300 bg-red-50/40" : "border-[#E0DEDB] hover:border-[#bbb]"
                )}
              />
              {dateErr && <p className="text-xs text-red-400 mt-0.5">Date is required</p>}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tree ── */}
      <div className="border border-[#E8E6E1] rounded-xl bg-white flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="px-4 py-2.5 bg-[#F5F4F0] border-b border-[#E8E6E1] flex items-center justify-between shrink-0">
          <h3 className="text-sm font-semibold text-[#1a1a1a]">Applicable On Units</h3>
          {selected.size > 0 && (
            <span className="text-xs text-[#555] bg-white border border-[#E0DEDB] px-2 py-0.5 rounded-full font-medium">
              {selected.size} selected
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin text-[#ccc]" width="18" height="18" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M7 1a6 6 0 1 0 6 6" />
              </svg>
            </div>
          ) : (
            <TreeView
              tree={tree}
              selected={selected}
              onToggleUnit={toggleUnit}
              onToggleCity={toggleCity}
              onToggleState={toggleState}
              onToggleAll={toggleAll}
            />
          )}
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-end gap-2 shrink-0">
        <button
          type="button"
          onClick={() => { setSelected(new Set()); setDate(""); setSts("Lock"); setDateErr(false); }}
          className="h-9 px-5 rounded-lg border border-[#E0DEDB] bg-white text-sm font-medium text-[#555] hover:bg-[#FAFAF9] hover:border-[#bbb] transition-all duration-150"
        >
          Reset
        </button>
        <button
          onClick={handleSave}
          disabled={saving || selected.size === 0 || !date}
          className={cn(
            "h-9 px-5 rounded-lg border text-sm font-medium flex items-center gap-2 transition-all duration-150",
            "bg-[#1a1a1a] border-[#1a1a1a] text-white hover:bg-[#333]",
            "disabled:opacity-40 disabled:cursor-not-allowed"
          )}
        >
          {saving ? (
            <svg className="animate-spin" width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <path d="M7 1a6 6 0 1 0 6 6" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
              <path d="M2 7l3.5 3.5L12 3" />
            </svg>
          )}
          Save
        </button>
      </div>
    </div>
  );
}