"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";

import { loginSchema, LoginInput } from "@/lib/validators/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/shared/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function LoginForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginInput) {
    setServerError(null);
    setIsSubmitting(true);

    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    setIsSubmitting(false);

    if (!result || result.error) {
      setServerError("Invalid email or password.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <>
      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="flex flex-col items-center">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            <p className="mt-4 text-white animate-pulse">Signing in...</p>
          </div>
        </div>
      )}
      <Card className="bg-white/5 backdrop-blur-xl border-white/10 rounded-2xl shadow-2xl shadow-black/50 hover:shadow-blue-500/20 transition-shadow duration-300">
        <CardHeader>
          <p className="text-sm font-medium text-gray-300">Sign in</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {serverError && (
              <Alert variant="destructive">
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@alihsan.com"
                autoComplete="email"
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                {...register("email")}
              />
              {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">Password</Label>
              <PasswordInput
                id="password"
                placeholder="••••••••"
                autoComplete="current-password"
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <p className="w-full text-center text-sm text-gray-400">
            Forgot your password?{" "}
            <a href="/forgot-password" className="font-medium text-blue-400 hover:underline">
              Reset it
            </a>
          </p>
        </CardFooter>
      </Card>
    </>
  );
}
