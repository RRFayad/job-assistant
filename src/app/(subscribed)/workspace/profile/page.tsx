import { fetchProfiles } from "@/lib/backend/profile";
import { PageHeader } from "@/components/subscribed/page-header";
import { ProfileWorkspace } from "@/components/subscribed/profile/profile-workspace";
import { tw } from "@/lib/utils";

const styles = {
  page: tw("mx-auto w-full max-w-7xl space-y-8"),
  empty: tw("text-sm text-muted-foreground"),
  error: tw("text-sm text-destructive"),
};

const ProfilePage = async () => {
  const profiles = await fetchProfiles();

  if (profiles === null) {
    return (
      <main className={styles.page}>
        <PageHeader title="Profile" />
        <p className={styles.error}>
          Couldn&apos;t load your Profiles. Try refreshing the page.
        </p>
      </main>
    );
  }

  if (profiles.length === 0) {
    return (
      <main className={styles.page}>
        <PageHeader title="Profile" />
        <p className={styles.empty}>No Profiles yet.</p>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <PageHeader
        title="Profile"
        description="Build and maintain the Profiles your tailored resumes are grounded in."
      />
      <ProfileWorkspace profiles={profiles} />
    </main>
  );
};

export default ProfilePage;
