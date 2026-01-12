import { redirect } from "next/navigation";

// Season detail page redirects to schedule by default
// Individual sections are available at:
// - /roster - Player roster management
// - /schedule - Week schedule and game management
// - /leaderboard - Player rankings and stats
export default async function SeasonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Redirect to the schedule section by default
  redirect(`/dashboard/seasons/${id}/schedule`);
}
