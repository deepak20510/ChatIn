import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import CreateRoomModal from "./CreateRoomModal";
import { Hash, Plus, Users, Lock, Globe, Search, Sparkles } from "lucide-react";

function RoomList() {
  const { getAllRooms, rooms, isRoomsLoading, selectedRoom, setSelectedRoom } =
    useChatStore();
  const { authUser } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (authUser) {
      getAllRooms();
    }
  }, [authUser]);

  if (isRoomsLoading && rooms.length === 0) {
    return <UsersLoadingSkeleton />;
  }

  const filteredRooms = rooms.filter(
    (room) =>
      room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.topic?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="space-y-3">
        {/* Header Action: Create Room */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search rooms..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-900/60 border border-slate-700/60 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
            />
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-500/20 to-cyan-600/20 hover:from-cyan-500/30 hover:to-cyan-600/30 border border-cyan-500/30 text-cyan-400 rounded-xl text-xs font-medium transition-all duration-200 shadow-sm shadow-cyan-500/10"
            title="Create new room"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>

        {/* Room List Items */}
        <div className="space-y-1.5">
          {filteredRooms.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              <Sparkles className="w-6 h-6 mx-auto mb-2 opacity-40 text-cyan-400" />
              {searchTerm ? "No rooms match your search" : "No public rooms yet"}
            </div>
          ) : (
            filteredRooms.map((room) => {
              const isSelected = selectedRoom?._id === room._id;
              return (
                <div
                  key={room._id}
                  onClick={() => setSelectedRoom(room)}
                  className={`group p-3 rounded-xl cursor-pointer transition-all duration-200 border ${
                    isSelected
                      ? "bg-gradient-to-r from-cyan-500/25 to-cyan-600/10 border-cyan-500/40 shadow-md shadow-cyan-500/10"
                      : "bg-slate-900/40 hover:bg-slate-800/60 border-slate-800/60 hover:border-slate-700/80"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Room Icon Avatar */}
                    <div
                      className={`p-2.5 rounded-xl transition-all ${
                        isSelected
                          ? "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40"
                          : "bg-slate-800/80 text-slate-400 group-hover:text-cyan-400 group-hover:bg-slate-700/80"
                      }`}
                    >
                      {room.isPrivate ? (
                        <Lock className="w-4 h-4" />
                      ) : (
                        <Hash className="w-4 h-4" />
                      )}
                    </div>

                    {/* Room Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4
                          className={`font-medium text-xs sm:text-sm truncate transition-colors ${
                            isSelected
                              ? "text-cyan-300 font-semibold"
                              : "text-slate-200 group-hover:text-slate-100"
                          }`}
                        >
                          #{room.name}
                        </h4>
                        <span className="flex items-center gap-1 text-[10px] text-slate-400 font-normal bg-slate-800/60 px-2 py-0.5 rounded-full border border-slate-700/40">
                          <Users className="w-2.5 h-2.5 text-cyan-400" />
                          {room.memberCount || 1}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {room.topic || room.description || "General Discussion"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <CreateRoomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}

export default RoomList;
