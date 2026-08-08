import { Suspense } from "react";
import { DiscoverClient } from "./discover-client";

export const metadata = { title: "Discover" };

export default function DiscoverPage() {
  return (
    <Suspense>
      <DiscoverClient />
    </Suspense>
  );
}
