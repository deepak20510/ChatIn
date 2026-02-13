import { MessageCircleIcon, Send } from "lucide-react";

const NoChatHistoryPlaceholder = ({ name }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 lg:p-12">
      <div className="w-20 h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-cyan-500/20 to-pink-500/10 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-cyan-500/10">
        <MessageCircleIcon className="size-10 lg:size-12 text-cyan-400" />
      </div>
      <h3 className="text-xl lg:text-2xl font-semibold text-slate-100 mb-4">
        Start your conversation with{" "}
        <span className="text-cyan-400">{name}</span>
      </h3>
      <div className="flex flex-col space-y-4 max-w-lg mb-8">
        <p className="text-slate-400 text-base lg:text-lg">
          This is the beginning of your conversation. Send a message to start
          chatting!
        </p>
        <div className="h-px w-48 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent mx-auto"></div>
      </div>
      <div className="flex flex-wrap gap-3 justify-center">
        <button className="px-5 py-2.5 text-sm font-medium text-cyan-400 bg-cyan-500/10 rounded-xl hover:bg-cyan-500/20 transition-all border border-cyan-500/20 flex items-center gap-2">
          <span>👋</span> Say Hello
        </button>
        <button className="px-5 py-2.5 text-sm font-medium text-cyan-400 bg-cyan-500/10 rounded-xl hover:bg-cyan-500/20 transition-all border border-cyan-500/20 flex items-center gap-2">
          <span>🤝</span> How are you?
        </button>
        <button className="px-5 py-2.5 text-sm font-medium text-cyan-400 bg-cyan-500/10 rounded-xl hover:bg-cyan-500/20 transition-all border border-cyan-500/20 flex items-center gap-2">
          <span>📅</span> Meet up soon?
        </button>
      </div>
    </div>
  );
};

export default NoChatHistoryPlaceholder;
