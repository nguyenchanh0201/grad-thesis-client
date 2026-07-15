import type { SVGProps, ComponentType } from "react";
import { UKFlag } from "./uk";
import { VNFlag } from "./vn";

type FlagComponent = ComponentType<SVGProps<SVGSVGElement>>;

const registry: Record<string, FlagComponent> = {
  en: UKFlag,
  vi: VNFlag,
};

export type FlagIconProps = SVGProps<SVGSVGElement> & { code: string };

export function FlagIcon({ code, ...props }: FlagIconProps) {
  const Flag = registry[code];
  if (!Flag) return null;
  return <Flag {...props} />;
}

export { UKFlag, VNFlag };
