"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchUserProfile, updateUserProfile } from "@/services/user.service";
import { useProfileStore } from "@/lib/store/profile.store";

const PROFILE_QUERY_KEY = ["user-profile"] as const;

export function useUserProfile() {
  const profile = useProfileStore((s) => s.profile);

  const query = useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: async () => {
      const data = await fetchUserProfile();
      useProfileStore.getState().setProfile(data);
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  return { ...query, data: profile ?? query.data };
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUserProfile,
    onSuccess: (updated) => {
      useProfileStore.getState().patchProfile(updated);
      queryClient.setQueryData(PROFILE_QUERY_KEY, updated);
    },
  });
}
