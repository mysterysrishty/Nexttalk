import { useState, useRef, useCallback } from 'react';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { getSocket } from '../socket/socket';
import { uploadFileApi } from '../api/user';
import useAuthStore from '../store/authStore';

let typingTimeout = null;

const MessageInput = ({ roomId, conversationId, placeholder = 'Message...' }) => {
  const [text, setText] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const user = useAuthStore((s) => s.user);

  const emitTyping = useCallback(() => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit('typing', { roomId, conversationId });
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      socket.emit('stop_typing', { roomId, conversationId });
    }, 1500);
  }, [roomId, conversationId]);

  const sendMessage = () => {
    if (!text.trim()) return;
    const socket = getSocket();
    if (!socket) return;
    if (roomId) socket.emit('send_message', { roomId, content: text.trim() });
    if (conversationId) socket.emit('send_dm', { conversationId, content: text.trim() });
    socket.emit('stop_typing', { roomId, conversationId });
    setText('');
    setShowPicker(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data: res } = await uploadFileApi(formData);
      const socket = getSocket();
      if (!socket) return;
      const payload = { fileUrl: res.url, fileName: res.fileName, type: res.type, content: res.fileName };
      if (roomId) socket.emit('send_message', { roomId, ...payload });
      if (conversationId) socket.emit('send_dm', { conversationId, ...payload });
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const addEmoji = (emoji) => {
    setText((t) => t + emoji.native);
  };

  return (
    <div className="relative px-4 py-3 border-t border-slate-800 bg-[#11111b]">
      {showPicker && (
        <div className="absolute bottom-full left-4 mb-2 z-50">
          <Picker data={data} onEmojiSelect={addEmoji} theme="dark" previewPosition="none" skinTonePosition="none" />
        </div>
      )}
      <div className="flex items-center gap-2 bg-[#1e1e2e] rounded-xl px-3 py-2">
        <button
          onClick={() => setShowPicker((p) => !p)}
          className="text-slate-400 hover:text-yellow-400 transition-colors text-lg"
          title="Emoji"
        >
          😊
        </button>

        <textarea
          value={text}
          onChange={(e) => { setText(e.target.value); emitTyping(); }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 resize-none outline-none text-sm max-h-28 overflow-y-auto"
          style={{ lineHeight: '1.5rem' }}
        />

        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="text-slate-400 hover:text-sky-400 transition-colors text-base"
          title="Attach file"
        >
          {uploading ? '⏳' : '📎'}
        </button>
        <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange} />

        <button
          onClick={sendMessage}
          disabled={!text.trim()}
          className="bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
