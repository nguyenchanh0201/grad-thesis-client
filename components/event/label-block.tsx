import { cn } from "@/lib/utils";

export type LabelBorder = "top" | "bottom" | "left" | "right" | "none";
export type LabelAlign = "left" | "right";
export type LabelPosition = "top" | "bottom" | "left" | "right";

export function LabelBlock({
  label,
  labelBorder = "bottom",
  labelAlign = "left",
  vertical = false,
}: {
  label: string;
  labelBorder?: LabelBorder;
  labelAlign?: LabelAlign;
  vertical?: boolean;
}) {
  const textCls = cn(
    "text-lg font-bold uppercase tracking-widest text-foreground select-none",
    vertical && "[writing-mode:vertical-rl] rotate-180",
  );
  const alignCls = labelAlign === "right" && !vertical ? "ml-auto" : "";
  const accentCls = "w-8 border-t-[3px] border-foreground";

  if (labelBorder === "top") {
    return (
      <div className={alignCls}>
        <div className={cn(accentCls, "mb-1")} />
        <span className={textCls}>{label}</span>
      </div>
    );
  }
  if (labelBorder === "bottom") {
    return (
      <div className={alignCls}>
        <span className={textCls}>{label}</span>
        <div className={cn(accentCls, "mt-1")} />
      </div>
    );
  }
  if (labelBorder === "left") {
    return (
      <div className={cn("border-l-[3px] border-foreground pl-2.5", alignCls)}>
        <span className={textCls}>{label}</span>
      </div>
    );
  }
  if (labelBorder === "right") {
    return (
      <div className={cn("border-r-[3px] border-foreground pr-2.5", alignCls)}>
        <span className={textCls}>{label}</span>
      </div>
    );
  }
  return (
    <div className={alignCls}>
      <span className={textCls}>{label}</span>
    </div>
  );
}
