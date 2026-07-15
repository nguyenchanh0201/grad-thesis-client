import { useCallback } from "react";

export function useHeaderSize() {
  return useCallback((el: HTMLElement | null) => {
    if (!el) return;

    const update = () => {
      document.documentElement.style.setProperty(
        "--header-height",
        `${el.offsetHeight}px`,
      );
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(el);

    return () => observer.disconnect();
  }, []);
}
