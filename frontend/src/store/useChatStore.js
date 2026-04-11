import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  allContacts: [],
  chats: [],
  messages: [],
  activeTab: "chats",
  selectedUser: null,
  // FIX: was "isUserLoading" (singular) — ChatList/ContactList read "isUsersLoading"
  isUsersLoading: false,
  isMessagesLoading: false,
  // FIX: use JSON.parse with a fallback to handle null from localStorage
  isSoundEnabled: (() => {
    try {
      return JSON.parse(localStorage.getItem("isSoundEnabled")) === true;
    } catch {
      return false;
    }
  })(),

  toggleSound: () => {
    const next = !get().isSoundEnabled;
    // FIX: was missing JSON.stringify — stored "true"/"false" strings, not booleans
    localStorage.setItem("isSoundEnabled", JSON.stringify(next));
    set({ isSoundEnabled: next });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedUser: (user) => set({ selectedUser: user }),

  subscribeToMessages: () => {
    const { selectedUser } = get();
    const { socket, authUser } = useAuthStore.getState();

    if (!socket || !selectedUser) return;

    socket.on("newMessage", (newMessage) => {
      const { selectedUser: currentUser, messages, isSoundEnabled } = get();
      if (!currentUser) return;

      // Only add to the view if it belongs to the active conversation
      const isRelevant =
        newMessage.senderId === currentUser._id.toString() ||
        newMessage.receiverId === currentUser._id.toString();

      if (!isRelevant) return;

      // Prevent duplicate messages if already present (solves duplicate render bugs)
      const isDuplicate = messages.some((msg) => msg._id === newMessage._id);
      if (isDuplicate) return;

      set({ messages: [...messages, newMessage] });

      // Play notification sound only for incoming messages
      if (
        authUser &&
        newMessage.senderId !== authUser._id.toString() &&
        isSoundEnabled
      ) {
        try {
          const audio = new Audio("/sounds/notification.mp3");
          audio.volume = 1;
          audio.play().catch(() => {
            // Browser may block autoplay — silently ignore
          });
        } catch {
          // Ignore audio errors
        }
      }
    });
  },

  unsubscribeFromMessages: () => {
    const { socket } = useAuthStore.getState();
    if (!socket) return;
    socket.off("newMessage");
  },

  getAllContacts: async () => {
    const { authUser } = useAuthStore.getState();
    if (!authUser) return;

    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/contacts");
      set({ allContacts: res.data });
    } catch (error) {
      if (error.response?.status !== 401) {
        toast.error("Failed to load contacts");
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
        toast.error("Failed to load chats");
      }
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessagesByUserId: async (userId) => {
    const { authUser } = useAuthStore.getState();
    if (!authUser) return;

    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      if (error.response?.status !== 401) {
        toast.error("Failed to load messages");
      }
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    const { authUser } = useAuthStore.getState();

    if (!authUser || !selectedUser) return;

    // Optimistic update — show the message immediately in the UI
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      _id: tempId,
      senderId: authUser._id,
      receiverId: selectedUser._id,
      text: messageData.text,
      image: messageData.image,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };

    const withOptimistic = [...messages, optimisticMessage];
    set({ messages: withOptimistic });

    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );
      // Safely replace the optimistic message using the LATEST state to avoid obliterating incoming socket messages
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === tempId ? res.data : msg
        ),
      }));
    } catch (error) {
      // Roll back specifically the temp message using functional state 
      set((state) => ({ 
        messages: state.messages.filter((msg) => msg._id !== tempId)
      }));
      const errorMsg =
        error.response?.data?.message || "Failed to send message";
      toast.error(errorMsg);
    }
  },
}));
