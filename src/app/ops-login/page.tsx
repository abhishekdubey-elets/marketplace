import type { Metadata } from "next";
import { Suspense } from "react";
import { Logo } from "@/components/brand";
import { OpsLoginForm } from "./ops-login-form";

// Served only at the unlisted OPS_LOGIN_PATH (see src/lib/auth/ops.ts). Never linked from the app.
export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false, nocache: true },
};

export default function OpsLoginPage() {
  return (
    <div className="grid min-h-dvh place-items-center bg-canvas px-5 py-10">
      <div className="w-full max-w-[380px]">
        <Logo />
        <div className="mt-8 rounded-2xl border border-line bg-surface p-6 shadow-card">
          <Suspense>
            <OpsLoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
