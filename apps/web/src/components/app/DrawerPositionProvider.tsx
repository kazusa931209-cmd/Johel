"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getStoredDrawerPosition,
  persistDrawerPosition,
  type DrawerPosition,
} from "@/lib/drawer-position";

type DrawerPositionContextValue = {
  drawerPosition: DrawerPosition;
  setDrawerPosition: (position: DrawerPosition) => void;
};

const DrawerPositionContext = createContext<DrawerPositionContextValue | null>(
  null,
);

export function DrawerPositionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [drawerPosition, setDrawerPositionState] =
    useState<DrawerPosition>("right");

  useEffect(() => {
    setDrawerPositionState(getStoredDrawerPosition());
  }, []);

  const setDrawerPosition = useCallback((next: DrawerPosition) => {
    setDrawerPositionState(next);
    persistDrawerPosition(next);
  }, []);

  const value = useMemo(
    () => ({ drawerPosition, setDrawerPosition }),
    [drawerPosition, setDrawerPosition],
  );

  return (
    <DrawerPositionContext.Provider value={value}>
      {children}
    </DrawerPositionContext.Provider>
  );
}

export function useDrawerPosition() {
  const ctx = useContext(DrawerPositionContext);
  if (!ctx) {
    throw new Error(
      "useDrawerPosition must be used within DrawerPositionProvider",
    );
  }
  return ctx;
}
