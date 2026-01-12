import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// This route handles the email confirmation callback from Supabase Auth
// When a user clicks the confirmation link in their email, they're redirected here
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();

    // Exchange the auth code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Successfully verified - redirect to dashboard
      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  // If there's no code or an error occurred, redirect to login with error
  return NextResponse.redirect(
    `${origin}/login?error=Could not verify email. Please try again.`
  );
}
