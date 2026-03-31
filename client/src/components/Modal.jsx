const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
    <div className="bg-[#1e1e2e] rounded-xl shadow-2xl w-full max-w-md animate-[slideUp_0.2s_ease-out]">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
        <h2 className="font-semibold text-slate-100">{title}</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors text-xl leading-none">
          ×
        </button>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  </div>
);

export default Modal;