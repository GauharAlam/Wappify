"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, Rocket } from "lucide-react";

interface OnboardingFormProps {
  templateId: string;
  defaultAiContext: string;
}

export function OnboardingForm({ templateId, defaultAiContext }: OnboardingFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    businessName: "",
    whatsappNumber: "",
    aiContext: defaultAiContext,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/onboarding/apply-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId,
          ...formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to setup your store. Please try again.");
      }

      // Success - Redirect
      router.push(data.redirect || "/inbox");
      router.refresh();
      
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-primary/20 shadow-lg shadow-primary/5">
      <CardHeader className="bg-primary/5 border-b border-primary/10">
        <CardTitle className="text-xl">Business Details</CardTitle>
        <CardDescription>
          Just a few details to launch your automation workspace.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6 pt-6">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md border border-destructive/20 font-medium">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name *</Label>
            <Input
              id="businessName"
              placeholder="e.g. StyleHouse India"
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsappNumber">WhatsApp Business Number *</Label>
            <Input
              id="whatsappNumber"
              placeholder="e.g. 919876543210 (Include country code, no +)"
              value={formData.whatsappNumber}
              onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value.replace(/[^0-9]/g, "") })}
              required
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              You must use a number registered with WhatsApp Cloud API.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="aiContext">AI Assistant Personality (Optional)</Label>
            <Textarea
              id="aiContext"
              rows={4}
              value={formData.aiContext}
              onChange={(e) => setFormData({ ...formData, aiContext: e.target.value })}
              disabled={isLoading}
              className="text-sm"
            />
            <p className="text-[11px] text-muted-foreground">
              We&apos;ve pre-filled this based on your template. Feel free to tweak it!
            </p>
          </div>
        </CardContent>
        <CardFooter className="bg-neutral-50 border-t px-6 py-4">
          <Button 
            type="submit" 
            className="w-full font-bold text-md h-12" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Setting up workspace...
              </>
            ) : (
              <>
                <Rocket className="mr-2 h-5 w-5" />
                Launch My Workspace
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
