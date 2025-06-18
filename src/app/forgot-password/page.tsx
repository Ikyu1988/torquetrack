
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { ArrowLeft, KeyRound } from "lucide-react";
import { AppLogo } from "@/components/layout/AppLogo";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <AppLogo />
          </div>
          <CardTitle className="font-headline text-3xl flex items-center justify-center gap-2">
            <KeyRound className="h-7 w-7" /> Reset Password
          </CardTitle>
          <CardDescription>Enter your email address and we'll send you a link to reset your password.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" placeholder="you@example.com" className="mt-1" />
            </div>
            <Button type="submit" className="w-full font-semibold text-lg py-6">
              Send Reset Link
            </Button>
          </form>
          <div className="mt-6 text-center">
            <Button variant="link" asChild className="text-sm text-muted-foreground">
              <Link href="/login">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
              </Link>
            </Button>
          </div>
           <p className="mt-4 text-xs text-center text-muted-foreground">
            (Note: Actual password reset functionality is not implemented in this prototype.)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
