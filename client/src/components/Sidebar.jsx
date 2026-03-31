import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useChatStore from '../store/chatStore';
import useAuthStore from '../store/authStore';
import useUiStore from '../store/uiStore';
import UserAvatar from './UserAvatar';
import Modal from './Modal';
import { searchUsersApi } from '../api/user';
import toast from 'react-hot-toast';

const Sidebar = () => {
  const navigate = useNavigate();
  const { myRooms, myDMs, activeRoom, activeDM, setActiveRoom, setActiveDM, getOrCreateDM, unreadRooms, unreadDMs } = useChatStore();
  const { user, logout } = useAuthStore();
  const { showCreateRoom, setShowCreateRoom } = useUiStore();

  const [newRoom, setNewRoom] = useState({ name: '', description: '', type: 'public' });
  const [creating, setCreating] = useState(false);
  const [dmSearch, setDmSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDMSearch, setShowDMSearch] = useState(false);

  const createRoom = useChatStore((s) => s.createRoom);

  useEffect(() => {
    if (dmSearch.length < 2) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const { data } = await searchUsersApi(dmSearch);
        setSearchResults(data);
      } catch { /* ignore */ }
    }, 300);
    return () => clearTimeout(t);
  }, [dmSearch]);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoom.name.trim()) return;
    setCreating(true);
    try {
      const room = await createRoom(newRoom);
      setActiveRoom(room);
      setShowCreateRoom(false);
      setNewRoom({ name: '', description: '', type: 'public' });
      navigate('/chat');
      toast.success(`#${room.name} created!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create room');
    } finally {
      setCreating(false);
    }
  };

  const startDM = async (userId) => {
    try {
      const convo = await getOrCreateDM(userId);
      setActiveDM(convo);
      setShowDMSearch(false);
      setDmSearch('');
      setSearchResults([]);
      navigate('/chat');
    } catch { toast.error('Could not open DM'); }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getOtherParticipant = (convo) =>
    convo.participants?.find((p) => p._id !== user?._id) || convo.participants?.[0];

  return (
    <aside className="w-64 bg-[#181825] border-r border-slate-800 flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-slate-800 flex items-center justify-between">
        <span className="font-bold text-sky-400 text-lg tracking-tight">⚡ NexTalk</span>
        <button
          onClick={() => navigate('/')}
          className="text-slate-400 hover:text-white text-xs transition-colors"
          title="Browse rooms"
        >
          🔍
        </button>
      </div>

      {/* Rooms */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-3 pt-4 pb-1 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Rooms</span>
          <button onClick={() => setShowCreateRoom(true)} className="text-slate-400 hover:text-sky-400 transition-colors text-sm" title="Create room">+</button>
        </div>
        {myRooms.length === 0 && (
          <p className="text-xs text-slate-600 px-4 py-2">No rooms yet. <span className="text-sky-500 cursor-pointer hover:underline" onClick={() => navigate('/')}>Browse rooms</span></p>
        )}
        {myRooms.map((room) => (
          <button
            key={room._id}
            onClick={() => { setActiveRoom(room); navigate('/chat'); }}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg mx-1 transition-colors text-left ${
              activeRoom?._id === room._id ? 'bg-sky-900/40 text-sky-300' : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
            }`}
          >
            <span className="text-base">#</span>
            <span className="flex-1 text-sm truncate">{room.name}</span>
            {unreadRooms[room._id] > 0 && (
              <span className="bg-sky-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadRooms[room._id]}</span>
            )}
          </button>
        ))}

        {/* DMs */}
        <div className="px-3 pt-4 pb-1 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Direct Messages</span>
          <button onClick={() => setShowDMSearch((p) => !p)} className="text-slate-400 hover:text-sky-400 transition-colors text-sm" title="New DM">+</button>
        </div>

        {showDMSearch && (
          <div className="px-3 pb-2">
            <input
              value={dmSearch}
              onChange={(e) => setDmSearch(e.target.value)}
              placeholder="Search users..."
              className="w-full bg-[#1e1e2e] text-sm text-slate-100 placeholder-slate-500 px-2 py-1.5 rounded-lg outline-none border border-slate-700 focus:border-sky-600"
            />
            {searchResults.length > 0 && (
              <div className="mt-1 bg-[#1e1e2e] border border-slate-700 rounded-lg overflow-hidden">
                {searchResults.map((u) => (
                  <button
                    key={u._id}
                    onClick={() => startDM(u._id)}
                    className="w-full flex items-center gap-2 px-2 py-2 hover:bg-white/5 transition-colors text-left"
                  >
                    <UserAvatar user={u} size="sm" showStatus />
                    <span className="text-sm text-slate-200">{u.username}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {myDMs.map((convo) => {
          const other = getOtherParticipant(convo);
          return (
            <button
              key={convo._id}
              onClick={() => { setActiveDM(convo); navigate('/chat'); }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg mx-1 transition-colors text-left ${
                activeDM?._id === convo._id ? 'bg-sky-900/40 text-sky-300' : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
              }`}
            >
              <UserAvatar user={other} size="sm" showStatus />
              <span className="flex-1 text-sm truncate">{other?.username}</span>
              {unreadDMs[convo._id] > 0 && (
                <span className="bg-sky-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadDMs[convo._id]}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* User footer */}
      <div className="border-t border-slate-800 px-3 py-3 flex items-center gap-2">
        <button onClick={() => navigate('/profile')} className="flex-1 flex items-center gap-2 hover:bg-white/5 rounded-lg p-1 transition-colors min-w-0">
          <UserAvatar user={user} size="sm" showStatus />
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium text-slate-200 truncate">{user?.username}</p>
            <p className="text-xs text-slate-500 truncate">{user?.status === 'online' ? '🟢 Online' : '⚫ Offline'}</p>
          </div>
        </button>
        <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 transition-colors text-sm p-1" title="Logout">⏻</button>
      </div>

      {/* Create room modal */}
      {showCreateRoom && (
        <Modal title="Create Room" onClose={() => setShowCreateRoom(false)}>
          <form onSubmit={handleCreateRoom} className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Room Name *</label>
              <input className="input-field" placeholder="e.g. general, dev-talk" value={newRoom.name} onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })} required />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Description</label>
              <input className="input-field" placeholder="What's this room about?" value={newRoom.description} onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Type</label>
              <select className="input-field" value={newRoom.type} onChange={(e) => setNewRoom({ ...newRoom, type: e.target.value })}>
                <option value="public">🌐 Public</option>
                <option value="private">🔒 Private</option>
              </select>
            </div>
            <button type="submit" disabled={creating} className="btn-primary w-full">
              {creating ? 'Creating...' : 'Create Room'}
            </button>
          </form>
        </Modal>
      )}
    </aside>
  );
};

export default Sidebar;
