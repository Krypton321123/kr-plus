"use client";
import { Search } from "lucide-react";
import { useState } from "react";

function initials(name: string) {
  return name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
}

const UserPanelTable = ({
  users,
  setSelectUser,
  loading,
  selectedUser,
}: {
  loading: boolean;
  users: any[];
  setSelectUser: any;
  selectedUser: any;
}) => {
  const [query, setQuery] = useState("");

  const filtered = users.filter((u) =>
    u.usrnm.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 bg-white border border-gray-200 border-b-0 rounded-t-xl px-3 py-2.5">
        <Search size={13} className="text-gray-400 shrink-0" />
        <input
          type="text"
          placeholder="Search users..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="text-xs focus:outline-none bg-transparent w-full text-gray-700 placeholder-gray-400"
        />
      </div>

      <div className="border border-gray-200 rounded-b-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center p-5 bg-white">
            <svg className="animate-spin text-gray-300" viewBox="0 0 64 64" fill="none" width="18" height="18">
              <path d="M32 3C35.8083 3 39.5794 3.75011 43.0978 5.20749C46.6163 6.66488 49.8132 8.80101 52.5061 11.4939C55.199 14.1868 57.3351 17.3837 58.7925 20.9022C60.2499 24.4206 61 28.1917 61 32C61 35.8083 60.2499 39.5794 58.7925 43.0978C57.3351 46.6163 55.199 49.8132 52.5061 52.5061C49.8132 55.199 46.6163 57.3351 43.0978 58.7925C39.5794 60.2499 35.8083 61 32 61C28.1917 61 24.4206 60.2499 20.9022 58.7925C17.3837 57.3351 14.1868 55.199 11.4939 52.5061C8.801 49.8132 6.66487 46.6163 5.20749 43.0978C3.7501 39.5794 3 35.8083 3 32C3 28.1917 3.75011 24.4206 5.2075 20.9022C6.66489 17.3837 8.80101 14.1868 11.4939 11.4939C14.1868 8.80099 17.3838 6.66487 20.9022 5.20749C24.4206 3.7501 28.1917 3 32 3Z" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/>
              <path d="M32 3C36.5778 3 41.0906 4.08374 45.1692 6.16256C49.2477 8.24138 52.7762 11.2562 55.466 14.9605C58.1558 18.6647 59.9304 22.9531 60.6448 27.4748C61.3591 31.9965 60.9928 36.6232 59.5759 40.9762" stroke="currentColor" strokeWidth="5" strokeLinecap="round" className="text-gray-900"/>
            </svg>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-4 text-center text-xs text-gray-400 bg-white">No users found</div>
        ) : (
          filtered.map((user: any) => {
            const isActive = selectedUser?.rowid === user.rowid;
            return (
              <button
                key={user.rowid}
                onClick={() => setSelectUser(user)}
                className={`flex items-center gap-2.5 w-full px-3 py-2.5 text-xs text-left border-b border-gray-100 last:border-b-0 transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 ${isActive ? "bg-blue-200 text-blue-800" : "bg-gray-100 text-gray-500"}`}>
                  {initials(user.usrnm)}
                </div>
                <span className={isActive ? "font-medium" : ""}>{user.usrnm}</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default UserPanelTable;