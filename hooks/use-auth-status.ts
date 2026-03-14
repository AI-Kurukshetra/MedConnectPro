"use client";

import { useMemo } from "react";

export function useAuthStatus() {
  return useMemo(() => {
    return {
      isAuthenticated: false,
      isLoading: false
    };
  }, []);
}
