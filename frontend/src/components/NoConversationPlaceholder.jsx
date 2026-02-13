import { MessageCircleIcon } from "lucide-react";

const NoConversationPlaceholder = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 lg:p-12">
      <div className="size-24 lg:size-28 bg-gradient-to-br from-cyan-500/20 to-pink-500/20 rounded-full flex items-center justify-center mb-8 shadow-lg shadow-cyan-500/10">
        <MessageCircleIcon className="size-12 lg:size-14 text-cyan-400" />
      </div>
      <h3 className="text-2xl lg:text-3xl font-bold text-slate-100 mb-3">
        Select a conversation
      </h3>
      <p className="text-slate-400 max-w-md lg:max-w-lg text-base lg:text-lg leading-relaxed">
        Choose a contact from the sidebar to start chatting or continue a
        previous conversation.
      </p>
      <div className="mt-8 flex gap-3">
        <span className="px-4 py-2 bg-slate-800/50 rounded-full text-sm text-slate-400 border border-slate-700/50">
          Real-time messaging
        </span>
        <span className="px-4 py-2 bg-slate-800/50 rounded-full text-sm text-slate-400 border border-slate-700/50">
          Image sharing
        </span>
      </div>
    </div>
  );
};

export default NoConversationPlaceholder;
