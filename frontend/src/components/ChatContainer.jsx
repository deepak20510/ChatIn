import { useEffect, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import NoChatHistoryPlaceholder from "./NoChatHistoryPlaceholder";
import MessageInput from "./MessageInput";
import MessagesLoadingState from "./MessagesLoadingState";
import { Check, CheckCheck } from "lucide-react";

function ChatContainer() {
  const {
    selectedUser,
    selectedRoom,
    getMessagesByUserId,
    getRoomMessages,
    messages,
    isMessagesLoading,
    subscribeToMessages,
    unsubscribeFromMessages,
    typingUsers,
    roomTypingUsers,
    retrySendMessage,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  useEffect(() => {
    if (authUser) {
      if (selectedUser) {
        getMessagesByUserId(selectedUser._id);
      } else if (selectedRoom) {
        getRoomMessages(selectedRoom._id);
      }
      subscribeToMessages();
    }

    return () => {
      unsubscribeFromMessages();
    };
  }, [selectedUser, selectedRoom, authUser]);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const conversationName = selectedUser
    ? selectedUser.fullName
    : selectedRoom
    ? `#${selectedRoom.name}`
    : "Chat";

  const isUserTyping = selectedUser
    ? Boolean(typingUsers[selectedUser._id.toString()])
    : false;

  const isRoomTyping = selectedRoom && roomTypingUsers.length > 0;

  return (
    <>
      <ChatHeader />
      <div className="flex-1 px-4 lg:px-8 overflow-y-auto py-6 lg:py-8 bg-gradient-to-b from-slate-900/40 to-slate-800/20">
        {messages.length > 0 && !isMessagesLoading ? (
          <div className="max-w-4xl mx-auto space-y-4 lg:space-y-5">
            {messages.map((msg) => {
              const senderIdString =
                typeof msg.senderId === "object"
                  ? msg.senderId?._id?.toString()
                  : msg.senderId?.toString();

              const isMe = senderIdString === authUser?._id?.toString();
              const senderName =
                typeof msg.senderId === "object" && msg.senderId?.fullName
                  ? msg.senderId.fullName
                  : "Member";
              const senderPic =
                typeof msg.senderId === "object" && msg.senderId?.profilePic
                  ? msg.senderId.profilePic
                  : "/avatar.png";

              return (
                <div
                  key={msg._id}
                  className={`chat ${isMe ? "chat-end" : "chat-start"}`}
                >
                  {/* Sender Avatar for Room messages */}
                  {selectedRoom && !isMe && (
                    <div className="chat-image avatar">
                      <div className="w-8 h-8 rounded-full ring-1 ring-slate-700 overflow-hidden">
                        <img src={senderPic} alt={senderName} />
                      </div>
                    </div>
                  )}

                  {/* Sender Name in Room */}
                  {selectedRoom && !isMe && (
                    <div className="chat-header text-[11px] font-medium text-cyan-400 mb-1 ml-1">
                      {senderName}
                    </div>
                  )}

                  <div
                    className={`chat-bubble relative max-w-[85%] lg:max-w-[70%] shadow-lg ${
                      msg.failed
                        ? "bg-red-900/40 border border-red-500/30 text-slate-200"
                        : isMe
                        ? "bg-gradient-to-br from-cyan-600 to-cyan-700 text-white shadow-cyan-500/10"
                        : "bg-gradient-to-br from-slate-800 to-slate-700 text-slate-200 shadow-slate-900/20"
                    }`}
                  >
                    {msg.image && (
                      <img
                        src={msg.image}
                        alt="Shared media"
                        className="rounded-xl h-36 lg:h-52 w-full object-cover mb-2 border border-slate-700/50"
                      />
                    )}
                    {msg.text && (
                      <p className="text-sm lg:text-base leading-relaxed break-words whitespace-pre-wrap">
                        {msg.text}
                      </p>
                    )}
                    <div className="text-[11px] mt-1.5 opacity-75 flex items-center justify-end gap-1.5">
                      {msg.failed ? (
                        <button
                          onClick={() => retrySendMessage(msg)}
                          className="text-red-400 font-medium hover:text-red-300 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Click to retry sending"
                        >
                          ⚠ Failed &middot; Tap to retry
                        </button>
                      ) : (
                        <>
                          <span>
                            {new Date(msg.createdAt).toLocaleTimeString(undefined, {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {isMe && selectedUser && (
                            <span>
                              {msg.isRead ? (
                                <CheckCheck className="w-3.5 h-3.5 text-cyan-200 inline" />
                              ) : (
                                <Check className="w-3.5 h-3.5 opacity-60 inline" />
                              )}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Live Typing indicator animation bubble inside stream */}
            {(isUserTyping || isRoomTyping) && (
              <div className="chat chat-start">
                <div className="chat-bubble bg-slate-800/80 border border-slate-700/50 text-slate-300 py-2 px-4 shadow-md">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-400">
                      {isUserTyping
                        ? `${selectedUser.fullName} is typing`
                        : roomTypingUsers.length === 1
                        ? `${roomTypingUsers[0].senderName} is typing`
                        : "Several people are typing"}
                    </span>
                    <span className="flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"></span>
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messageEndRef} />
          </div>
        ) : isMessagesLoading ? (
          <MessagesLoadingState />
        ) : (
          <NoChatHistoryPlaceholder name={conversationName} />
        )}
      </div>
      <MessageInput />
    </>
  );
}

export default ChatContainer;
