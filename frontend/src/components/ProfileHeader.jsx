import { useState, useRef } from "react";
import { LogOutIcon, VolumeOffIcon, Volume2Icon, Loader2 } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore.js";
import { useChatStore } from "../store/useChatStore.js";
import { compressImage } from "../lib/imageCompressor.js";
import toast from "react-hot-toast";

function ProfileHeader() {
  const { logout, authUser, updateProfile } = useAuthStore();
  const { isSoundEnabled, toggleSound } = useChatStore();
  const [selectedImg, setSelectedImg] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Profile picture must be smaller than 5MB");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsUploading(true);
    try {
      const compressed = await compressImage(file, 800, 0.85); // Profile pics: smaller target
      setSelectedImg(compressed);
      await updateProfile({ profilePic: compressed });
    } catch {
      toast.error("Failed to process image. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSoundToggle = () => {
    // FIX: Create Audio lazily inside the click handler (not at module level).
    // Module-level Audio() creation can fail in strict browser environments and
    // blocks the initial parse of the module before any user gesture has occurred.
    try {
      const mouseClickSound = new Audio("/sounds/mouse-click.mp3");
      mouseClickSound.currentTime = 0;
      mouseClickSound.play().catch(() => {
        // Browser may block autoplay in some contexts — silently ignore
      });
    } catch {
      // Audio not supported — ignore
    }
    toggleSound();
  };

  return (
    <div className="p-6 lg:p-8 border-b border-slate-700/50 bg-slate-800/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/*AVATAR*/}
          <div className="avatar online">
            <button
              className="size-14 lg:size-16 rounded-full overflow-hidden relative group ring-2 ring-slate-700/50 hover:ring-cyan-500/50 transition-all duration-300 disabled:cursor-not-allowed"
              onClick={() => !isUploading && fileInputRef.current?.click()}
              type="button"
              disabled={isUploading}
              title={isUploading ? "Uploading..." : "Change profile picture"}
            >
              <img
                src={selectedImg || authUser?.profilePic || "/avatar.png"}
                alt="User Image"
                className={`size-full object-cover transition-opacity ${isUploading ? "opacity-40" : ""}`}
              />
              {isUploading ? (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                </div>
              ) : (
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                  <span className="text-white text-xs font-medium">Change</span>
                </div>
              )}
            </button>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageUpload}
            />
          </div>
          {/*USERNAME*/}
          <div>
            <h3 className="text-slate-100 font-semibold text-base lg:text-lg max-w-[180px] lg:max-w-[200px] truncate">
              {authUser?.fullName}
            </h3>
            <p className="text-cyan-400/80 text-xs lg:text-sm flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
              Online
            </p>
          </div>
        </div>
        {/* BUTTONS */}
        <div className="flex gap-3 lg:gap-4 items-center">
          {/* SOUND TOGGLE BTN */}
          <button
            className="p-2.5 rounded-xl bg-slate-700/30 text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50 transition-all duration-200"
            onClick={handleSoundToggle}
            type="button"
            title={isSoundEnabled ? "Mute sounds" : "Enable sounds"}
          >
            {isSoundEnabled ? (
              <Volume2Icon className="size-5" />
            ) : (
              <VolumeOffIcon className="size-5" />
            )}
          </button>

          {/* LOGOUT BTN */}
          <button
            className="p-2.5 rounded-xl bg-slate-700/30 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
            onClick={logout}
            type="button"
            title="Logout"
          >
            <LogOutIcon className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProfileHeader;
