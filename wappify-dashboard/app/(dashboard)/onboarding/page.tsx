"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  CreditCard,
  Bot,
  Store,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Lock,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────
// Types & Constants
// ─────────────────────────────────────────────

type Step = "business" | "whatsapp" | "payments" | "ai" | "success";

const STEPS: Step[] = ["business", "whatsapp", "payments", "ai", "success"];

interface OnboardingData {
  name: string;
  whatsappNumber: string;
  whatsappPhoneId: string;
  whatsappAccessToken: string;
  razorpayKeyId: string;
  razorpayKeySecret: string;
  aiContext: string;
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-8">
      {STEPS.slice(0, -1).map((_, i) => (
        <React.Fragment key={i}>
          <div
            className={cn(
              "h-2 w-2 rounded-full transition-all duration-500",
              i <= currentStep ? "bg-primary w-6" : "bg-muted"
            )}
          />
          {i < STEPS.length - 2 && (
            <div className="h-0.5 w-4 bg-muted" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStepIdx, setCurrentStepIdx] = React.useState(0);
  const [isSaving, setIsSaving] = React.useState(false);
  const [data, setData] = React.useState<OnboardingData>({
    name: "",
    whatsappNumber: "",
    whatsappPhoneId: "",
    whatsappAccessToken: "",
    razorpayKeyId: "",
    razorpayKeySecret: "",
    aiContext: "",
  });

  const currentStep = STEPS[currentStepIdx];

  const handleNext = async () => {
    if (currentStepIdx < STEPS.length - 1) {
      if (currentStep === "ai") {
        await finalizeOnboarding();
      } else {
        setCurrentStepIdx((prev) => prev + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx((prev) => prev - 1);
    }
  };

  const finalizeOnboarding = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to save settings");

      setCurrentStepIdx(STEPS.length - 1); // Go to success step
    } catch (err) {
      console.error(err);
      alert("Error saving your profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        
        <AnimatePresence mode="wait">
          {currentStep !== "success" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center mb-10"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                <Zap className="h-6 w-6 font-bold" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-neutral-900 mb-2">
                Let's set up your Store
              </h1>
              <p className="text-neutral-500 max-w-md mx-auto">
                Complete these 4 simple steps to launch your WhatsApp Commerce platform.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <Card className="shadow-2xl shadow-neutral-200/50 border-neutral-100 overflow-hidden">
          <CardContent className="p-0">
            {currentStep !== "success" && (
              <div className="px-8 pt-8">
                <StepIndicator currentStep={currentStepIdx} />
              </div>
            )}

            <div className="p-8">
              <AnimatePresence mode="wait">
                {currentStep === "business" && (
                  <motion.div
                    key="business"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="space-y-1">
                      <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Store className="h-5 w-5 text-neutral-400" />
                        Business Profile
                      </h2>
                      <p className="text-sm text-neutral-500">How should your store appear to customers?</p>
                    </div>

                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Store Name</Label>
                        <Input
                          id="name"
                          placeholder="e.g. StyleHouse India"
                          value={data.name}
                          onChange={(e) => setData({ ...data, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="wa">WhatsApp Business Number</Label>
                        <Input
                          id="wa"
                          placeholder="919876543210"
                          value={data.whatsappNumber}
                          onChange={(e) => setData({ ...data, whatsappNumber: e.target.value })}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {currentStep === "whatsapp" && (
                  <motion.div
                    key="whatsapp"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="space-y-1">
                      <h2 className="text-xl font-semibold flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-green-500" />
                        WhatsApp API Setup
                      </h2>
                      <p className="text-sm text-neutral-500">Connect your Meta Developer credentials.</p>
                    </div>

                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="phoneId">Phone Number ID</Label>
                        <Input
                          id="phoneId"
                          placeholder="Found in Meta App Settings"
                          value={data.whatsappPhoneId}
                          onChange={(e) => setData({ ...data, whatsappPhoneId: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="token">Permanent Access Token</Label>
                        <Input
                          id="token"
                          type="password"
                          placeholder="EAA..."
                          value={data.whatsappAccessToken}
                          onChange={(e) => setData({ ...data, whatsappAccessToken: e.target.value })}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {currentStep === "payments" && (
                  <motion.div
                    key="payments"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="space-y-1">
                      <h2 className="text-xl font-semibold flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-blue-500" />
                        Razorpay Integration
                      </h2>
                      <p className="text-sm text-neutral-500">Accept UPI and Cards securely.</p>
                    </div>

                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="key">Razorpay Key ID</Label>
                        <Input
                          id="key"
                          placeholder="rzp_live_..."
                          value={data.razorpayKeyId}
                          onChange={(e) => setData({ ...data, razorpayKeyId: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="secret">Razorpay Key Secret</Label>
                        <Input
                          id="secret"
                          type="password"
                          placeholder="Keep it secret"
                          value={data.razorpayKeySecret}
                          onChange={(e) => setData({ ...data, razorpayKeySecret: e.target.value })}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {currentStep === "ai" && (
                  <motion.div
                    key="ai"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="space-y-1">
                      <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Bot className="h-5 w-5 text-purple-500" />
                        AI Persona
                      </h2>
                      <p className="text-sm text-neutral-500">Teach the bot how to talk to your customers.</p>
                    </div>

                    <div className="space-y-4 pt-4">
                      <Label htmlFor="ai">Store Context & Policies</Label>
                      <Textarea
                        id="ai"
                        rows={6}
                        placeholder="e.g. Be friendly, we offer free shipping above ₹999, and handle returns within 7 days."
                        value={data.aiContext}
                        onChange={(e) => setData({ ...data, aiContext: e.target.value })}
                        className="resize-none"
                      />
                    </div>
                  </motion.div>
                )}

                {currentStep === "success" && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-10 space-y-6"
                  >
                    <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600 mb-2">
                      <CheckCircle2 className="h-10 w-10" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-3xl font-bold tracking-tight text-neutral-900">
                        You're all set!
                      </h2>
                      <p className="text-neutral-500">
                        Your WhatsApp Store is live and your AI bot is learning your catalog.
                      </p>
                    </div>
                    <div className="pt-6">
                      <Button
                        size="lg"
                        className="w-full text-lg h-14"
                        onClick={() => router.push("/dashboard")}
                      >
                        Enter Dashboard
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {currentStep !== "success" && (
                <div className="flex items-center justify-between mt-12 pt-6 border-t border-neutral-100">
                  <Button
                    variant="ghost"
                    onClick={handleBack}
                    disabled={currentStepIdx === 0 || isSaving}
                    className="text-neutral-500"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={isSaving}
                    className="px-8"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Launching...
                      </>
                    ) : (
                      <>
                        {currentStep === "ai" ? "Launch Store" : "Continue"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {currentStep !== "success" && (
          <div className="mt-8 flex items-center justify-center gap-2 text-neutral-400 text-sm">
            <Lock className="h-3.5 w-3.5" />
            Your data is securely encrypted.
          </div>
        )}
      </div>
    </div>
  );
}
