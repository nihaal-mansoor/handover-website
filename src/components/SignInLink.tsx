"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { signInHref } from "@/lib/next-path";

/**
 * A link to sign in that comes back to the page it was clicked on.
 *
 * Every one of these used to point at a bare /signin, so anyone who signed in
 * from an article or a thread was dropped on the home page and had to find
 * their way back to what they were doing.
 */
export function SignInLink({
  route = "/signin",
  className,
  children,
}: {
  route?: "/signin" | "/signup";
  className?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const from = search ? `${pathname}?${search}` : pathname;
  return (
    <Link href={signInHref(from, route)} className={className}>
      {children}
    </Link>
  );
}
