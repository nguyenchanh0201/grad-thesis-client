import type { ActiveCheckoutReservation } from "@/schemas/reservation";

export type QueueGateState =
  | "checking"
  | "blocked"
  | "allowed"
  | "canceling"
  | "error";

export type ResolveQueueGateStateInput = {
  targetSlug: string;
  isQueueIntentValid: boolean;
  hasUser: boolean;
  isCheckingActiveCheckout: boolean;
  isActiveCheckoutError: boolean;
  isCanceling: boolean;
  allowedAfterCancelSlug: string | null;
  activeCheckout: ActiveCheckoutReservation | null;
};

export function resolveQueueGateState({
  targetSlug,
  isQueueIntentValid,
  hasUser,
  isCheckingActiveCheckout,
  isActiveCheckoutError,
  isCanceling,
  allowedAfterCancelSlug,
  activeCheckout,
}: ResolveQueueGateStateInput): QueueGateState {
  if (allowedAfterCancelSlug === targetSlug) return "allowed";
  if (isCanceling) return "canceling";
  if (!isQueueIntentValid || !hasUser || isCheckingActiveCheckout) {
    return "checking";
  }
  if (isActiveCheckoutError) return "error";
  if (activeCheckout) return "blocked";
  return "allowed";
}
