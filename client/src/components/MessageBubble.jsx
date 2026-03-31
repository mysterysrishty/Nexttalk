import { useState } from 'react';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import UserAvatar from './UserAvatar';
import useAuthStore from '../store/authStore';
import api from '../api/axios';
import useChatStore from '../store/chatStore';
import { getSocket } from '../socket/socket';

const fmt = (iso) => {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const MessageBubble = ({ message, isOwn }) => {
  const [showPicker, setShowPicker] = useState(false);
  const user = useAuthStore((s) => s.user);
  const updateMessageReaction = useChatStore((s) => s.updateMessageReaction);

  const handleReact = async (emoji) => {
    try {
      const { data: updated } = await api.post(`/messages/${message._id}/react`, { emoji: emoji.native });
      updateMessageReaction(updated);
      const socket = getSocket();
      if (socket) {
        if (updated.room) socket.emit('message_reaction', { roomId: updated.room, message: updated });
        if (updated.directConversation) socket.emit('message_reaction', { conversationId: updated.directConversation, message: updated });
      }
    } catch (e) {
      console.error(e);
    }
    setShowPicker(false);
  };

  return (
    <div className={`flex items-end gap-2 mb-1 group ${isOwn ? 'flex-row-reverse' : ''}`}>
      {!isOwn && <UserAvatar user={message.sender} size="sm" />}

      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
        {!isOwn && (
          <span className="text-xs text-slate-400 mb-1 ml-1">{message.sender?.username}</span>
        )}

        <div
          className={`relative px-3 py-2 rounded-2xl text-sm ${
            isOwn
              ? 'bg-sky-600 text-white rounded-br-none'
              : 'bg-[#1e1e2e] text-slate-100 rounded-bl-none'
          }`}
        >
          {message.type === 'image' ? (
            <img
              src={message.fileUrl}
              alt={message.fileName}
              className="max-w-xs rounded-lg cursor-pointer"
              onClick={() => window.open(message.fileUrl, '_blank')}
            />
          ) : message.type === 'file' ? (
            <a
              href={message.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-sky-300 underline"
            >
              📎 {message.fileName}
            </a>
          ) : (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          )}

          {/* Emoji trigger */}
          <button
            onClick={() => setShowPicker((p) => !p)}
            className="absolute -right-6 top-1 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-white text-xs"
          >
            😊
          </button>

          {showPicker && (
            <div className="absolute z-50 bottom-full right-0 mb-1">
              <Picker
                data={data}
                onEmojiSelect={handleReact}
                theme="dark"
                previewPosition="none"
                skinTonePosition="none"
              />
            </div>
          )}
        </div>

        {/* Reactions */}
        {message.reactions?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {message.reactions.map((r) => (
              <button
                key={r.emoji}
                onClick={() => handleReact({ native: r.emoji })}
                className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full border transition-colors ${
                  r.users.includes(user?._id)
                    ? 'bg-sky-900/50 border-sky-600 text-sky-300'
                    : 'bg-[#1e1e2e] border-slate-700 text-slate-300 hover:border-slate-500'
                }`}
              >
                {r.emoji} <span>{r.users.length}</span>
              </button>
            ))}
          </div>
        )}

        <span className="text-[10px] text-slate-500 mt-0.5 px-1">{fmt(message.createdAt)}</span>
      </div>
    </div>
  );
};

export default MessageBubble;
