import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import { Users, Search } from "lucide-react";

function ContactList() {
  const { getAllContacts, allContacts, setSelectedUser, isUsersLoading } =
    useChatStore();
  const { onlineUsers, authUser } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (authUser) {
      getAllContacts();
    }
  }, [authUser]);

  if (isUsersLoading) return <UsersLoadingSkeleton />;

  // Filter contacts by search term
  const filtered = allContacts.filter((c) =>
    c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-2">
      {/* Search bar — only shown when there are contacts */}
      {allContacts.length > 0 && (
        <div className="relative mb-3">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search contacts..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-900/60 border border-slate-700/60 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
          />
        </div>
      )}

      {/* Empty state — no users registered at all */}
      {allContacts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
          <div className="w-14 h-14 bg-slate-800/80 rounded-full flex items-center justify-center">
            <Users className="w-7 h-7 text-slate-500" />
          </div>
          <div>
            <h4 className="text-slate-300 font-medium text-sm">No contacts yet</h4>
            <p className="text-slate-500 text-xs mt-1 px-4">
              Other users will appear here once they sign up
            </p>
          </div>
        </div>
      )}

      {/* Empty state — search returned no results */}
      {allContacts.length > 0 && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
          <Search className="w-6 h-6 text-slate-600" />
          <p className="text-slate-500 text-xs">
            No contacts match &quot;{searchTerm}&quot;
          </p>
        </div>
      )}

      {filtered.map((contact) => {
        const isOnline = onlineUsers?.some(
          (id) => id?.toString() === contact._id.toString()
        );

        return (
          <div
            key={contact._id}
            onClick={() => setSelectedUser(contact)}
            className="group p-3 lg:p-4 rounded-xl cursor-pointer transition-all duration-200 border border-transparent bg-gradient-to-r from-cyan-500/5 to-transparent hover:from-cyan-500/15 hover:to-cyan-500/5 hover:border-cyan-500/20"
          >
            <div className="flex items-center gap-3">
              <div className={`avatar ${isOnline ? "online" : "offline"}`}>
                <div className="w-10 lg:w-11 rounded-full ring-2 ring-slate-700/50 group-hover:ring-cyan-500/30 transition-all">
                  <img
                    src={contact.profilePic || "/avatar.png"}
                    alt={contact.fullName}
                    className="rounded-full"
                  />
                </div>
              </div>
              <div className="min-w-0">
                <h4 className="text-slate-100 font-medium text-sm truncate group-hover:text-cyan-100 transition-colors">
                  {contact.fullName}
                </h4>
                <p className={`text-xs truncate ${isOnline ? "text-green-400/80" : "text-slate-500"}`}>
                  {isOnline ? "● Online" : contact.email}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ContactList;
