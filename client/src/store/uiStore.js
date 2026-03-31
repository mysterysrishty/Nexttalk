import { create } from 'zustand';

const useUiStore = create((set) => ({
  showCreateRoom: false,
  showProfile: false,
  showMemberPanel: true,
  isMobileSidebarOpen: false,

  setShowCreateRoom: (v) => set({ showCreateRoom: v }),
  setShowProfile: (v) => set({ showProfile: v }),
  toggleMemberPanel: () => set((s) => ({ showMemberPanel: !s.showMemberPanel })),
  setMobileSidebarOpen: (v) => set({ isMobileSidebarOpen: v }),
}));

export default useUiStore;