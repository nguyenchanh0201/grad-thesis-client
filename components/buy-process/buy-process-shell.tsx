"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useParams, usePathname } from "next/navigation";
import { useBuyProcessSession } from "@/hooks/use-buy-process-session";
import { ProgressSteps } from "@/components/ticket-selection/progress-steps";
import { TimeoutModal } from "@/components/ticket-selection/timeout-modal";
import { AlertDialog } from "@/components/ui/alert-dialog";

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
  const session = useBuyProcessSession(slug, {
    skipReservationSync: step.skipReservationSync ?? false,
  });
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const { formatted, timeRemaining, timedOut, hasSyncedExpiry } = session;
  const isWarning = timeRemaining <= 60;

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  useEffect(() => {
    window.history.pushState({ buyFlowGuard: true }, "");
    const onPopState = () => {
      window.history.pushState({ buyFlowGuard: true }, "");
      setIsLeaveDialogOpen(true);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const backHref = useMemo(() => {
    if (step.backHref) return step.backHref;
    if (step.currentStep === 2) return `/buy/${slug}/tickets`;
    if (step.currentStep === 3) return `/buy/${slug}/info`;
    return "/events";
  }, [slug, step.backHref, step.currentStep]);

  const handleStepBack = step.confirmBack
    ? () => setIsLeaveDialogOpen(true)
    : undefined;

  const handleExitPurchaseFlow = () => {
    void session.exitPurchaseFlow({
      cancelActiveReservation: true,
      clearSession: true,
    });
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
