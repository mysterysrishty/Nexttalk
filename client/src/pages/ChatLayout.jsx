import { useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import MemberPanel from '../components/MemberPanel';
import MessageBubble from '../components/MessageBubble';
import MessageInput from '../components/MessageInput';
import TypingIndicator from '../components/TypingIndicator';
import Loader from '../components/Loader';
import useAuthStore from '../store/authStore';
import useChatStore from '../store/chatStore';
import useUiStore from '../store/uiStore';
import { initSocket, disconnectSocket, getSocket } from '../socket/socket';
import toast from 'react-hot-toast';
import UserAvatar from '../components/UserAvatar';
import { useNavigate } from 'react-router-dom';

const ChatLayout = () => {
  const { user, token } = useAuthStore();
  const {
    activeRoom, activeDM,
    fetchMyRooms, fetchMyDMs,
    fetchRoomMessages, fetchDMMessages,
    roomMessages, dmMessages,
    addRoomMessage, addDMMessage,
    typingUsers, setTyping, clearTyping,
    updateMessageReaction,
    roomHasMore, dmHasMore,
    roomPage, dmPage,
    incrementUnreadRoom, incrementUnreadDM,
  } = useChatStore();
  const { showMemberPanel, toggleMemberPanel } = useUiStore();
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  // Init socket
  useEffect(() => {
    if (!token) return;
    const socket = initSocket(token);

    socket.on('receive_message', (msg) => {
      addRoomMessage(msg);
      const currentRoom = useChatStore.getState().activeRoom;
      if (!currentRoom || currentRoom._id !== msg.room) {
        incrementUnreadRoom(msg.room);
        toast(`New message in #${msg.room}`, { icon: '💬', id: msg._id });
      }
    });

    socket.on('receive_dm', (msg) => {
      addDMMessage(msg);
      const currentDM = useChatStore.getState().activeDM;
      if (!currentDM || currentDM._id !== msg.directConversation) {
        incrementUnreadDM(msg.directConversation);
      }
    });

    socket.on('dm_notification', ({ from, conversationId }) => {
      const currentDM = useChatStore.getState().activeDM;
      if (!currentDM || currentDM._id !== conversationId) {
        toast(`DM from ${from.username}`, { icon: '📩', id: conversationId });
      }
    });

    socket.on('user_typing', (data) => {
      const key = data.roomId || data.conversationId;
      setTyping(key, { userId: data.userId, username: data.username });
    });

    socket.on('user_stop_typing', (data) => {
      const key = data.roomId || data.conversationId;
      clearTyping(key, data.userId);
    });

    socket.on('reaction_update', (msg) => updateMessageReaction(msg));

    socket.on('user_status', ({ userId, status }) => {
      // status updates handled via re-fetch on demand
    });

    return () => disconnectSocket();
  }, [token]);

  // Fetch sidebar data
  useEffect(() => {
    if (user) {
      fetchMyRooms();
      fetchMyDMs();
    }
  }, [user]);

  // Join room socket + fetch messages
  useEffect(() => {
    if (!activeRoom) return;
    const socket = getSocket();
    if (socket) socket.emit('join_room', activeRoom._id);
    fetchRoomMessages(activeRoom._id, 1);
    return () => {
      if (socket) socket.emit('leave_room', activeRoom._id);
    };
  }, [activeRoom?._id]);

  // Join DM socket + fetch messages
  useEffect(() => {
    if (!activeDM) return;
    const socket = getSocket();
    if (socket) socket.emit('join_dm', activeDM._id);
    fetchDMMessages(activeDM._id, 1);
  }, [activeDM?._id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [
    activeRoom && roomMessages[activeRoom._id]?.length,
    activeDM && dmMessages[activeDM._id]?.length,
  ]);

  const messages = activeRoom
    ? roomMessages[activeRoom._id] || []
    : activeDM
    ? dmMessages[activeDM._id] || []
    : [];

  const typingKey = activeRoom?._id || activeDM?._id;
  const currentTyping = typingUsers[typingKey] || [];

  const getOtherDMUser = () =>
    activeDM?.participants?.find((p) => p._id !== user?._id) || activeDM?.participants?.[0];

  const loadMore = () => {
    if (activeRoom) {
      const nextPage = (roomPage[activeRoom._id] || 1) + 1;
      fetchRoomMessages(activeRoom._id, nextPage);
    } else if (activeDM) {
      const nextPage = (dmPage[activeDM._id] || 1) + 1;
      fetchDMMessages(activeDM._id, nextPage);
    }
  };

  const hasMore = activeRoom ? roomHasMore[activeRoom._id] : dmHasMore[activeDM?._id];

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="h-12 border-b border-slate-800 bg-[#11111b] flex items-center px-4 gap-3">
          {activeRoom ? (
            <>
              <span className="font-semibold text-slate-100">#{activeRoom.name}</span>
              {activeRoom.description && (
                <span className="text-xs text-slate-500 border-l border-slate-700 pl-3 hidden sm:block truncate">{activeRoom.description}</span>
              )}
            </>
          ) : activeDM ? (
            <div className="flex items-center gap-2">
              <UserAvatar user={getOtherDMUser()} size="sm" showStatus />
              <span className="font-semibold text-slate-100">{getOtherDMUser()?.username}</span>
            </div>
          ) : (
            <span className="text-slate-500 text-sm">Select a room or DM</span>
          )}
          <div className="ml-auto flex items-center gap-2">
            {activeRoom && (
              <>
                <button onClick={() => navigate(`/rooms/${activeRoom._id}/settings`)} className="text-slate-400 hover:text-white text-xs transition-colors px-2 py-1 rounded hover:bg-white/5">⚙</button>
                <button onClick={toggleMemberPanel} className="text-slate-400 hover:text-white text-xs transition-colors px-2 py-1 rounded hover:bg-white/5">👥</button>
              </>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {hasMore && (
            <div className="flex justify-center mb-3">
              <button onClick={loadMore} className="text-xs text-sky-400 hover:text-sky-300 border border-slate-700 px-3 py-1 rounded-full transition-colors">
                Load earlier messages
              </button>
            </div>
          )}

          {messages.length === 0 && (activeRoom || activeDM) && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-4xl mb-3">{activeRoom ? '💬' : '📩'}</div>
              <p className="text-slate-400 font-medium">{activeRoom ? `Welcome to #${activeRoom.name}!` : `Start a conversation with ${getOtherDMUser()?.username}`}</p>
              <p className="text-slate-600 text-sm mt-1">Be the first to send a message.</p>
            </div>
          )}

          {!activeRoom && !activeDM && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-5xl mb-4">⚡</div>
              <h2 className="text-xl font-bold text-slate-300">Welcome to NexTalk</h2>
              <p className="text-slate-500 text-sm mt-2">Select a room from the sidebar or browse public rooms</p>
            </div>
          )}

          {messages.map((msg) => (
            <MessageBubble
              key={msg._id}
              message={msg}
              isOwn={msg.sender?._id === user?._id}
            />
          ))}
          <TypingIndicator users={currentTyping.filter((u) => u.userId !== user?._id)} />
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {(activeRoom || activeDM) && (
          <MessageInput
            roomId={activeRoom?._id}
            conversationId={activeDM?._id}
            placeholder={activeRoom ? `Message #${activeRoom.name}` : `Message ${getOtherDMUser()?.username || ''}`}
          />
        )}
      </div>

      {/* Member panel */}
      {activeRoom && showMemberPanel && <MemberPanel room={activeRoom} />}
    </div>
  );
};

export default ChatLayout;
