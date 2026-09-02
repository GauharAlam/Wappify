"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SkipOnboardingButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSkip = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding/skip", { method: "POST" });
      const data = await res.json();
      if (data.success && data.redirect) {
        router.push(data.redirect);
        router.refresh();
      } else {
        router.push("/inbox");
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to skip onboarding:", error);
      router.push("/inbox");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      onClick={handleSkip}
      disabled={loading}
      className="text-neutral-500 hover:text-neutral-900"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Skipping...
        </>
      ) : (
        <>
          Skip for now
          <ArrowRight className="ml-2 h-4 w-4" />
        </>
      )}
    </Button>
  );
}
