"use client";

import SubscriptionForm from "@/components/SubscriptionForm";
import styles from "./subscription.module.css";

export default function Subscription() {
  return (
    <div className={styles.container}>
      <SubscriptionForm />
    </div>
  );
}
