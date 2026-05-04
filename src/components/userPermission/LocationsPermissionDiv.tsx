"use client";
import { useState } from "react";
import { ChevronRight, CheckCheck, MapPin, Building2 } from "lucide-react";
import { trpc } from "@/app/_trpc/client";

// ─── Types ────────────────────────────────────────────────────────────────────

type UnitNode = {
  rowid: number;
  untcd: string;
  untnm: string;
  untshnm: string | null;
  granted: boolean;
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

type Props = {
  tree: StateNode[];
  userId: number;
};

// ─── Unit Chip ────────────────────────────────────────────────────────────────

function UnitChip({
  unit,
  userId,
  onMutate,
}: {
  unit: UnitNode;
  userId: number;
  onMutate: () => void;
}) {
  const utils = trpc.useUtils();
  const invalidate = () => {
    utils.unit.getForPermissions.invalidate();
    onMutate();
  };

  const setPermission = trpc.unit.setPermission.useMutation({
    onSuccess: invalidate,
  });

  const toggle = () =>
    setPermission.mutate({ userId, unitId: unit.rowid, grant: !unit.granted });

  const isLoading = setPermission.isPending;

  return (
    <button
      onClick={toggle}
      disabled={isLoading}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all duration-150 w-full ${
        isLoading ? "opacity-60" : ""
      } ${
        unit.granted
          ? "bg-emerald-50 border-emerald-200"
          : "bg-white border-gray-200 hover:border-gray-300"
      }`}
    >
      {/* Checkbox */}
      <div
        className={`w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center shrink-0 transition-colors ${
          unit.granted ? "bg-emerald-500 border-emerald-500" : "border-gray-300"
        }`}
      >
        {unit.granted && (
          <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
            <polyline
              points="2,5 4,7.5 8,2.5"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>

      <div className="min-w-0">
        <p
          className={`text-xs font-medium leading-tight truncate ${
            unit.granted ? "text-emerald-800" : "text-gray-700"
          }`}
        >
          {unit.untnm}
        </p>
        {unit.untshnm && (
          <p className="text-[10px] text-gray-400 truncate">{unit.untshnm}</p>
        )}
      </div>
    </button>
  );
}

// ─── City Row ─────────────────────────────────────────────────────────────────

function CityRow({
  city,
  userId,
  onMutate,
}: {
  city: CityNode;
  userId: number;
  onMutate: () => void;
}) {
  const [open, setOpen] = useState(false);
  const utils = trpc.useUtils();
  const invalidate = () => {
    utils.unit.getForPermissions.invalidate();
    onMutate();
  };

  const setByCity = trpc.unit.setByCity.useMutation({ onSuccess: invalidate });

  const grantedCount = city.units.filter((u) => u.granted).length;
  const allGranted = city.units.length > 0 && grantedCount === city.units.length;
  const partGranted = grantedCount > 0 && !allGranted;

  const handleCityToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const ids = city.units.map((u) => u.rowid);
    setByCity.mutate({ userId, unitIds: ids, grant: !allGranted });
  };

  const cbClass = allGranted
    ? "bg-emerald-500 border-emerald-500"
    : partGranted
    ? "bg-blue-500 border-blue-500"
    : "border-gray-300";

  const textClass = allGranted
    ? "text-emerald-800"
    : partGranted
    ? "text-blue-700"
    : "text-gray-700";

  const countClass = allGranted
    ? "text-emerald-600"
    : partGranted
    ? "text-blue-400"
    : "text-gray-400";

  return (
    <div className="ml-4 mt-1.5">
      {/* City header row */}
      <div
        className={`flex items-center gap-2.5 cursor-pointer py-1.5 px-2 rounded-lg hover:bg-gray-50 transition-colors group`}
        onClick={() => setOpen((o) => !o)}
      >
        {/* City checkbox */}
        <button
          onClick={handleCityToggle}
          disabled={setByCity.isPending}
          className={`w-3.75 h-3.75 rounded-[3px] border-[1.5px] flex items-center justify-center shrink-0 transition-all ${cbClass}`}
        >
          {allGranted && (
            <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
              <polyline
                points="2,5 4,7.5 8,2.5"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
          {partGranted && (
            <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
              <line x1="2" y1="5" x2="8" y2="5" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        </button>

        <Building2 size={11} className={`shrink-0 ${countClass}`} />

        <span className={`text-xs font-medium flex-1 ${textClass}`}>
          {city.ctynm}
        </span>

        <span className={`text-[10px] mr-1 ${countClass}`}>
          {grantedCount}/{city.units.length}
        </span>

        <ChevronRight
          size={11}
          className={`text-gray-300 shrink-0 transition-transform duration-150 group-hover:text-gray-400 ${
            open ? "rotate-90" : ""
          }`}
        />
      </div>

      {/* Units grid */}
      {open && (
        <div className="ml-5 mt-1.5 mb-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5">
          {city.units.map((unit) => (
            <UnitChip key={unit.rowid} unit={unit} userId={userId} onMutate={onMutate} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── State Card ───────────────────────────────────────────────────────────────

function StateCard({
  state,
  userId,
  onMutate,
}: {
  state: StateNode;
  userId: number;
  onMutate: () => void;
}) {
  const [open, setOpen] = useState(false);
  const utils = trpc.useUtils();
  const invalidate = () => {
    utils.unit.getForPermissions.invalidate();
    onMutate();
  };

  const setByState = trpc.unit.setByState.useMutation({ onSuccess: invalidate });

  const allUnits = state.cities.flatMap((c) => c.units);
  const grantedCount = allUnits.filter((u) => u.granted).length;
  const allGranted = allUnits.length > 0 && grantedCount === allUnits.length;
  const partGranted = grantedCount > 0 && !allGranted;

  const handleStateToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const ids = allUnits.map((u) => u.rowid);
    setByState.mutate({ userId, unitIds: ids, grant: !allGranted });
  };

  const borderClass = allGranted
    ? "border-emerald-300"
    : partGranted
    ? "border-blue-300"
    : "border-gray-200";

  const headClass = allGranted
    ? "bg-emerald-50 hover:bg-emerald-100"
    : partGranted
    ? "bg-blue-50 hover:bg-blue-100/60"
    : "bg-white hover:bg-gray-50";

  const nameClass = allGranted
    ? "text-emerald-800"
    : partGranted
    ? "text-blue-800"
    : "text-gray-800";

  const countClass = allGranted
    ? "text-emerald-600"
    : partGranted
    ? "text-blue-500"
    : "text-gray-400";

  const cbClass = allGranted
    ? "bg-emerald-500 border-emerald-500"
    : partGranted
    ? "bg-blue-500 border-blue-500"
    : "border-gray-300";

  return (
    <div className={`border rounded-xl overflow-hidden transition-colors duration-150 ${borderClass}`}>
      {/* State header */}
      <div
        className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${headClass}`}
        onClick={() => setOpen((o) => !o)}
      >
        {/* State checkbox */}
        <button
          onClick={handleStateToggle}
          disabled={setByState.isPending}
          className={`w-4.25 h-4.25 rounded-lg border-[1.5px] flex items-center justify-center shrink-0 transition-all ${cbClass}`}
        >
          {allGranted && (
            <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
              <polyline
                points="2,5 4,7.5 8,2.5"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
          {partGranted && (
            <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
              <line x1="2" y1="5" x2="8" y2="5" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        </button>

        <MapPin size={13} className={`shrink-0 ${countClass}`} />

        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium leading-tight ${nameClass}`}>
            {state.stnm}
          </p>
          <p className={`text-xs mt-0.5 ${countClass}`}>
            {grantedCount} of {allUnits.length} depots granted
          </p>
        </div>

        <ChevronRight
          size={14}
          className={`text-gray-400 transition-transform duration-200 shrink-0 ${
            open ? "rotate-90" : ""
          }`}
        />
      </div>

      {/* Cities */}
      {open && (
        <div className="border-t border-gray-100 bg-gray-50/60 pb-2">
          {state.cities.map((city) => (
            <CityRow key={city.ctycd} city={city} userId={userId} onMutate={onMutate} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const LocationPermissionDiv = ({ tree, userId }: Props) => {
  const utils = trpc.useUtils();
  const onMutate = () => utils.unit.getForPermissions.invalidate();

  const setByState = trpc.unit.setByState.useMutation({ onSuccess: onMutate });

  const allUnits = tree.flatMap((s) => s.cities.flatMap((c) => c.units));
  const grantedCount = allUnits.filter((u) => u.granted).length;
  const allGranted = allUnits.length > 0 && grantedCount === allUnits.length;

  const handleSelectAll = () => {
    const ids = allUnits.map((u) => u.rowid);
    setByState.mutate({ userId, unitIds: ids, grant: !allGranted });
  };

  if (tree.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-gray-400">
        No depots configured.
      </div>
    );
  }

  return (
    <div className="p-5 flex flex-col gap-3">
      {/* Action bar */}
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-gray-400">
          <span className="font-medium text-blue-600">{grantedCount}</span> of{" "}
          {allUnits.length} depots granted
        </p>
        <button
          onClick={handleSelectAll}
          disabled={setByState.isPending}
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

      {/* State cards */}
      {tree.map((state) => (
        <StateCard key={state.stcd} state={state} userId={userId} onMutate={onMutate} />
      ))}
    </div>
  );
};

export default LocationPermissionDiv;