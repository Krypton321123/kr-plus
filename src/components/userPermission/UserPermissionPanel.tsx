"use client";
import { trpc } from "@/app/_trpc/client";
import { inferProcedureOutput } from "@trpc/server";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import UserPanelTable from "./UserPanelTable";
import PermissionDiv from "./PermissionDiv";
import LocationPermissionDiv from "./LocationsPermissionDiv";
import { usersRouter } from "@/server/routers/usersRouter";

const TAB_CONFIG = ["Masters", "Transactions", "Reports", "Locations"] as const;
type Tab = (typeof TAB_CONFIG)[number];
type User = inferProcedureOutput<typeof usersRouter["getAll"]>[0];

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const UserPermissionPanel = () => {
  const [activeTab, setActiveTab] = useState<Tab>("Masters");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const { data: users, isLoading: loadingUsers } = trpc.users.getAll.useQuery();

  // Screen permissions (Masters / Transactions / Reports tabs)
  const { data: screens, isLoading: screenLoading } =
    trpc.screen.getScreens.useQuery(
      { userId: selectedUser?.rowid },
      { enabled: activeTab !== "Locations" }
    );

  // Location/unit permissions (Locations tab)
  const { data: locationData, isLoading: locationLoading } =
    trpc.unit.getForPermissions.useQuery(
      { userId: selectedUser?.rowid },
      { enabled: activeTab === "Locations" && !!selectedUser }
    );

  // Summary counts for the header
  const allScreenChildren = [
    ...(screens?.modules?.flatMap((m) => m.children) ?? []),
    ...(screens?.orphans ?? []),
  ];
  const totalGranted = allScreenChildren.filter((s) => s.granted).length;
  const totalViewOnly = allScreenChildren.filter((s) => s.viewOnly).length;
  const totalScreens = allScreenChildren.length;

  const allUnits = locationData?.tree?.flatMap((s) => s.cities.flatMap((c) => c.units)) ?? [];
  const totalUnitsGranted = allUnits.filter((u) => u.granted).length;
  const totalUnits = allUnits.length;

  const isLocationTab = activeTab === "Locations";
  const isLoading = isLocationTab ? locationLoading : screenLoading;

  return (
    <div className="flex p-5 gap-x-4 min-h-screen bg-gray-50">
      <div className="w-52 shrink-0">
        <UserPanelTable
          users={users ?? []}
          loading={loadingUsers}
          setSelectUser={setSelectedUser}
          selectedUser={selectedUser}
        />
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-gray-200 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <div className="border-b border-gray-100 flex items-center justify-between pl-5 min-h-14">
          <div className="flex items-center gap-3">
            {selectedUser ? (
              <>
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-semibold shrink-0">
                  {initials(selectedUser.usrnm)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 leading-tight">
                    {selectedUser.usrnm}
                  </p>
                  {!isLoading && (
                    <p className="text-xs text-gray-400">
                      {isLocationTab ? (
                        <>
                          <span className="text-blue-600 font-medium">{totalUnitsGranted}</span> of {totalUnits} depots granted
                        </>
                      ) : (
                        <>
                          {totalGranted} of {totalScreens} granted
                          {totalViewOnly > 0 && (
                            <span className="ml-2 text-amber-500">
                              {totalViewOnly} view-only
                            </span>
                          )}
                        </>
                      )}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 text-gray-400">
                <ShieldCheck size={15} />
                <span className="text-sm">Select a user to manage permissions</span>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex h-full items-stretch">
            {TAB_CONFIG.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 text-sm transition-all border-b-2 h-full ${
                  tab === activeTab
                    ? "text-blue-600 border-blue-500 font-medium"
                    : "text-gray-400 border-transparent hover:text-gray-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {!selectedUser ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 py-16 text-center">
              <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center">
                <ShieldCheck size={20} className="text-gray-300" />
              </div>
              <p className="text-sm text-gray-400 max-w-xs">
                Select a user from the sidebar to view and edit their module permissions.
              </p>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-20">
              <svg
                className="animate-spin text-gray-300"
                viewBox="0 0 64 64"
                fill="none"
                width="24"
                height="24"
              >
                <path
                  d="M32 3C35.8083 3 39.5794 3.75011 43.0978 5.20749C46.6163 6.66488 49.8132 8.80101 52.5061 11.4939C55.199 14.1868 57.3351 17.3837 58.7925 20.9022C60.2499 24.4206 61 28.1917 61 32C61 35.8083 60.2499 39.5794 58.7925 43.0978C57.3351 46.6163 55.199 49.8132 52.5061 52.5061C49.8132 55.199 46.6163 57.3351 43.0978 58.7925C39.5794 60.2499 35.8083 61 32 61C28.1917 61 24.4206 60.2499 20.9022 58.7925C17.3837 57.3351 14.1868 55.199 11.4939 52.5061C8.801 49.8132 6.66487 46.6163 5.20749 43.0978C3.7501 39.5794 3 35.8083 3 32C3 28.1917 3.75011 24.4206 5.2075 20.9022C6.66489 17.3837 8.80101 14.1868 11.4939 11.4939C14.1868 8.80099 17.3838 6.66487 20.9022 5.20749C24.4206 3.7501 28.1917 3 32 3Z"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                <path
                  d="M32 3C36.5778 3 41.0906 4.08374 45.1692 6.16256C49.2477 8.24138 52.7762 11.2562 55.466 14.9605C58.1558 18.6647 59.9304 22.9531 60.6448 27.4748C61.3591 31.9965 60.9928 36.6232 59.5759 40.9762"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinecap="round"
                  className="text-gray-900"
                />
              </svg>
            </div>
          ) : isLocationTab ? (
            locationData?.tree ? (
              <LocationPermissionDiv
                tree={locationData.tree}
                userId={selectedUser.rowid}
              />
            ) : (
              <div className="flex items-center justify-center py-16 text-sm text-gray-400">
                No location data available.
              </div>
            )
          ) : !screens?.modules ? (
            <div className="flex items-center justify-center py-16 text-sm text-gray-400">
              No screen data available.
            </div>
          ) : (
            <PermissionDiv
              activeTab={activeTab}
              modules={screens.modules}
              orphans={screens.orphans}
              userId={selectedUser.rowid}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default UserPermissionPanel;