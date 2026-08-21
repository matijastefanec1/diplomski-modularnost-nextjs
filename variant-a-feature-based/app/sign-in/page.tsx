import { redirectIfSignedIn, SignInPage } from "@/features/auth";

type SignInRouteProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SignInRoute({ searchParams }: SignInRouteProps) {
  await redirectIfSignedIn();

  const { callbackUrl } = await searchParams;

  return (
    <SignInPage
      callbackUrl={typeof callbackUrl === "string" ? callbackUrl : undefined}
    />
  );
}
