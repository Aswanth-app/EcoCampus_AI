"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Droplets, ShieldCheck, Lock, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("a.vance@ecoflux-univ.edu");
  const [password, setPassword] = useState("••••••••••••");
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Temporary navigation for Phase 1 UI development
  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Phase 1 UI Mock Login Navigation
    // Note for Phase 2: Replace with Supabase auth / NextAuth API call here
    setTimeout(() => {
      router.push("/dashboard");
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Subtle Gradient & Grid Texture */}
      <div className="absolute inset-0 bg-[radial-[#0B6B4F]/5_1px,transparent_1px] [background-size:24px_24px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-[#0B6B4F] flex items-center justify-center text-white shadow-md shadow-emerald-900/10">
            <Droplets className="w-8 h-8 fill-emerald-100/30" />
          </div>
        </div>

        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-gray-900">
          EcoCampus <span className="text-[#0B6B4F]">AI</span>
        </h2>
        <p className="mt-1 text-center text-xs text-gray-500 font-medium uppercase tracking-wider">
          Enterprise Resource Intelligence Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="bg-white py-8 px-6 shadow-xl shadow-gray-200/50 rounded-2xl border border-gray-200 sm:px-10">
          <div className="mb-6 pb-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Sign in to your workspace</h3>
            <p className="text-xs text-gray-500 mt-0.5">Enter your institutional credentials to access resource dashboards.</p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              placeholder="user@organization.edu"
            />

            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              placeholder="••••••••"
            />

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded-md border-gray-300 text-[#0B6B4F] focus:ring-[#0B6B4F]"
                />
                Remember me on this device
              </label>

              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  alert("Password reset is managed by your Organization Admin.");
                }}
                className="font-medium text-[#0B6B4F] hover:underline"
              >
                Forgot password?
              </a>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              disabled={isLoading}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              {isLoading ? "Authenticating..." : "Sign In to Workspace"}
            </Button>
          </form>

          {/* Context Notice */}
          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-center gap-2 text-[11px] text-gray-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Role-Based Multi-Tenant Access Enforced</span>
          </div>
        </div>

        {/* Demo Credentials Helper for Phase 1 Review */}
        <div className="mt-4 p-3 rounded-lg bg-emerald-50/80 border border-emerald-200/80 text-center text-xs text-emerald-900">
          <p className="font-semibold">Phase 1 UI Preview Mode</p>
          <p className="text-[11px] text-emerald-800 mt-0.5">Click <strong>Sign In</strong> to navigate directly to the Overview Dashboard.</p>
        </div>
      </div>
    </div>
  );
}
