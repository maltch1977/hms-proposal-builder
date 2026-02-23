import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthProvider } from "@/lib/providers/auth-provider";
import { OrgProvider } from "@/lib/providers/org-provider";
import { Sidebar } from "@/components/layout/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isCollaboratorOnly = profile?.role === "proposal_user";

  return (
    <AuthProvider>
      <OrgProvider>
        <div className="flex h-screen overflow-hidden">
          {!isCollaboratorOnly && <Sidebar />}
          <main className="flex flex-1 flex-col overflow-hidden">
            {children}
          </main>
        </div>
      </OrgProvider>
    </AuthProvider>
  );
}
