import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import NoChatsFound from "./NoChatsFound";
import { useAuthStore } from "../store/useAuthStore";

function ChatsList() {
  const { getMyChatPartners, chats, isUsersLoading, setSelectedUser } =
    useChatStore();
  const { onlineUsers } = useAuthStore();

  useEffect(() => {
    getMyChatPartners();
  }, [getMyChatPartners]);

  if (isUsersLoading) return <UsersLoadingSkeleton />;
  if (chats.length === 0) return <NoChatsFound />;

  return (
    <>
      {chats.map((chat) => (
        <div
          key={chat._id}
          className="group bg-gradient-to-r from-cyan-500/5 to-transparent p-3 lg:p-4 rounded-xl cursor-pointer hover:from-cyan-500/15 hover:to-cyan-500/5 transition-all duration-200 border border-transparent hover:border-cyan-500/20"
          onClick={() => setSelectedUser(chat)}
        >
          <div className="flex items-center gap-3 lg:gap-4">
            <div
              className={`avatar ${onlineUsers.includes(chat._id.toString()) ? "online" : "offline"}`}
            >
              <div className="size-11 lg:size-13 rounded-full ring-2 ring-slate-700/50 group-hover:ring-cyan-500/30 transition-all">
                <img
                  src={chat.profilePic || "/avatar.png"}
                  alt={chat.fullName}
                  className="rounded-full w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-slate-100 font-medium text-sm lg:text-base truncate group-hover:text-cyan-100 transition-colors">
                {chat.fullName}
              </h4>
              <p
                className={`text-xs lg:text-sm truncate ${onlineUsers.includes(chat._id.toString()) ? "text-green-400/80" : "text-slate-500"}`}
              >
                {onlineUsers.includes(chat._id.toString())
                  ? "● Online"
                  : "Offline"}
              </p>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
export default ChatsList;
