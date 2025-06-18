
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "lucide-react";

export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <User className="h-6 w-6 text-primary" />
            <div>
              <CardTitle className="font-headline text-2xl">Profile</CardTitle>
              <CardDescription>View and update your user profile.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">User profile information will be displayed and editable here. (Coming Soon)</p>
          {/* Placeholder for profile form */}
        </CardContent>
      </Card>
    </div>
  );
}
