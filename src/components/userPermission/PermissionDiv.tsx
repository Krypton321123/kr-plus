"use client";
import { useState } from "react";
import { ChevronRight, Eye, EyeOff, CheckCheck } from "lucide-react";
import { trpc } from "@/app/_trpc/client";

type Screen = {
  rowid: number;
  scrid: number;
  scrpntid: number;
  scrnm: string;
  scrtyp: string;
  scrcat: string;
  granted: boolean;
  viewOnly: boolean;
};

type Module = Screen & { children: Screen[] };

type Props = {
  activeTab: string;
  modules: Module[];
  orphans: Screen[];
  userId: number;
};

function ChildItem({
  child,
  userId,
  onMutate,
}: {
  child: Screen;
  userId: number;
  onMutate: () => void;
}) {
  const utils = trpc.useUtils();
  const invalidate = () => { utils.screen.getScreens.invalidate(); onMutate(); };

  const setPermission = trpc.screen.setPermission.useMutation({ onSuccess: invalidate });

  const handleToggle = () => {
    setPermission.mutate({ userId, screenId: child.rowid, grant: !child.granted, viewOnly: false });
  };

  const handleEye = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!child.granted) return;
    setPermission.mutate({ userId, screenId: child.rowid, grant: true, viewOnly: !child.viewOnly });
  };

  const isLoading = setPermission.isPending;

  const containerClass = child.granted
    ? child.viewOnly
      ? "bg-amber-50 border-amber-200"
      : "bg-emerald-50 border-emerald-200"
    : "bg-white border-gray-200 hover:border-gray-300";

  return (
    <div className={`flex items-stretch rounded-lg border overflow-hidden transition-all duration-150 ${containerClass} ${isLoading ? "opacity-60" : ""}`}>
      {/* Checkbox + label */}
      <button
        onClick={handleToggle}
        disabled={isLoading}
        className="flex items-center gap-2 px-3 py-2.5 flex-1 text-left min-w-0"
      >
        <div
          className={`w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center shrink-0 transition-colors ${
            child.granted ? "bg-emerald-500 border-emerald-500" : "border-gray-300"
          }`}
        >
          {child.granted && (
            <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
              <polyline points="2,5 4,7.5 8,2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <span
          className={`text-xs leading-snug truncate ${
            child.granted
              ? child.viewOnly
                ? "text-amber-800 font-medium"
                : "text-emerald-800 font-medium"
              : "text-gray-600"
          }`}
        >
          {child.scrnm}
        </span>
      </button>

      {/* Eye toggle — only interactive when granted */}
      <button
        onClick={handleEye}
        disabled={!child.granted || isLoading}
        title={!child.granted ? "Grant access first" : child.viewOnly ? "Switch to full access" : "Switch to view-only"}
        className={`px-2.5 flex items-center justify-center border-l transition-colors shrink-0 ${
          child.granted
            ? child.viewOnly
              ? "border-amber-200 bg-amber-100 text-amber-700 hover:bg-amber-200"
              : "border-emerald-200 text-emerald-600 hover:bg-emerald-100"
            : "border-gray-100 text-gray-300 cursor-not-allowed"
        }`}
      >
        {child.viewOnly ? <Eye size={12} /> : <EyeOff size={12} />}
      </button>
    </div>
  );
}

function ModuleCard({
  mod,
  userId,
  onMutate,
}: {
  mod: { parent: Screen; children: Screen[] };
  userId: number;
  onMutate: () => void;
}) {
  const [open, setOpen] = useState(false);
  const utils = trpc.useUtils();
  const invalidate = () => { utils.screen.getScreens.invalidate(); onMutate(); };

  const setModule = trpc.screen.setModulePermissions.useMutation({ onSuccess: invalidate });

  const grantedChildren = mod.children.filter((c) => c.granted);
  const allGranted = mod.children.length > 0 && grantedChildren.length === mod.children.length;
  const partGranted = grantedChildren.length > 0 && !allGranted;

  const handleModuleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const childIds = mod.children.map((c) => c.rowid);
    setModule.mutate({ userId, screenIds: childIds, grant: !allGranted });
  };

  const borderClass = allGranted ? "border-emerald-300" : partGranted ? "border-blue-300" : "border-gray-200";
  const headClass = allGranted ? "bg-emerald-50 hover:bg-emerald-100" : partGranted ? "bg-blue-50 hover:bg-blue-100/60" : "bg-white hover:bg-gray-50";
  const nameClass = allGranted ? "text-emerald-800" : partGranted ? "text-blue-800" : "text-gray-800";
  const countClass = allGranted ? "text-emerald-600" : partGranted ? "text-blue-500" : "text-gray-400";
  const cbClass = allGranted ? "bg-emerald-500 border-emerald-500" : partGranted ? "bg-blue-500 border-blue-500" : "border-gray-300";

  return (
    <div className={`border rounded-xl overflow-hidden transition-colors duration-150 ${borderClass}`}>
      <div
        className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${headClass}`}
        onClick={() => setOpen((o) => !o)}
      >
        <button
          onClick={handleModuleToggle}
          disabled={setModule.isPending}
          className={`w-4.25 h-4.25 rounded-lg border-[1.5px] flex items-center justify-center shrink-0 transition-all ${cbClass}`}
        >
          {allGranted && (
            <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
              <polyline points="2,5 4,7.5 8,2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {partGranted && (
            <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
              <line x1="2" y1="5" x2="8" y2="5" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium leading-tight ${nameClass}`}>{mod.parent.scrnm}</p>
          <p className={`text-xs mt-0.5 ${countClass}`}>
            {grantedChildren.length} of {mod.children.length} screens granted
          </p>
        </div>

        <ChevronRight
          size={14}
          className={`text-gray-400 transition-transform duration-200 shrink-0 ${open ? "rotate-90" : ""}`}
        />
      </div>

      {open && (
        <div className="border-t border-gray-100 bg-gray-50/70 p-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {mod.children.map((child) => (
              <ChildItem key={child.rowid} child={child} userId={userId} onMutate={onMutate} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const PermissionDiv = ({ activeTab, modules, orphans, userId }: Props) => {
  const utils = trpc.useUtils();
  const onMutate = () => utils.screen.getScreens.invalidate();

  const setTabPermissions = trpc.screen.setTabPermissions.useMutation({ onSuccess: onMutate });

  const tabModules = modules
    .filter((m) => m.scrtyp === activeTab && m.children.length > 0)
    .map((m) => ({ parent: m, children: m.children }));

  const tabOrphans = orphans.filter((o) => o.scrtyp === activeTab);

  const syntheticMod = tabOrphans.length > 0
    ? { parent: { rowid: -1, scrid: -1, scrpntid: 0, scrnm: "General", scrtyp: activeTab, scrcat: "Menu", granted: false, viewOnly: false }, children: tabOrphans }
    : null;

  const allMods = [...tabModules, ...(syntheticMod ? [syntheticMod] : [])];
  const allChildren = allMods.flatMap((m) => m.children);
  const grantedCount = allChildren.filter((c) => c.granted).length;
  const allGranted = allChildren.length > 0 && grantedCount === allChildren.length;

  const handleSelectAll = () => {
    const ids = allChildren.map((c) => c.rowid);
    setTabPermissions.mutate({ userId, screenIds: ids, grant: !allGranted });
  };

  if (allMods.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-gray-400">
        No screens in <span className="font-medium ml-1">{activeTab}</span>.
      </div>
    );
  }

  return (
    <div className="p-5 flex flex-col gap-3">
      {/* Tab action bar */}
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-gray-400">
          <span className="font-medium text-blue-600">{grantedCount}</span> of {allChildren.length} screens granted
        </p>
        <button
          onClick={handleSelectAll}
          disabled={setTabPermissions.isPending}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${
            allGranted
              ? "bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100"
              : "bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"
          }`}
        >
          <CheckCheck size={12} />
          {allGranted ? "Deselect all" : "Select all"}
        </button>
      </div>

      {allMods.map((mod) => (
        <ModuleCard key={mod.parent.rowid} mod={mod} userId={userId} onMutate={onMutate} />
      ))}
    </div>
  );
};

export default PermissionDiv;