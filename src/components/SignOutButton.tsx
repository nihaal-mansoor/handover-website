"use client";
import { signOut } from "@/lib/auth-client";

export function SignOutButton() {
  return (
    <button
      type="button"
      className="btn btn-quiet shrink-0"
      onClick={async () => {
        await signOut();
        window.location.assign("/");
      }}
    >
      Sign out
    </button>
  );
}
