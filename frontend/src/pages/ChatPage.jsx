import { useChatStore } from "../store/useChatStore";
import { useEffect } from "react";
import BorderAnimatedContainer from "../components/BorderAnimatedContainer";
import ProfileHeader from "../components/ProfileHeader";
import ActiveTabSwitch from "../components/ActiveTabSwitch";
import ChatList from "../components/ChatList";
import ContactList from "../components/ContactList";
import ChatContainer from "../components/ChatContainer";
import NoConversationPlaceholder from "../components/NoConversationPlaceholder";

function ChatPage() {
  const { activeTab, selectedUser, setSelectedUser } = useChatStore();

  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") setSelectedUser(null);
    };
    window.addEventListener("keydown", handleEscKey);
    return () => window.removeEventListener("keydown", handleEscKey);
  }, [setSelectedUser]);
  return (
    <div className="relative w-full h-[calc(100vh-2rem)] max-h-[900px] lg:max-w-7xl lg:mx-auto lg:h-[85vh] lg:max-h-[850px]">
      <BorderAnimatedContainer>
        {/* LEFT SIDE - Sidebar */}
        <div className="w-full md:w-80 lg:w-96 bg-slate-800/50 backdrop-blur-sm flex flex-col border-r border-slate-700/30">
          <ProfileHeader />
          <div className="px-4 py-2">
            <ActiveTabSwitch />
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {activeTab === "chats" ? <ChatList /> : <ContactList />}
          </div>
        </div>

        {/* RIGHT SIDE - Chat Area */}
        <div className="flex-1 flex-col bg-slate-900/30 backdrop-blur-sm hidden md:flex relative">
          {selectedUser ? <ChatContainer /> : <NoConversationPlaceholder />}
        </div>

        {/* MOBILE CHAT OVERLAY */}
        {selectedUser && (
          <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-sm md:hidden z-50 flex flex-col">
            <ChatContainer />
          </div>
        )}
      </BorderAnimatedContainer>
    </div>
  );
}

export default ChatPage;
