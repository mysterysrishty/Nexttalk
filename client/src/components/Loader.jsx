const Loader = ({ size = 'md', center = false }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-7 h-7', lg: 'w-12 h-12' };
  const el = (
    <div
      className={`${sizes[size]} border-2 border-slate-600 border-t-sky-500 rounded-full animate-spin`}
    />
  );
  if (center) return <div className="flex items-center justify-center h-full">{el}</div>;
  return el;
};

export default Loader;