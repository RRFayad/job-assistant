import { PageHeader } from "@/components/subscribed/page-header";
import { tw } from "@/lib/utils";

const styles = {
  page: tw("mx-auto w-full max-w-7xl space-y-8"),
};

const ProfilePage = () => {
  return (
    <main className={styles.page}>
      <PageHeader
        title="Profile"
        description="This is coming soon — we're still building it out."
      />
    </main>
  );
};

export default ProfilePage;
