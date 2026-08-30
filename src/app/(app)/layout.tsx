import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col lg:flex-row h-dvh w-full overflow-hidden bg-background">
      <Sidebar user={{ name: session.name, username: session.username, role: session.role }} />
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-background pb-20 lg:pb-0">
        {children}
      </main>
    </div>
  );
}
