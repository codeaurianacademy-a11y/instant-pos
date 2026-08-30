import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex h-dvh w-full">
      <Sidebar user={{ name: session.name, username: session.username, role: session.role }} />
      <main className="flex-1 overflow-y-auto bg-background">{children}</main>
    </div>
  );
}
