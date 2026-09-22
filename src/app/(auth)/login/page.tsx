
import Link from "next/link";
import { Suspense } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";
import { Logo } from "@/components/logo";

export default function LoginPage() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="mx-auto">
          <Logo />
        </div>
        <CardTitle className="text-2xl">Bem-vindo de volta</CardTitle>
        <CardDescription>
          Digite seu e-mail abaixo para entrar em sua conta.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* LoginForm usa useSearchParams, que exige Suspense no build */}
        <Suspense>
          <LoginForm />
        </Suspense>
      </CardContent>
      <CardFooter className="flex justify-center text-sm">
        <p>
          Não tem uma conta?{" "}
          <Link href="/signup" className="font-semibold text-primary hover:underline">
            Cadastre-se
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
