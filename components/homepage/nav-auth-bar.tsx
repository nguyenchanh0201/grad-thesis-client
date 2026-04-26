import { AuthButtons } from "./auth-buttons";
import { LangSelector } from "./lang-selector";

export function NavAuthBar() {
  return (
    <div className="flex items-center gap-3">
      <AuthButtons />
      <span className="w-px h-6 bg-border" />
      <LangSelector />
    </div>
  );
}
