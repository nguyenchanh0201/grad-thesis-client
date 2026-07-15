import { create } from "zustand";
import type { ProfileUser } from "@/schemas/user";

interface ProfileState {
  profile: ProfileUser | null;
  setProfile: (profile: ProfileUser) => void;
  patchProfile: (partial: Partial<ProfileUser>) => void;
  clearProfile: () => void;
}

export const useProfileStore = create<ProfileState>()((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
  patchProfile: (partial) =>
    set((state) => ({
      profile: state.profile ? { ...state.profile, ...partial } : state.profile,
    })),
  clearProfile: () => set({ profile: null }),
}));
