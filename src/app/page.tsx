import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Hartwell Round Robin</CardTitle>
          <CardDescription>Pickleball League Management</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button asChild className="w-full">
            <a href="/login">Admin Login</a>
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Manage your pickleball round robin league with ease.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
