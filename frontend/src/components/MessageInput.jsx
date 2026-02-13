import { useRef, useState } from "react";
import useKeyboardSound from "../hooks/useKeyboardSound";
import { useChatStore } from "../store/useChatStore";
import toast from "react-hot-toast";
import { ImageIcon, SendIcon, XIcon } from "lucide-react";

function MessageInput() {
  const { playRandomKeyStrokeSound } = useKeyboardSound();
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);

  const fileInputRef = useRef(null);

  const { sendMessage, isSoundEnabled } = useChatStore();

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;
    if (isSoundEnabled) playRandomKeyStrokeSound();

    sendMessage({
      text: text.trim(),
      image: imagePreview,
    });
    setText("");
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="p-4 lg:p-6 border-t border-slate-700/50 bg-gradient-to-r from-slate-900/80 to-slate-800/80 backdrop-blur-md">
      {imagePreview && (
        <div className="max-w-4xl mx-auto mb-4 flex items-center">
          <div className="relative group">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-24 h-24 lg:w-28 lg:h-28 object-cover rounded-xl border-2 border-slate-700 group-hover:border-cyan-500/50 transition-colors"
            />
            <button
              onClick={removeImage}
              className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-slate-700 hover:bg-red-500/80 flex items-center justify-center text-slate-200 transition-all shadow-lg"
              type="button"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSendMessage}
        className="max-w-4xl mx-auto flex gap-3 lg:gap-4"
      >
        <div className="flex-1 relative">
          <input
            type="text"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              isSoundEnabled && playRandomKeyStrokeSound();
            }}
            className="w-full bg-slate-800/70 border border-slate-700/70 rounded-2xl py-3.5 lg:py-4 pl-5 pr-4 text-sm lg:text-base text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/30 transition-all"
            placeholder="Type your message..."
          />
        </div>

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageChange}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`p-3.5 lg:p-4 rounded-2xl bg-slate-800/70 border border-slate-700/50 text-slate-400 hover:text-cyan-400 hover:bg-slate-700/70 hover:border-cyan-500/30 transition-all duration-200 ${
            imagePreview
              ? "text-cyan-400 border-cyan-500/30 bg-cyan-500/10"
              : ""
          }`}
          title="Attach image"
        >
          <ImageIcon className="w-5 h-5 lg:w-6 lg:h-6" />
        </button>
        <button
          type="submit"
          disabled={!text.trim() && !imagePreview}
          className="p-3.5 lg:p-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-medium hover:from-cyan-600 hover:to-cyan-700 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30"
          title="Send message"
        >
          <SendIcon className="w-5 h-5 lg:w-6 lg:h-6" />
        </button>
      </form>
    </div>
  );
}
export default MessageInput;
