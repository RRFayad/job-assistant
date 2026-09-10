import { Billing } from "@/components/subscribed/billing";
import {
  getCurrentUserSubscription,
  requireCurrentUserSubscriptionPlan,
} from "@/lib/subscription/subscription";
import { SubscriptionPlan } from "@/types/database";
import { tw } from "@/lib/utils";

const styles = {
  page: tw("w-full"),
};

const BillingPage = async () => {
  await requireCurrentUserSubscriptionPlan(SubscriptionPlan.Basic);

  const subscription = await getCurrentUserSubscription();

  return (
    <main className={styles.page}>
      <Billing subscription={subscription} />
    </main>
  );
};

export default BillingPage;
