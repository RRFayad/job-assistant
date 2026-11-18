import { SignIn } from "@clerk/nextjs";
import { tw } from "@/lib/utils";
import { routes } from "@/lib/routes";

const styles = {
  page: tw("flex min-h-screen items-center justify-center"),
};

const SignInPage = () => {
  return (
    <div className={styles.page}>
      <SignIn
        fallbackRedirectUrl={routes.workspace.profile}
        signUpFallbackRedirectUrl={routes.workspace.profile}
      />
    </div>
  );
};

export default SignInPage;
