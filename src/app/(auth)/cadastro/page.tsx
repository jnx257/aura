import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { signUpOpen } from "@/server/signup";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = { title: "Criar conta" };

export default function SignUpPage() {
  if (!signUpOpen()) redirect("/entrar");
  return <SignUpForm />;
}
