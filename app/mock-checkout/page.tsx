"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  RotateCcw,
  Lock,
  ChevronRight,
  Loader2,
} from "lucide-react";

const OUTCOMES = [
  {
    key: "success",
    label: "Approve Payment",
    sublabel: "Simulate successful transaction",
    code: "00",
    icon: CheckCircle2,
    cls: "bg-emerald-500 hover:bg-emerald-600 text-white",
    iconCls: "text-white/80",
    codeCls: "bg-white/20 text-white",
    hero: true,
  },
  {
    key: "insufficient",
    label: "Insufficient Balance",
    sublabel: "Account funds too low",
    code: "51",
    icon: AlertCircle,
    cls: "bg-amber-50 hover:bg-amber-100 text-amber-900",
    iconCls: "text-amber-500",
    codeCls: "bg-amber-100 text-amber-600",
    hero: false,
  },
  {
    key: "cancel",
    label: "Cancel Transaction",
    sublabel: "Customer cancelled",
    code: "24",
    icon: RotateCcw,
    cls: "bg-slate-100 hover:bg-slate-150 text-slate-700",
    iconCls: "text-slate-400",
    codeCls: "bg-slate-200 text-slate-500",
    hero: false,
  },
  {
    key: "failed",
    label: "Payment Declined",
    sublabel: "Bank or system error",
    code: "99",
    icon: XCircle,
    cls: "bg-red-50 hover:bg-red-100 text-red-800",
    iconCls: "text-red-400",
    codeCls: "bg-red-100 text-red-500",
    hero: false,
  },
] as const;

function MockCheckout() {
  const params = useSearchParams();
  const txnRef = params.get("txnRef") ?? "";
  const amount = params.get("amount") ?? "";
  const [loading, setLoading] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const amountDisplay = amount
    ? new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(Number(amount))
    : "—";

  async function simulate(outcome: string) {
    if (loading || !txnRef) return;
    setLoading(true);
    setActiveKey(outcome);
    try {
      await fetch("/api/payment/mock/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txnRef, amount, outcome }),
      });
    } finally {
      window.close();
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap');
        .vp-root * { font-family: 'Be Vietnam Pro', system-ui, sans-serif; }
        .hover\\:bg-slate-150:hover { background-color: #e8eaed; }
      `}</style>

      <div
        className="vp-root min-h-screen flex flex-col items-center justify-center px-4 py-10"
        style={{ background: "#f0f2f5" }}
      >
        {/* Card — no border, very light shadow */}
        <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden"
          style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}
        >

          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "#e8192c" }}
              >
                <Lock className="w-4 h-4 text-white" />
              </div>
              <span className="text-[15px] font-bold text-slate-800 tracking-tight">MockPay</span>
            </div>
            <span className="text-[10px] font-semibold tracking-widest uppercase text-amber-600 bg-amber-50 rounded-full px-3 py-1">
              Simulation
            </span>
          </div>

          {/* Amount */}
          <div className="px-6 pb-5">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-1">
              Total amount due
            </p>
            <p className="text-4xl font-bold text-slate-900 tracking-tight leading-none">
              {amountDisplay}
            </p>
            {txnRef && (
              <p className="text-xs text-slate-400 font-mono mt-2 truncate">
                Ref: {txnRef}
              </p>
            )}
          </div>

          {/* Thin rule */}
          <div className="mx-6 h-px bg-slate-100" />

          {/* Outcomes */}
          <div className="px-6 pt-5 pb-6 flex flex-col gap-2.5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
              Choose an outcome
            </p>

            {OUTCOMES.map(({ key, label, sublabel, code, icon: Icon, cls, iconCls, codeCls, hero }) => {
              const isActive = activeKey === key && loading;
              return (
                <button
                  key={key}
                  onClick={() => simulate(key)}
                  disabled={loading || !txnRef}
                  className={[
                    "w-full text-left rounded-2xl px-4 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed",
                    hero ? "py-4" : "py-3",
                    cls,
                  ].join(" ")}
                >
                  <div className="flex items-center gap-3">
                    <div className="shrink-0">
                      {isActive ? (
                        <Loader2 className={`w-5 h-5 ${iconCls} animate-spin`} />
                      ) : (
                        <Icon className={`w-5 h-5 ${iconCls}`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold leading-none ${hero ? "text-[15px]" : "text-sm"}`}>
                        {label}
                      </p>
                      <p className="text-[11px] opacity-60 mt-1 leading-none">{sublabel}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ${codeCls}`}>
                        {code}
                      </span>
                      {!isActive && (
                        <ChevronRight className="w-3.5 h-3.5 opacity-30" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="bg-slate-50 px-6 py-3 flex items-center justify-center gap-1.5">
            <Lock className="w-3 h-3 text-slate-300" />
            <p className="text-[11px] text-slate-400">
              This is a test environment — no real payments are made
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default function MockCheckoutPage() {
  return (
    <Suspense>
      <MockCheckout />
    </Suspense>
  );
}
