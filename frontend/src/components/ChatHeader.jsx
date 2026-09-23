import { X, Hash, Lock, Users } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";

function ChatHeader() {
  const {
    selectedUser,
    selectedRoom,
    clearSelectedConversation,
    typingUsers,
    roomTypingUsers,
  } = useChatStore();
  const { onlineUsers } = useAuthStore();

  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") clearSelectedConversation();
    };
    window.addEventListener("keydown", handleEscKey);
    return () => window.removeEventListener("keydown", handleEscKey);
  }, [clearSelectedConversation]);

  // Check 1-on-1 online & typing status
  const isOnline = selectedUser
    ? onlineUsers.some((id) => id?.toString() === selectedUser._id.toString())
    : false;

  const isUserTyping = selectedUser
    ? Boolean(typingUsers[selectedUser._id.toString()])
    : false;

  // Check Room typing status
  const roomTypingText =
    roomTypingUsers.length === 1
      ? `${roomTypingUsers[0].senderName} is typing...`
      : roomTypingUsers.length > 1
      ? `${roomTypingUsers.length} people are typing...`
      : null;

  return (
    <div className="flex justify-between items-center bg-gradient-to-r from-slate-800/80 to-slate-900/80 border-b border-slate-700/50 h-20 lg:h-24 px-6 lg:px-8 flex-shrink-0 backdrop-blur-md">
      {/* 1-on-1 User Header */}
      {selectedUser && (
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
            {isUserTyping ? (
              <p className="text-xs lg:text-sm text-cyan-400 flex items-center gap-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                Typing...
              </p>
            ) : (
              <p
                className={`text-xs lg:text-sm flex items-center gap-1.5 ${
                  isOnline ? "text-green-400" : "text-slate-500"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isOnline ? "bg-green-500 animate-pulse" : "bg-slate-500"
                  }`}
                ></span>
                {isOnline ? "Online" : "Offline"}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Room Header */}
      {selectedRoom && (
        <div className="flex items-center space-x-4">
          <div className="p-3 lg:p-3.5 bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border border-cyan-500/30 rounded-2xl text-cyan-400 shadow-md shadow-cyan-500/10">
            {selectedRoom.isPrivate ? (
              <Lock className="w-5 h-5 lg:w-6 lg:h-6" />
            ) : (
              <Hash className="w-5 h-5 lg:w-6 lg:h-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-slate-100 font-semibold text-base lg:text-lg max-w-[200px] lg:max-w-[280px] truncate">
                #{selectedRoom.name}
              </h3>
              <span className="flex items-center gap-1 text-[11px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700/50">
                <Users className="w-3 h-3 text-cyan-400" />
                {selectedRoom.memberCount || 1} members
              </span>
            </div>
            {roomTypingText ? (
              <p className="text-xs lg:text-sm text-cyan-400 flex items-center gap-1.5 animate-pulse mt-0.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                {roomTypingText}
              </p>
            ) : (
              <p className="text-xs lg:text-sm text-slate-400 max-w-[280px] lg:max-w-md truncate mt-0.5">
                {selectedRoom.topic || selectedRoom.description || "Public Discussion Channel"}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Close Conversation */}
      <button
        onClick={clearSelectedConversation}
        className="p-2.5 rounded-xl hover:bg-slate-700/50 transition-all duration-200 group"
        title="Close conversation (ESC)"
      >
        <X className="w-5 h-5 lg:w-6 lg:h-6 text-slate-400 group-hover:text-slate-200 transition-colors" />
      </button>
    </div>
  );
}

export default ChatHeader;
