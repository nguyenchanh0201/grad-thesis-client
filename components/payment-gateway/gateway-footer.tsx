type Props = {
  providerName?: string;
};

export function GatewayFooter({ providerName = "VNPay" }: Props) {
  return (
    <div className="border-t border-border py-5 text-center">
      <span className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Powered by
        <span className="font-extrabold tracking-tight text-[#003087]">
          {providerName}
        </span>
      </span>
    </div>
  );
}
