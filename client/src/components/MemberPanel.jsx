import { useNavigate } from 'react-router-dom';
import useChatStore from '../store/chatStore';
import useAuthStore from '../store/authStore';
import UserAvatar from './UserAvatar';

const MemberPanel = ({ room }) => {
  const { getOrCreateDM, setActiveDM } = useChatStore();
  const user = useChatStore((s) => s);
  const navigate = useNavigate();

  if (!room) return (
    <div className="w-64 bg-[#181825] border-l border-slate-800 p-4 flex items-center justify-center text-slate-500 text-sm">
      Select a room
    </div>
  );

  const online = room.members?.filter((m) => m.status === 'online') || [];
  const offline = room.members?.filter((m) => m.status !== 'online') || [];

  const handleDM = async (memberId) => {
    try {
      const convo = await getOrCreateDM(memberId);
      setActiveDM(convo);
      navigate('/chat');
    } catch (e) {
      console.error(e);
    }
  };

  const MemberItem = ({ member }) => (
    <div
      className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-white/5 cursor-pointer group transition-colors"
      onClick={() => handleDM(member._id)}
      title={`DM ${member.username}`}
    >
      <UserAvatar user={member} size="sm" showStatus />
      <span className={`text-sm truncate ${member.status === 'online' ? 'text-slate-200' : 'text-slate-500'}`}>
        {member.username}
      </span>
    </div>
  );

  return (
    <div className="w-64 bg-[#181825] border-l border-slate-800 flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-800">
        <h3 className="font-semibold text-slate-200 text-sm">#{room.name}</h3>
        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{room.description}</p>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {online.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 px-2">Online — {online.length}</p>
            {online.map((m) => <MemberItem key={m._id} member={m} />)}
          </div>
        )}
        {offline.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 px-2">Offline — {offline.length}</p>
            {offline.map((m) => <MemberItem key={m._id} member={m} />)}
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberPanel;
