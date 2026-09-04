import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default function SignInPage() {
  const googleEnabled = Boolean(process.env["GOOGLE_CLIENT_ID"] && process.env["GOOGLE_CLIENT_SECRET"]);
  return (
    <div className="col py-xl">
      <div className="mx-auto max-w-[24rem]">
        <h1 className="text-step-3">Sign in</h1>
        <p className="meta mt-2xs mb-l">You only need an account to post. Reading needs nothing.</p>
        <AuthForm mode="signin" googleEnabled={googleEnabled} />
      </div>
    </div>
  );
}
