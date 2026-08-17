import type { Metadata } from "next";

import { AuthPageShell } from "@/components/Auth/AuthPageShell";
import { SignInForm } from "@/components/Auth/SignInForm";

export const metadata: Metadata = {
  title: "Sign in | UONotes",
  description:
    "Sign in to share and access notes from uOttawa students.",
};

type SignInPageProps = {
  searchParams: Promise<{
    from?: string | string[];
  }>;
};

export default async function SignInPage({
  searchParams,
}: SignInPageProps) {
  const params = await searchParams;

  const from = Array.isArray(params.from)
    ? params.from[0]
    : params.from;

  const returnPath =
    from &&
    from.startsWith("/") &&
    !from.startsWith("//")
      ? from
      : "/";

  return (
    <AuthPageShell>
      <SignInForm returnPath={returnPath} />
    </AuthPageShell>
  );
}