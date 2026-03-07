"use client";

import { useState, Suspense, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { signIn } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const emailRef = useRef<string>("");

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setError(null);

    // Store email for PostHog identification
    emailRef.current = formData.get("email")?.toString() || "";

    // Add redirect URL to form data
    formData.set("redirectTo", redirectTo);

    const result = await signIn(formData);

    // If we get here, there was an error (successful login redirects)
    if (result && !result.success) {
      setError(result.error);
    } else {
      // Identify user and capture login event on successful login
      const email = emailRef.current;
      if (email) {
        posthog.identify(email, { email });
        posthog.capture("user_signed_in", { email });
      }
    }
    setIsLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold text-neutral-900">Welcome back</h1>
        <p className="text-sm text-neutral-500">
          Sign in to your ledgr account
        </p>
      </div>

      <form action={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-neutral-700">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            autoComplete="email"
            className="bg-neutral-50 border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:border-teal-500 focus:ring-teal-500"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-neutral-700">
              Password
            </Label>
            <Link
              href="/forgot-password"
              className="text-xs text-teal-600 hover:text-teal-700 hover:underline underline-offset-4"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Enter your password"
            required
            autoComplete="current-password"
            className="bg-neutral-50 border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:border-teal-500 focus:ring-teal-500"
          />
        </div>

        {error && (
          <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="w-full bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
          disabled={isLoading}
        >
          {isLoading ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <div className="text-center text-sm text-neutral-500">
        Don&apos;t have an account?{" "}
        <Link
          href={`/signup${redirectTo !== "/" ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
          className="text-teal-600 hover:text-teal-700 font-medium hover:underline underline-offset-4"
        >
          Sign up
        </Link>
      </div>
    </div>
  );
}

function LoginSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-2 text-center">
        <div className="h-7 bg-neutral-200 rounded w-1/2 mx-auto" />
        <div className="h-4 bg-neutral-100 rounded w-2/3 mx-auto" />
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="h-4 bg-neutral-200 rounded w-16" />
          <div className="h-10 bg-neutral-100 rounded" />
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-neutral-200 rounded w-20" />
          <div className="h-10 bg-neutral-100 rounded" />
        </div>
        <div className="h-10 bg-neutral-200 rounded" />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}
