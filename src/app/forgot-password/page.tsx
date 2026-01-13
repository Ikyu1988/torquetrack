
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import Link from "next/link";
import { ArrowLeft, KeyRound } from "lucide-react";
import { AppLogo } from "../../components/layout/AppLogo";
import { auth } from "../../lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { useToast } from "../../hooks/use-toast";
import { useState } from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../components/ui/form";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setEmailSent(false);
    try {
      await sendPasswordResetEmail(auth, values.email);
      toast({
        title: "Password Reset Email Sent",
        description: "Please check your inbox (and spam folder) for a link to reset your password.",
      });
      setEmailSent(true);
      form.reset();
    } catch (error: any) {
      console.error("Password reset failed:", error);
      let errorMessage = "Failed to send password reset email. Please try again.";
      if (error.code === 'auth/user-not-found') {
        errorMessage = "No user found with this email address.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "The email address is not valid.";
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

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
          <CardDescription>
            {emailSent 
              ? "A password reset link has been sent to your email address if it's associated with an account."
              : "Enter your email address and we'll send you a link to reset your password."
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!emailSent ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input 
                          id="email" 
                          type="email" 
                          placeholder="you@example.com" 
                          {...field} 
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full font-semibold text-lg py-6" disabled={isLoading}>
                  {isLoading ? "Sending Link..." : "Send Reset Link"}
                </Button>
              </form>
            </Form>
          ) : (
            <div className="text-center">
              <p className="text-green-500 mb-4">Reset email successfully sent!</p>
            </div>
          )}
          <div className="mt-6 text-center">
            <Button variant="link" asChild className="text-sm text-muted-foreground">
              <Link href="/login">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
