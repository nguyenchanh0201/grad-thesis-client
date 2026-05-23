"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { clearBuySession } from "@/lib/booking/buy-session";
import { useBuyProcessSession } from "@/hooks/use-buy-process-session";
import { useBookingStore } from "@/lib/store/booking";
import { getPaymentConfirmationStatus } from "@/services/payment.service";
import { ProgressSteps } from "@/components/ticket-selection/progress-steps";
import { TimeoutModal } from "@/components/ticket-selection/timeout-modal";
import { AlertDialog } from "@/components/ui/alert-dialog";
import {
  isNavigationFrozen,
  shouldRedirectToGatewayStep,
} from "./navigation-policy";

type BuyStep = {
  key: string;
  currentStep: number;
  backHref?: string;
  confirmBack?: boolean;
  skipReservationSync?: boolean;
};

const BUY_STEPS: Record<string, BuyStep> = {
  tickets: { key: "tickets", currentStep: 1, confirmBack: true },
  info: { key: "info", currentStep: 2 },
  payment: { key: "payment", currentStep: 3 },
  confirmation: {
    key: "confirmation",
    currentStep: 3,
    skipReservationSync: true,
  },
};

type BuyProcessContextValue = ReturnType<typeof useBuyProcessSession>;

const BuyProcessContext = createContext<BuyProcessContextValue | null>(null);

type Props = {
  children: ReactNode;
};

export function BuyProcessShell({ children }: Props) {
  const pathname = usePathname();
  const params = useParams<{ slug?: string | string[] }>();
  const slugParam = params.slug;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;
  const routeStep = pathname.split("/").filter(Boolean)[2];
  const step = routeStep ? BUY_STEPS[routeStep] : undefined;

  if (!slug || !step) {
    return <>{children}</>;
  }

  return (
    <ActiveBuyProcessShell slug={slug} step={step}>
      {children}
    </ActiveBuyProcessShell>
  );
}

function ActiveBuyProcessShell({
  children,
  slug,
  step,
}: Props & {
  slug: string;
  step: BuyStep;
}) {
  const router = useRouter();
  const reservationId = useBookingStore((state) => state.reservationId);
  const session = useBuyProcessSession(slug, {
    skipReservationSync: step.skipReservationSync ?? false,
  });
  const { data: confirmation } = useQuery({
    queryKey: ["payment-confirmation", reservationId],
    queryFn: () => getPaymentConfirmationStatus(reservationId!),
    enabled: !!reservationId,
    retry: false,
    refetchInterval: 5_000,
  });
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const { formatted, timeRemaining, timedOut, hasSyncedExpiry } = session;
  const isWarning = timeRemaining <= 60;
  const isFlowFrozen = isNavigationFrozen(confirmation?.payment?.status);

  useEffect(() => {
    if (
      !shouldRedirectToGatewayStep(
        step.currentStep,
        confirmation?.payment?.status,
        step.key === "confirmation",
      )
    ) {
      return;
    }
    router.replace(`/buy/${slug}/confirmation`);
  }, [confirmation?.payment?.status, router, slug, step.currentStep]);

  const backHref = useMemo(() => {
    if (step.backHref) return step.backHref;
    if (step.currentStep === 2) return `/buy/${slug}/tickets`;
    if (step.key === "confirmation") {
      return isFlowFrozen ? `/buy/${slug}/confirmation` : `/buy/${slug}/payment`;
    }
    if (step.currentStep === 3) return `/buy/${slug}/info`;
    return "/events";
  }, [isFlowFrozen, slug, step.backHref, step.currentStep, step.key]);

  const handleStepBack = step.confirmBack
    ? () => setIsLeaveDialogOpen(true)
    : undefined;

  const handleExitPurchaseFlow = () => {
    clearBuySession(slug);
    session.exitPurchaseFlow();
  };

  return (
    <BuyProcessContext.Provider value={session}>
      <div className="flex min-h-[calc(100vh-var(--header-height))] flex-col">
        <ProgressSteps
          currentStep={step.currentStep}
          formatted={formatted}
          isWarning={hasSyncedExpiry && isWarning}
          backHref={backHref}
          onBack={handleStepBack}
        />
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>

      <AlertDialog
        open={isLeaveDialogOpen}
        onOpenChange={setIsLeaveDialogOpen}
        title="Leave ticket selection?"
        description="If you leave now, your booking session will be cleared and you may need to rejoin the queue."
        confirmLabel="Leave"
        cancelLabel="Stay"
        confirmVariant="destructive"
        onConfirm={handleExitPurchaseFlow}
      />
      <TimeoutModal
        open={timedOut}
        isLoading
        title="Booking session expired"
        description="Your booking time is over. Please wait while we redirect you back to the event page."
        loadingLabel="Redirecting..."
      />
    </BuyProcessContext.Provider>
  );
}

export function useBuyProcess() {
  const context = useContext(BuyProcessContext);
  if (!context) {
    throw new Error("useBuyProcess must be used within BuyProcessShell");
  }
  return context;
}
