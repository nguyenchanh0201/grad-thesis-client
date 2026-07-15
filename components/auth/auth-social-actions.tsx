import { GoogleButton } from "@/components/auth/google-button";

interface AuthSocialActionsProps {
  disabled?: boolean;
}

export function AuthSocialActions({ disabled }: AuthSocialActionsProps) {
  return <GoogleButton disabled={disabled} />;
}
