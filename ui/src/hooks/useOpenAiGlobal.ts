import { useSyncExternalStore } from "react";

const SET_GLOBALS_EVENT_TYPE = "openai:set_globals";
type SetGlobalsEvent = CustomEvent<{ globals: any }>;

export function useOpenAiGlobal<T = any>(key: string): T | undefined {
  return useSyncExternalStore(
    (onChange) => {
      const handle = (event: Event) => {
        const e = event as SetGlobalsEvent;
        if (e.detail?.globals?.[key] === undefined) return;
        onChange();
      };
      window.addEventListener(SET_GLOBALS_EVENT_TYPE, handle, { passive: true });
      return () => window.removeEventListener(SET_GLOBALS_EVENT_TYPE, handle);
    },
    () => (window as any).openai?.[key]
  );
}

export function useToolOutput<T = any>() {
  return useOpenAiGlobal<T>("toolOutput");
}
