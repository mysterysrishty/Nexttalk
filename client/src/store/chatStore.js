import { create } from 'zustand';
import {
  getMyRoomsApi,
  getRoomsApi,
  getRoomMessagesApi,
  joinRoomApi,
  leaveRoomApi,
  createRoomApi,
} from '../api/room';
import { getMyDMsApi, getOrCreateDMApi, getDMMessagesApi } from '../api/dm';

const useChatStore = create((set, get) => ({
  // Rooms
  myRooms: [],
  publicRooms: [],
  activeRoom: null,
  roomMessages: {},     // roomId -> messages[]
  roomHasMore: {},      // roomId -> bool
  roomPage: {},         // roomId -> page num

  // DMs
  myDMs: [],
  activeDM: null,
  dmMessages: {},       // conversationId -> messages[]
  dmHasMore: {},
  dmPage: {},

  // Typing
  typingUsers: {},      // roomId or convId -> [{userId, username}]

  // Unread
  unreadRooms: {},      // roomId -> count
  unreadDMs: {},        // convId -> count

  // ── Rooms ──────────────────────────────────────────────────────────────────

  fetchMyRooms: async () => {
    const { data } = await getMyRoomsApi();
    set({ myRooms: data });
  },

  fetchPublicRooms: async (search = '') => {
    const { data } = await getRoomsApi(search);
    set({ publicRooms: data });
  },

  setActiveRoom: (room) => {
    set({ activeRoom: room, activeDM: null });
    // clear unread
    set((s) => ({ unreadRooms: { ...s.unreadRooms, [room._id]: 0 } }));
  },

  fetchRoomMessages: async (roomId, page = 1) => {
    const { data } = await getRoomMessagesApi(roomId, page);
    set((s) => ({
      roomMessages: {
        ...s.roomMessages,
        [roomId]: page === 1 ? data.messages : [...data.messages, ...(s.roomMessages[roomId] || [])],
      },
      roomHasMore: { ...s.roomHasMore, [roomId]: data.hasMore },
      roomPage: { ...s.roomPage, [roomId]: page },
    }));
  },

  addRoomMessage: (msg) => {
    const roomId = msg.room;
    set((s) => {
      const existing = s.roomMessages[roomId] || [];
      const isDuplicate = existing.some((m) => m._id === msg._id);
      if (isDuplicate) return {};
      return {
        roomMessages: { ...s.roomMessages, [roomId]: [...existing, msg] },
        myRooms: s.myRooms.map((r) => (r._id === roomId ? { ...r, lastMessage: msg } : r)),
      };
    });
  },

  updateMessageReaction: (msg) => {
    set((s) => {
      const roomId = msg.room;
      const convId = msg.directConversation;
      if (roomId) {
        return {
          roomMessages: {
            ...s.roomMessages,
            [roomId]: (s.roomMessages[roomId] || []).map((m) => (m._id === msg._id ? msg : m)),
          },
        };
      }
      if (convId) {
        return {
          dmMessages: {
            ...s.dmMessages,
            [convId]: (s.dmMessages[convId] || []).map((m) => (m._id === msg._id ? msg : m)),
          },
        };
      }
      return {};
    });
  },

  joinRoom: async (roomId) => {
    const { data } = await joinRoomApi(roomId);
    set((s) => ({
      myRooms: s.myRooms.find((r) => r._id === roomId)
        ? s.myRooms
        : [...s.myRooms, data],
    }));
    return data;
  },

  leaveRoom: async (roomId) => {
    await leaveRoomApi(roomId);
    set((s) => ({
      myRooms: s.myRooms.filter((r) => r._id !== roomId),
      activeRoom: s.activeRoom?._id === roomId ? null : s.activeRoom,
    }));
  },

  createRoom: async (roomData) => {
    const { data } = await createRoomApi(roomData);
    set((s) => ({ myRooms: [...s.myRooms, data] }));
    return data;
  },

  // ── DMs ────────────────────────────────────────────────────────────────────

  fetchMyDMs: async () => {
    const { data } = await getMyDMsApi();
    set({ myDMs: data });
  },

  setActiveDM: (convo) => {
    set({ activeDM: convo, activeRoom: null });
    set((s) => ({ unreadDMs: { ...s.unreadDMs, [convo._id]: 0 } }));
  },

  getOrCreateDM: async (userId) => {
    const { data } = await getOrCreateDMApi(userId);
    set((s) => ({
      myDMs: s.myDMs.find((d) => d._id === data._id) ? s.myDMs : [data, ...s.myDMs],
    }));
    return data;
  },

  fetchDMMessages: async (conversationId, page = 1) => {
    const { data } = await getDMMessagesApi(conversationId, page);
    set((s) => ({
      dmMessages: {
        ...s.dmMessages,
        [conversationId]:
          page === 1
            ? data.messages
            : [...data.messages, ...(s.dmMessages[conversationId] || [])],
      },
      dmHasMore: { ...s.dmHasMore, [conversationId]: data.hasMore },
      dmPage: { ...s.dmPage, [conversationId]: page },
    }));
  },

  addDMMessage: (msg) => {
    const convId = msg.directConversation;
    set((s) => {
      const existing = s.dmMessages[convId] || [];
      const isDuplicate = existing.some((m) => m._id === msg._id);
      if (isDuplicate) return {};
      return {
        dmMessages: { ...s.dmMessages, [convId]: [...existing, msg] },
        myDMs: s.myDMs.map((d) =>
          d._id === convId ? { ...d, lastMessage: msg, updatedAt: msg.createdAt } : d
        ),
      };
    });
  },

  // ── Typing ─────────────────────────────────────────────────────────────────

  setTyping: (key, user) => {
    set((s) => {
      const current = s.typingUsers[key] || [];
      if (current.find((u) => u.userId === user.userId)) return {};
      return { typingUsers: { ...s.typingUsers, [key]: [...current, user] } };
    });
  },

  clearTyping: (key, userId) => {
    set((s) => ({
      typingUsers: {
        ...s.typingUsers,
        [key]: (s.typingUsers[key] || []).filter((u) => u.userId !== userId),
      },
    }));
  },

  // ── Unread ─────────────────────────────────────────────────────────────────

  incrementUnreadRoom: (roomId) => {
    set((s) => ({
      unreadRooms: { ...s.unreadRooms, [roomId]: (s.unreadRooms[roomId] || 0) + 1 },
    }));
  },

  incrementUnreadDM: (convId) => {
    set((s) => ({
      unreadDMs: { ...s.unreadDMs, [convId]: (s.unreadDMs[convId] || 0) + 1 },
    }));
  },
}));

export default useChatStore;
