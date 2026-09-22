import { fetchProfiles } from "@/lib/backend/profile";
import { PageHeader } from "@/components/subscribed/page-header";
import { tw } from "@/lib/utils";

const styles = {
  page: tw("mx-auto w-full max-w-7xl space-y-8"),
  empty: tw("text-sm text-muted-foreground"),
  error: tw("text-sm text-destructive"),
  card: tw("space-y-2 rounded-xl border p-6"),
  name: tw("text-xl font-semibold"),
  title: tw("text-sm text-muted-foreground"),
  sections: tw("list-disc space-y-1 pl-5 text-sm"),
};

const ProfilePage = async () => {
  const profiles = await fetchProfiles();

  return (
    <main className={styles.page}>
      <PageHeader
        title="Profile"
        description="Build and maintain the Profiles your tailored resumes are grounded in."
      />
      {profiles === null ? (
        <p className={styles.error}>
          Couldn&apos;t load your Profiles. Try refreshing the page.
        </p>
      ) : profiles.length === 0 ? (
        <p className={styles.empty}>No Profiles yet.</p>
      ) : (
        profiles.map((profile) => (
          <div key={profile.id} className={styles.card}>
            <p className={styles.name}>{profile.header.fullName}</p>
            <p className={styles.title}>{profile.header.careerTitle}</p>
            <ul className={styles.sections}>
              {profile.sections.map((section) => (
                <li key={section.id}>{section.title}</li>
              ))}
            </ul>
          </div>
        ))
      )}
    </main>
  );
};

export default ProfilePage;
