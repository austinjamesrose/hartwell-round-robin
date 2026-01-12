import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoutButton } from "./logout-button";

export default async function DashboardPage() {
  const supabase = await createClient();

  // Get the current user (middleware ensures we're authenticated, but double-check)
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen p-4">
      <div className="mx-auto max-w-4xl">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
          <LogoutButton />
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Welcome to Hartwell Round Robin</CardTitle>
            <CardDescription>
              Your pickleball league management dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Season management features coming soon. You&apos;ll be able to create seasons,
              manage players, generate schedules, and track scores from here.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
