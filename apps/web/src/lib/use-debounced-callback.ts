"use client";

import { useCallback, useEffect, useRef } from "react";

export function useDebouncedCallback<T extends (...args: never[]) => void>(
  callback: T,
  delayMs: number,
): T & { flush: () => void; cancel: () => void } {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  const timeoutRef = useRef<number | null>(null);
  const pendingArgsRef = useRef<Parameters<T> | null>(null);

  const cancel = useCallback(() => {
    if (timeoutRef.current != null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    pendingArgsRef.current = null;
  }, []);

  const flush = useCallback(() => {
    if (timeoutRef.current != null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (pendingArgsRef.current == null) {
      return;
    }
    const args = pendingArgsRef.current;
    pendingArgsRef.current = null;
    callbackRef.current(...args);
  }, []);

  const debounced = useCallback(
    (...args: Parameters<T>) => {
      pendingArgsRef.current = args;
      if (timeoutRef.current != null) {
        window.clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => {
        timeoutRef.current = null;
        if (pendingArgsRef.current == null) {
          return;
        }
        const nextArgs = pendingArgsRef.current;
        pendingArgsRef.current = null;
        callbackRef.current(...nextArgs);
      }, delayMs);
    },
    [delayMs],
  ) as T;

  useEffect(
    () => () => {
      if (timeoutRef.current != null) {
        window.clearTimeout(timeoutRef.current);
      }
    },
    [],
  );

  return Object.assign(debounced, { flush, cancel }) as T & {
    flush: () => void;
    cancel: () => void;
  };
}
