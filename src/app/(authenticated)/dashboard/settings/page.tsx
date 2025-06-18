
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon } from "lucide-react"; // Renamed to avoid conflict with component name

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
           <div className="flex items-center gap-3">
            <SettingsIcon className="h-6 w-6 text-primary" />
            <div>
              <CardTitle className="font-headline text-2xl">Settings</CardTitle>
              <CardDescription>Configure application settings and preferences.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Application settings will be configurable here. (Coming Soon)</p>
        </CardContent>
      </Card>
    </div>
  );
}
