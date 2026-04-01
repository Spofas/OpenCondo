"use client";

import { useState, useCallback } from "react";

interface UseFormActionReturn {
  error: string;
  isSubmitting: boolean;
  handleAction: <T>(
    action: () => Promise<{ error?: string; success?: boolean } | { error: string }>,
    onSuccess?: () => void
  ) => Promise<void>;
  setError: (error: string) => void;
}

/**
 * Hook that encapsulates the common form submission pattern:
 * - Tracks submitting state
 * - Tracks error state
 * - Calls a server action and handles error/success
 */
export function useFormAction(): UseFormActionReturn {
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAction = useCallback(
    async (
      action: () => Promise<{ error?: string; success?: boolean } | { error: string }>,
      onSuccess?: () => void
    ) => {
      setIsSubmitting(true);
      setError("");

      const result = await action();

      if ("error" in result && result.error) {
        setError(result.error);
        setIsSubmitting(false);
        return;
      }

      onSuccess?.();
    },
    []
  );

  return { error, isSubmitting, handleAction, setError };
}
