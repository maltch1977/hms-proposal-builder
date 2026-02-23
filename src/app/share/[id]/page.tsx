"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Lock } from "lucide-react";

const SHARE_EMAIL = "client@hmsproposals.com";
const SHARE_PASSWORD = "hmsproposal";

export default function SharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Already signed in → go straight to editor
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.replace(`/proposals/${id}`);
      } else {
        setChecking(false);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== SHARE_PASSWORD) {
      setError("Incorrect password");
      return;
    }

    setSubmitting(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email: SHARE_EMAIL,
      password: SHARE_PASSWORD,
    });

    if (error) {
      setError("Access failed. Please contact HMS.");
      setSubmitting(false);
      return;
    }

    router.push(`/proposals/${id}`);
    router.refresh();
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-sm px-4 space-y-8">
        <div className="flex flex-col items-center space-y-2">
          <div className="relative h-40 w-[320px]">
            <Image
              src="/images/hms_logo.png"
              alt="HMS Commercial Service"
              fill
              className="object-contain"
              priority
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Enter the password to view this proposal
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4"
        >
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              className="h-11 pl-10"
              autoFocus
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            type="submit"
            className="h-11 w-full bg-hms-navy hover:bg-hms-navy-light"
            disabled={submitting}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "View Proposal"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
