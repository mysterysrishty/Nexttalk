import { useNavigate } from 'react-router-dom';
import useChatStore from '../store/chatStore';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const RoomCard = ({ room }) => {
  const { joinRoom, myRooms, setActiveRoom } = useChatStore();
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const isMember = myRooms.some((r) => r._id === room._id) ||
    room.members?.some((m) => (m._id || m) === user?._id);

  const handleClick = async () => {
    if (isMember) {
      setActiveRoom(room);
      navigate('/chat');
    } else {
      try {
        const joined = await joinRoom(room._id);
        setActiveRoom(joined);
        navigate('/chat');
        toast.success(`Joined #${room.name}`);
      } catch {
        toast.error('Failed to join room');
      }
    }
  };

  return (
    <div
      onClick={handleClick}
      className="bg-[#1e1e2e] hover:bg-[#25253a] border border-slate-800 hover:border-slate-600 rounded-xl p-4 cursor-pointer transition-all group"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-sky-700 rounded-lg flex items-center justify-center text-lg font-bold text-white flex-shrink-0">
          {room.avatar ? <img src={room.avatar} alt="" className="w-full h-full object-cover rounded-lg" /> : room.name[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-100 truncate">#{room.name}</h3>
            {room.type === 'private' && (
              <span className="text-[10px] bg-amber-900/40 text-amber-400 border border-amber-800 px-1.5 py-0.5 rounded-full">private</span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{room.description || 'No description'}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
            <span>👥 {room.members?.length || 0} members</span>
            {isMember && <span className="text-sky-400">✓ Joined</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomCard;
