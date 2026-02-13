import { useChatStore } from "../store/useChatStore";

function ActiveTabSwitch() {
  const { activeTab, setActiveTab } = useChatStore();
  return (
    <div className="flex p-1.5 bg-slate-900/50 rounded-2xl backdrop-blur-sm">
      <button
        onClick={() => setActiveTab("chats")}
        className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium ${
          activeTab === "chats"
            ? "bg-gradient-to-r from-cyan-500/20 to-cyan-600/20 text-cyan-400 shadow-lg shadow-cyan-500/10 border border-cyan-500/20"
            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors duration-200"
        }`}
      >
        <span className="flex items-center justify-center gap-2">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          Chats
        </span>
      </button>
      <button
        onClick={() => setActiveTab("contacts")}
        className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium ${
          activeTab === "contacts"
            ? "bg-gradient-to-r from-cyan-500/20 to-cyan-600/20 text-cyan-400 shadow-lg shadow-cyan-500/10 border border-cyan-500/20"
            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors duration-200"
        }`}
      >
        <span className="flex items-center justify-center gap-2">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
          Contacts
        </span>
      </button>
    </div>
  );
}

export default ActiveTabSwitch;
