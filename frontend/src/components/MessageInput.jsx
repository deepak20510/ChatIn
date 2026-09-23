import { useRef, useState, useEffect } from "react";
import useKeyboardSound from "../hooks/useKeyboardSound";
import { useChatStore } from "../store/useChatStore";
import { compressImage } from "../lib/imageCompressor";
import toast from "react-hot-toast";
import { Image as ImageIcon, Send as SendIcon, X as XIcon, Loader2 } from "lucide-react";

function MessageInput() {
  const { playRandomKeyStrokeSound } = useKeyboardSound();
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [isSending, setIsSending] = useState(false); // Prevent duplicate submissions
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const {
    sendMessage,
    isSoundEnabled,
    sendTypingStatus,
    selectedUser,
    selectedRoom,
  } = useChatStore();

  const handleInputChange = (e) => {
    setText(e.target.value);
    if (isSoundEnabled) playRandomKeyStrokeSound();

    // Trigger typing event with debounce
    sendTypingStatus(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStatus(false);
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [selectedUser, selectedRoom]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;
    // Prevent double-send on rapid clicks or Enter key spam
    if (isSending) return;

    if (isSoundEnabled) playRandomKeyStrokeSound();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    sendTypingStatus(false);

    setIsSending(true);
    try {
      await sendMessage({
        text: text.trim(),
        image: imagePreview,
      });
      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setIsSending(false);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file (JPEG, PNG, GIF, WebP)");
      return;
    }

    // Hard cap: 5MB raw before any compression
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsCompressing(true);
    try {
      // Compress image client-side to protect Cloudinary quota and speed up upload
      const compressed = await compressImage(file);
      setImagePreview(compressed);
    } catch {
      toast.error("Failed to process image. Please try another file.");
    } finally {
      setIsCompressing(false);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const placeholderText = selectedUser
    ? `Message ${selectedUser.fullName}...`
    : selectedRoom
    ? `Message #${selectedRoom.name}...`
    : "Type your message...";

  const isSubmitDisabled = (!text.trim() && !imagePreview) || isSending || isCompressing;

  return (
    <div className="p-4 lg:p-5 border-t border-slate-700/50 bg-gradient-to-r from-slate-900/90 to-slate-800/90 backdrop-blur-md">
      {imagePreview && (
        <div className="max-w-4xl mx-auto mb-3 flex items-center">
          <div className="relative group">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 lg:w-24 lg:h-24 object-cover rounded-xl border-2 border-slate-700 group-hover:border-cyan-500/50 transition-colors shadow-lg"
            />
            <button
              onClick={removeImage}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-800 hover:bg-red-500 flex items-center justify-center text-slate-200 transition-all shadow-md border border-slate-600"
              type="button"
              aria-label="Remove image"
            >
              <XIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSendMessage}
        className="max-w-4xl mx-auto flex gap-2.5 lg:gap-3"
      >
        <div className="flex-1 relative">
          <input
            type="text"
            value={text}
            onChange={handleInputChange}
            className="w-full bg-slate-800/70 border border-slate-700/70 rounded-2xl py-3 lg:py-3.5 pl-5 pr-4 text-sm lg:text-base text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/30 transition-all shadow-inner disabled:opacity-60"
            placeholder={placeholderText}
            disabled={isSending}
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
          disabled={isCompressing || isSending}
          className={`p-3 lg:p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700/50 text-slate-400 hover:text-cyan-400 hover:bg-slate-700/70 hover:border-cyan-500/30 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
            imagePreview
              ? "text-cyan-400 border-cyan-500/30 bg-cyan-500/10"
              : ""
          }`}
          title={isCompressing ? "Compressing image..." : "Attach image"}
        >
          {isCompressing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <ImageIcon className="w-5 h-5" />
          )}
        </button>

        <button
          type="submit"
          disabled={isSubmitDisabled}
          className="p-3 lg:p-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-medium hover:from-cyan-600 hover:to-cyan-700 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 flex items-center justify-center"
          title="Send message"
        >
          {isSending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <SendIcon className="w-5 h-5" />
          )}
        </button>
      </form>
    </div>
  );
}

export default MessageInput;
