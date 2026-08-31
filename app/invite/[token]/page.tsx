import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AcceptInvitePage({
  params,
}: PageProps<"/invite/[token]">) {
  const { token } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/invite/${token}`);
  }

  const { data: tripId, error } = await supabase.rpc("accept_trip_invite", {
    _token: token,
  });

  if (error || !tripId) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Invite not valid</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {error?.message ??
                "This invite link is invalid, expired, or already used."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  redirect(`/trips/${tripId}`);
}
