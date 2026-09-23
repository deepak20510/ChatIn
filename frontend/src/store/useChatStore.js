import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  allContacts: [],
  chats: [],
  rooms: [],
  messages: [],
  activeTab: "chats", // "chats" | "rooms" | "contacts"
  selectedUser: null,
  selectedRoom: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isRoomsLoading: false,
  typingUsers: {}, // { [userId]: true }
  roomTypingUsers: [], // Array<{ senderId, senderName }>
  isSoundEnabled: (() => {
    try {
      return JSON.parse(localStorage.getItem("isSoundEnabled")) === true;
    } catch {
      return false;
    }
  })(),

  toggleSound: () => {
    const next = !get().isSoundEnabled;
    localStorage.setItem("isSoundEnabled", JSON.stringify(next));
    set({ isSoundEnabled: next });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  setSelectedUser: (user) => {
    const { selectedRoom } = get();
    const { socket } = useAuthStore.getState();
    if (socket && selectedRoom) {
      socket.emit("leaveRoom", selectedRoom._id);
    }
    if (socket && user) {
      socket.emit("markMessagesRead", { senderId: user._id });
    }
    set({
      selectedUser: user,
      selectedRoom: null,
      messages: [],
      typingUsers: {},
      roomTypingUsers: [],
    });
  },

  setSelectedRoom: (room) => {
    const { selectedRoom: prevRoom } = get();
    const { socket } = useAuthStore.getState();
    if (socket) {
      if (prevRoom) socket.emit("leaveRoom", prevRoom._id);
      if (room) socket.emit("joinRoom", room._id);
    }
    set({
      selectedRoom: room,
      selectedUser: null,
      messages: [],
      typingUsers: {},
      roomTypingUsers: [],
    });
  },

  clearSelectedConversation: () => {
    const { selectedRoom } = get();
    const { socket } = useAuthStore.getState();
    if (socket && selectedRoom) {
      socket.emit("leaveRoom", selectedRoom._id);
    }
    set({
      selectedUser: null,
      selectedRoom: null,
      messages: [],
      typingUsers: {},
      roomTypingUsers: [],
    });
  },

  // Socket Subscription Management
  subscribeToMessages: () => {
    const { socket, authUser } = useAuthStore.getState();
    if (!socket) return;

    // 1. Direct Message Listener
    socket.off("newMessage");
    socket.on("newMessage", (newMessage) => {
      const { selectedUser, messages, isSoundEnabled } = get();
      if (!selectedUser) return;

      const senderId =
        typeof newMessage.senderId === "object"
          ? newMessage.senderId?._id?.toString()
          : newMessage.senderId?.toString();
      const receiverId =
        typeof newMessage.receiverId === "object"
          ? newMessage.receiverId?._id?.toString()
          : newMessage.receiverId?.toString();

      const partnerId = selectedUser._id.toString();
      const isRelevant = senderId === partnerId || receiverId === partnerId;

      if (!isRelevant) return;

      const isDuplicate = messages.some((msg) => msg._id === newMessage._id);
      if (isDuplicate) return;

      set({ messages: [...messages, newMessage] });

      // Automatically mark incoming messages as read if currently chatting with this user
      if (senderId === partnerId) {
        socket.emit("markMessagesRead", { senderId: selectedUser._id });
      }

      // Notify & play audio for incoming message
      if (
        authUser &&
        senderId !== authUser._id.toString() &&
        isSoundEnabled
      ) {
        try {
          const audio = new Audio("/sounds/notification.mp3");
          audio.volume = 1;
          audio.play().catch(() => {});
        } catch {}
      }
    });

    // 2. Room Message Listener
    socket.off("newRoomMessage");
    socket.on("newRoomMessage", (newRoomMessage) => {
      const { selectedRoom, messages, isSoundEnabled } = get();
      if (!selectedRoom) return;

      if (newRoomMessage.roomId?.toString() !== selectedRoom._id.toString()) return;

      const isDuplicate = messages.some((msg) => msg._id === newRoomMessage._id);
      if (isDuplicate) return;

      set({ messages: [...messages, newRoomMessage] });

      const senderId =
        typeof newRoomMessage.senderId === "object"
          ? newRoomMessage.senderId._id?.toString()
          : newRoomMessage.senderId?.toString();

      if (authUser && senderId !== authUser._id.toString() && isSoundEnabled) {
        try {
          const audio = new Audio("/sounds/notification.mp3");
          audio.volume = 1;
          audio.play().catch(() => {});
        } catch {}
      }
    });

    // 3. 1-on-1 Typing Listeners
    socket.off("userTyping");
    socket.on("userTyping", ({ senderId }) => {
      set((state) => ({
        typingUsers: { ...state.typingUsers, [senderId]: true },
      }));
    });

    socket.off("userStoppedTyping");
    socket.on("userStoppedTyping", ({ senderId }) => {
      set((state) => {
        const next = { ...state.typingUsers };
        delete next[senderId];
        return { typingUsers: next };
      });
    });

    // 4. Room Typing Listeners
    socket.off("roomUserTyping");
    socket.on("roomUserTyping", ({ roomId, senderId, senderName }) => {
      const { selectedRoom } = get();
      if (!selectedRoom || selectedRoom._id.toString() !== roomId.toString()) return;

      set((state) => {
        const exists = state.roomTypingUsers.some((u) => u.senderId === senderId);
        if (exists) return state;
        return {
          roomTypingUsers: [...state.roomTypingUsers, { senderId, senderName }],
        };
      });
    });

    socket.off("roomUserStoppedTyping");
    socket.on("roomUserStoppedTyping", ({ roomId, senderId }) => {
      const { selectedRoom } = get();
      if (!selectedRoom || selectedRoom._id.toString() !== roomId.toString()) return;

      set((state) => ({
        roomTypingUsers: state.roomTypingUsers.filter((u) => u.senderId !== senderId),
      }));
    });

    // 5. Room Creation Broadcast
    socket.off("roomCreated");
    socket.on("roomCreated", (newRoom) => {
      set((state) => {
        const exists = state.rooms.some((r) => r._id === newRoom._id);
        if (exists) return state;
        return { rooms: [newRoom, ...state.rooms] };
      });
    });

    // 6. Sender tab sync: replace optimistic message when confirmed from another tab
    socket.off("messageSentSync");
    socket.on("messageSentSync", (confirmedMessage) => {
      set((state) => {
        // Only update if this confirmed message isn't already in the list
        const exists = state.messages.some(
          (m) => m._id === confirmedMessage._id && !m.isOptimistic
        );
        if (exists) return state;
        return {
          messages: state.messages.map((m) =>
            m.isOptimistic && m.text === confirmedMessage.text
              ? confirmedMessage
              : m
          ),
        };
      });
    });

    // 7. Read Receipts Listener: update double checkmarks in real-time
    socket.off("messagesRead");
    socket.on("messagesRead", ({ readBy }) => {
      const { selectedUser } = get();
      if (selectedUser && selectedUser._id.toString() === readBy?.toString()) {
        set((state) => ({
          messages: state.messages.map((m) => ({ ...m, isRead: true })),
        }));
      }
    });
  },

  unsubscribeFromMessages: () => {
    const { socket } = useAuthStore.getState();
    if (!socket) return;
    socket.off("newMessage");
    socket.off("newRoomMessage");
    socket.off("messageSentSync");
    socket.off("userTyping");
    socket.off("userStoppedTyping");
    socket.off("roomUserTyping");
    socket.off("roomUserStoppedTyping");
    socket.off("roomCreated");
    socket.off("messagesRead");
  },

  // Broadcast Typing status to socket
  sendTypingStatus: (isTyping) => {
    const { selectedUser, selectedRoom } = get();
    const { socket } = useAuthStore.getState();
    if (!socket) return;

    if (selectedUser) {
      socket.emit(isTyping ? "typing" : "stopTyping", {
        receiverId: selectedUser._id,
      });
    } else if (selectedRoom) {
      socket.emit(isTyping ? "roomTyping" : "roomStopTyping", {
        roomId: selectedRoom._id,
      });
    }
  },

  // API Actions
  getAllContacts: async () => {
    const { authUser } = useAuthStore.getState();
    if (!authUser) return;

    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/contacts");
      set({ allContacts: res.data });
    } catch (error) {
      if (error.response?.status !== 401) {
        toast.error(error.userMessage || error.response?.data?.message || "Failed to load contacts");
      }
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMyChatPartners: async () => {
    const { authUser } = useAuthStore.getState();
    if (!authUser) return;

    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/chats");
      set({ chats: res.data });
    } catch (error) {
      if (error.response?.status !== 401) {
        toast.error(error.userMessage || error.response?.data?.message || "Failed to load chats");
      }
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getAllRooms: async () => {
    const { authUser } = useAuthStore.getState();
    if (!authUser) return;

    set({ isRoomsLoading: true });
    try {
      const res = await axiosInstance.get("/rooms");
      set({ rooms: res.data });
    } catch (error) {
      if (error.response?.status !== 401) {
        toast.error(error.userMessage || error.response?.data?.message || "Failed to load rooms");
      }
    } finally {
      set({ isRoomsLoading: false });
    }
  },

  createRoom: async (roomData) => {
    const { authUser } = useAuthStore.getState();
    if (!authUser) return null;

    try {
      const res = await axiosInstance.post("/rooms", roomData);
      set((state) => ({
        rooms: [
          res.data,
          ...state.rooms.filter((r) => r._id !== res.data._id),
        ],
      }));
      toast.success(`Room #${res.data.name} created!`);
      get().setSelectedRoom(res.data);
      return res.data;
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to create room";
      toast.error(msg);
      return null;
    }
  },

  getMessagesByUserId: async (userId) => {
    const { authUser, socket } = useAuthStore.getState();
    if (!authUser) return;

    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}?limit=60`);
      set({ messages: res.data });
      if (socket) {
        socket.emit("markMessagesRead", { senderId: userId });
      }
    } catch (error) {
      if (error.response?.status !== 401) {
        toast.error(error.userMessage || error.response?.data?.message || "Failed to load messages");
      }
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  getRoomMessages: async (roomId) => {
    const { authUser } = useAuthStore.getState();
    if (!authUser) return;

    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/rooms/${roomId}/messages?limit=60`);
      set({ messages: res.data });
    } catch (error) {
      if (error.response?.status !== 401) {
        toast.error(error.userMessage || error.response?.data?.message || "Failed to load room messages");
      }
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, selectedRoom, messages } = get();
    const { authUser } = useAuthStore.getState();

    if (!authUser || (!selectedUser && !selectedRoom)) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      _id: tempId,
      senderId: authUser,
      receiverId: selectedUser ? selectedUser._id : null,
      roomId: selectedRoom ? selectedRoom._id : null,
      text: messageData.text,
      image: messageData.image,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };

    set({ messages: [...messages, optimisticMessage] });

    try {
      if (selectedUser) {
        const res = await axiosInstance.post(
          `/messages/send/${selectedUser._id}`,
          messageData
        );
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg._id === tempId ? res.data : msg
          ),
        }));
      } else if (selectedRoom) {
        const res = await axiosInstance.post(
          `/rooms/${selectedRoom._id}/send`,
          messageData
        );
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg._id === tempId ? res.data : msg
          ),
        }));
      }
    } catch (error) {
      // Mark the temp message as failed instead of removing it (for retry UX)
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === tempId ? { ...msg, failed: true, _tempId: tempId } : msg
        ),
      }));
      const errorMsg =
        error.userMessage ||
        error.response?.data?.message ||
        "Failed to send message";
      toast.error(errorMsg);
    }
  },

  /**
   * Retry a previously failed message.
   * Removes the failed optimistic message and re-sends it.
   */
  retrySendMessage: async (failedMsg) => {
    // Remove the failed message from the list first
    set((state) => ({
      messages: state.messages.filter(
        (m) => m._id !== failedMsg._id
      ),
    }));
    // Re-send via normal path
    await get().sendMessage({
      text: failedMsg.text,
      image: failedMsg.image,
    });
  },
}));
