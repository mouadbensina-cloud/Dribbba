import { redirect } from "next/navigation";

// v1 ships with a single city. Once more cities are seeded this becomes
// a city-selector screen instead of a hard redirect.
export default function RootPage() {
  redirect("/casablanca");
}
