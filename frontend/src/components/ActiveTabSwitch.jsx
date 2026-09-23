import { useChatStore } from "../store/useChatStore";
import { MessageSquare, Hash, Users } from "lucide-react";

function ActiveTabSwitch() {
  const { activeTab, setActiveTab } = useChatStore();

  return (
    <div className="flex p-1.5 bg-slate-900/60 rounded-2xl backdrop-blur-md border border-slate-800/80 shadow-inner">
      <button
        onClick={() => setActiveTab("chats")}
        className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
          activeTab === "chats"
            ? "bg-gradient-to-r from-cyan-500/20 to-cyan-600/20 text-cyan-400 shadow-md shadow-cyan-500/10 border border-cyan-500/30"
            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
        }`}
      >
        <span className="flex items-center justify-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          Chats
        </span>
      </button>

      <button
        onClick={() => setActiveTab("rooms")}
        className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
          activeTab === "rooms"
            ? "bg-gradient-to-r from-cyan-500/20 to-cyan-600/20 text-cyan-400 shadow-md shadow-cyan-500/10 border border-cyan-500/30"
            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
        }`}
      >
        <span className="flex items-center justify-center gap-1.5">
          <Hash className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          Rooms
        </span>
      </button>

      <button
        onClick={() => setActiveTab("contacts")}
        className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
          activeTab === "contacts"
            ? "bg-gradient-to-r from-cyan-500/20 to-cyan-600/20 text-cyan-400 shadow-md shadow-cyan-500/10 border border-cyan-500/30"
            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
        }`}
      >
        <span className="flex items-center justify-center gap-1.5">
          <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          Contacts
        </span>
      </button>
    </div>
  );
}

export default ActiveTabSwitch;
