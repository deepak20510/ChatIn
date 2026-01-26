import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";

function ContactList() {
  const { getAllContacts, allContacts, setSelectedUser, isUsersLoading } =
    useChatStore();

  const { onlineUsers } = useAuthStore();

  useEffect(() => {
    getAllContacts();
  }, [getAllContacts]);

  if (isUsersLoading) return <UsersLoadingSkeleton />;

  return (
    <div className="space-y-2">
      {allContacts.map((contact) => {
        // ✅ SAFE online check (works with ObjectId / string / array)
        const isOnline = onlineUsers?.some(
          (id) => id?.toString() === contact._id.toString(),
        );

        return (
          <div
            key={contact._id}
            onClick={() => setSelectedUser(contact)}
            className="bg-cyan-500/10 p-4 rounded-lg cursor-pointer
                       hover:bg-cyan-500/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              {/* ✅ DaisyUI avatar structure (REQUIRED for dot) */}
              <div className={`avatar ${isOnline ? "online" : "offline"}`}>
                <div className="w-12 rounded-full">
                  <img
                    src={contact.profilePic || "/avatar.png"}
                    alt={contact.fullName}
                  />
                </div>
              </div>

              <h4 className="text-slate-200 font-medium">{contact.fullName}</h4>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ContactList;
