import { auth } from "@/server/auth";
import { redirect } from "next/navigation";

export default async function ApplyLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return <>{children}</>;
}
