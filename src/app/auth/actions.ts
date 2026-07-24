"use server";

import { redirect } from "next/navigation";

import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function getPassword(formData: FormData) {
  const value = formData.get("password");

  return typeof value === "string" ? value : "";
}

export async function login(formData: FormData) {
  if (!hasSupabaseConfig()) {
    redirect(
      "/auth/login?error=Supabase%20environment%20variables%20are%20missing",
    );
  }

  const email = getString(formData, "email");
  const password = getPassword(formData);

  if (!email || !password) {
    redirect("/auth/login?error=Email%20and%20password%20are%20required");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/auth/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/");
}

export async function logout() {
  const supabase = await createClient();

  await supabase.auth.signOut();

  redirect("/auth/login");
}
