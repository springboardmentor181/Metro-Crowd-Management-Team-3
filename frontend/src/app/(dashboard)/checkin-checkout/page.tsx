import { redirect } from "next/navigation";

// Check-in/check-out now lives inside the Crowd Monitoring page
// (see the #checkin-checkout section there) instead of its own
// sidebar item - this route only exists so old links/bookmarks to
// /checkin-checkout still land somewhere useful instead of 404ing.
export default function CheckInCheckOutRedirectPage() {
  redirect("/crowd-monitor#checkin-checkout");
}
