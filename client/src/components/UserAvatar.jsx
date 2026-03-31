const colors = [
  'bg-purple-500', 'bg-pink-500', 'bg-indigo-500',
  'bg-teal-500', 'bg-orange-500', 'bg-sky-500',
];

const getColor = (name = '') => colors[name.charCodeAt(0) % colors.length];

const UserAvatar = ({ user, size = 'md', showStatus = false }) => {
  const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base' };
  const statusSizes = { sm: 'w-2 h-2', md: 'w-2.5 h-2.5', lg: 'w-3 h-3' };

  return (
    <div className="relative flex-shrink-0">
      {user?.avatar ? (
        <img
          src={user.avatar}
          alt={user.username}
          className={`${sizes[size]} rounded-full object-cover`}
        />
      ) : (
        <div
          className={`${sizes[size]} ${getColor(user?.username)} rounded-full flex items-center justify-center font-bold text-white uppercase`}
        >
          {(user?.username || '?')[0]}
        </div>
      )}
      {showStatus && (
        <span
          className={`absolute bottom-0 right-0 ${statusSizes[size]} rounded-full border-2 border-[#11111b] ${
            user?.status === 'online' ? 'bg-green-500' : 'bg-slate-500'
          }`}
        />
      )}
    </div>
  );
};

export default UserAvatar;
