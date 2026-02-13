import { XIcon } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";

function ChatHeader() {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const isOnline = onlineUsers.includes(selectedUser._id.toString());
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") setSelectedUser(null);
    };
    window.addEventListener("keydown", handleEscKey);
    //cleanup function
    return () => window.removeEventListener("keydown", handleEscKey);
  }, [setSelectedUser]);
  return (
    <div
      className="flex justify-between items-center bg-gradient-to-r from-slate-800/80 to-slate-900/80 border-b
   border-slate-700/50 h-20 lg:h-24 px-6 lg:px-8 flex-shrink-0 backdrop-blur-md"
    >
      <div className="flex items-center space-x-4">
        <div className={`avatar ${isOnline ? "online" : "offline"}`}>
          <div className="w-11 h-11 lg:w-14 lg:h-14 rounded-full ring-2 ring-slate-700/50 overflow-hidden">
            <img
              src={selectedUser.profilePic || "/avatar.png"}
              alt={selectedUser.fullName}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        <div>
          <h3 className="text-slate-100 font-semibold text-base lg:text-lg max-w-[200px] lg:max-w-[280px] truncate">
            {selectedUser.fullName}
          </h3>
          <p
            className={`text-xs lg:text-sm flex items-center gap-1.5 ${isOnline ? "text-green-400" : "text-slate-500"}`}
          >
            <span
              className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500 animate-pulse" : "bg-slate-500"}`}
            ></span>
            {isOnline ? "Online" : "Offline"}
          </p>
        </div>
      </div>
      <button
        onClick={() => setSelectedUser(null)}
        className="p-2.5 rounded-xl hover:bg-slate-700/50 transition-all duration-200 group"
        title="Close conversation (ESC)"
      >
        <XIcon className="w-5 h-5 lg:w-6 lg:h-6 text-slate-400 group-hover:text-slate-200 transition-colors" />
      </button>
    </div>
  );
}

export default ChatHeader;
