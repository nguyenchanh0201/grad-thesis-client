import { GoogleButton } from "@/components/auth/google-button";

interface AuthSocialActionsProps {
  authPath?: string;
  disabled?: boolean;
}

export function AuthSocialActions({
  authPath,
  disabled,
}: AuthSocialActionsProps) {
  return <GoogleButton authPath={authPath} disabled={disabled} />;
}
