import { useEffect, useRef } from "react";

/** Runs auto-run once when the step component mounts (not when the callback identity changes). */
export function useStepMountAutoRun(run: () => void | Promise<void>) {
  const runRef = useRef(run);
  runRef.current = run;

  useEffect(() => {
    void runRef.current();
  }, []);
}
