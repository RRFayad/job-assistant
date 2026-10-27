import { Billing } from "@/components/subscribed/billing";
import {
  getCurrentUserSubscription,
  requireCurrentUserSubscriptionPlan,
} from "@/lib/subscription/subscription";
import { tw } from "@/lib/utils";
import { SubscriptionPlan } from "@app/shared/types";

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
