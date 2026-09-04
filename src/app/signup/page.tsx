import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = { title: "Create an account", robots: { index: false } };

export default function SignUpPage() {
  const googleEnabled = Boolean(process.env["GOOGLE_CLIENT_ID"] && process.env["GOOGLE_CLIENT_SECRET"]);
  return (
    <div className="col py-xl">
      <div className="mx-auto max-w-[24rem]">
        <h1 className="text-step-3">Create an account</h1>
        <p className="meta mt-2xs mb-l">
          So you can comment and post in the forum. Posts are reviewed before they appear.
        </p>
        <AuthForm mode="signup" googleEnabled={googleEnabled} />
      </div>
    </div>
  );
}
