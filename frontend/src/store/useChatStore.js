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
  isUserLoading: false,
  isMessagesLoading: false,
  isSoundEnabled: JSON.parse(localStorage.getItem("isSoundEnabled")) === true,

  toggleSound: () => {
    localStorage.setItem("isSoundEnabled", !get().isSoundEnabled);
    set({ isSoundEnabled: !get().isSoundEnabled });
  },
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedUser: (user) => set({ selectedUser: user }),

  subscribeToMessages: () => {
    const { selectedUser } = get();
    const { socket, authUser } = useAuthStore.getState();

    if (!socket || !selectedUser) return;

    // Listen for new messages
    socket.on("newMessage", (newMessage) => {
      const { selectedUser, messages, isSoundEnabled } = get();
      // Only add the message if it's from/to the currently selected user
      if (
        newMessage.senderId === selectedUser._id.toString() ||
        newMessage.receiverId === selectedUser._id.toString()
      ) {
        set({ messages: [...messages, newMessage] });

        // Play notification sound if message is from the other user
        if (
          authUser &&
          newMessage.senderId !== authUser._id.toString() &&
          isSoundEnabled
        ) {
          try {
            const audio = new Audio("/sounds/notification.mp3");
            audio.volume = 1;
            audio.play();
          } catch (err) {
            console.log("Error playing notification sound:", err);
          }
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
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/contacts");
      set({ allContacts: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },
  getMyChatPartners: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/chats");
      set({ chats: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },
  getMessagesByUserId: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      set({ isMessagesLoading: false });
    }
  },
  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    const { authUser } = useAuthStore.getState();
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      _id: tempId,
      senderId: authUser._id,
      receiverId: selectedUser._id,
      text: messageData.text,
      image: messageData.image,
      createdAt: new Date().toISOString(),
      isOptimistic: true, // flag to identify optimistic messages (optional)
    };
    // immidetaly update the ui by adding the message
    const messagesWithOptimistic = [...messages, optimisticMessage];
    set({ messages: messagesWithOptimistic });
    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData,
      );
      // Replace optimistic message with real message from server
      const updatedMessages = messagesWithOptimistic.map((msg) =>
        msg._id === tempId ? res.data : msg,
      );
      set({ messages: updatedMessages });
    } catch (error) {
      // Remove optimistic message on error
      set({ messages: messages });
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  },
}));
