const TypingIndicator = ({ users = [] }) => {
  if (!users.length) return null;

  const names = users.slice(0, 2).map((u) => u.username).join(', ');
  const label = users.length > 2 ? `${names} and ${users.length - 2} more are typing...` : `${names} ${users.length === 1 ? 'is' : 'are'} typing...`;

  return (
    <div className="flex items-center gap-2 px-4 py-1 text-xs text-slate-400">
      <div className="flex gap-0.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1 h-1 bg-slate-400 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      <span>{label}</span>
    </div>
  );
};

export default TypingIndicator;