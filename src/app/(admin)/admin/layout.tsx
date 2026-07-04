import Link from "next/link";
import { AdminSidebarFooter } from "@/components/admin/AdminSidebarFooter";
import { SidebarNav } from "@/components/admin/SidebarNav";
import { siteConfig } from "@/config/site";
import { dashboardConfig } from "@/config/dashboard";
import { resolveStorefrontSocial } from "@/lib/integrations/settings";
import { SocialLinksProvider } from "@/providers/SocialLinksProvider";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const social = await resolveStorefrontSocial();

  return (
    <SocialLinksProvider social={social}>
      <div className="flex h-full min-h-0 w-full bg-white">
        <aside className="admin-scroll hidden h-full min-h-0 w-[var(--admin-sidebar-width)] shrink-0 flex-col overflow-hidden border-r bg-white md:flex">
          <div className="flex flex-1 flex-col overflow-y-auto overscroll-contain px-3 py-5">
            <Link
              href="/admin/dashboard"
              className="mb-5 block rounded-md px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              {siteConfig.shortName}
              <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                Admin
              </span>
            </Link>
            <SidebarNav items={dashboardConfig.sidebarNav} />
          </div>
          <AdminSidebarFooter />
        </aside>
        <main className="admin-scroll min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-4 py-5 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </SocialLinksProvider>
  );
}
