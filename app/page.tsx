import { redirect } from "next/navigation";

export default function RootPage() {
  // Middleware handles the actual auth check; this just picks a sane default target.
  redirect("/dashboard");
}
