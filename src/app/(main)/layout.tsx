"use client";

import { MainLayout } from "@/components/MainLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { formatName } from "@/lib/utils";
import {
  Brain,
  ChartBar,
  CheckSquare,
  FolderOpen,
  LogIn,
  LogOut,
  User,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import { useSnapshot } from "valtio";
import { signInModal } from "./signInModal";

const SignInModal = dynamic(
  () =>
    import("@/app/_components/sign-in-modal").then((mod) => mod.SignInModal),
  {
    ssr: false,
  },
);

interface MainTemplateLayoutProps {
  children: ReactNode;
}

export default function MainTemplateLayout({
  children,
}: MainTemplateLayoutProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { isOpen, setIsOpen } = useSnapshot(signInModal);

  return (
    <>
      <MainLayout
        sidebar={
          <Sidebar collapsible="icon">
            <SidebarHeader>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                      <CheckSquare className="size-4" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">TaskFlow</span>
                      <span className="truncate text-xs">Task Management</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <Link href="/" className="w-full">
                        <SidebarMenuButton
                          tooltip="Tasks"
                          isActive={pathname === "/"}
                        >
                          <CheckSquare />
                          <span>Tasks</span>
                        </SidebarMenuButton>
                      </Link>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <Link href="/projects" className="w-full">
                        <SidebarMenuButton
                          tooltip="Projects"
                          isActive={pathname === "/projects"}
                        >
                          <FolderOpen />
                          <span>Projects</span>
                        </SidebarMenuButton>
                      </Link>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <Link href="/profile" className="w-full">
                        <SidebarMenuButton
                          tooltip="Profile"
                          isActive={pathname === "/profile"}
                        >
                          <User />
                          <span>Profile</span>
                        </SidebarMenuButton>
                      </Link>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <Link href="/english-tools" className="w-full">
                        <SidebarMenuButton
                          tooltip="English Tools"
                          isActive={pathname === "/english-tools"}
                        >
                          <Brain />
                          <span>English Tools</span>
                        </SidebarMenuButton>
                      </Link>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                      <Link href="/gpt" className="w-full">
                        <SidebarMenuButton
                          tooltip="TinGPT"
                          isActive={pathname === "/gpt"}
                        >
                          <Brain />
                          <span>TinGPT</span>
                        </SidebarMenuButton>
                      </Link>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                      <Link href="/binance" className="w-full">
                        <SidebarMenuButton
                          tooltip="Binance"
                          isActive={pathname === "/binance"}
                        >
                          <ChartBar className="size-4" />
                          <span>Binance</span>
                        </SidebarMenuButton>
                      </Link>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
              <SidebarMenu>
                <SidebarMenuItem>
                  {session ? (
                    <SidebarMenuButton
                      tooltip={session.user.name ?? "User"}
                      onClick={() => signOut()}
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={session.user.image ?? undefined} />
                        <AvatarFallback>
                          {session.user.name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">
                          {formatName(session.user.name ?? "User")}
                        </span>
                        <span className="truncate text-xs">
                          {session.user.email}
                        </span>
                      </div>
                      <LogOut className="ml-2 h-4 w-4" />
                    </SidebarMenuButton>
                  ) : (
                    <SidebarMenuButton
                      tooltip="Sign In"
                      onClick={() => setIsOpen(true)}
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarFallback>?</AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">Sign In</span>
                        <span className="truncate text-xs">
                          Access your account
                        </span>
                      </div>
                      <LogIn className="ml-2 h-4 w-4" />
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarFooter>
          </Sidebar>
        }
      >
        {children}
      </MainLayout>

      {isOpen && <SignInModal />}
    </>
  );
}
