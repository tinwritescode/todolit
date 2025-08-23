"use client";

import { MainLayout } from "@/components/MainLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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

  const navigation = (
    <nav className="ml-auto flex items-center gap-2">
      <Link href="/">
        <Button
          variant={pathname === "/" ? "default" : "ghost"}
          size="sm"
          className="flex items-center gap-2"
        >
          <CheckSquare className="h-4 w-4" />
          <span>Tasks</span>
        </Button>
      </Link>
      <Link href="/profile">
        <Button
          variant={pathname === "/profile" ? "default" : "ghost"}
          size="sm"
          className="flex items-center gap-2"
        >
          <User className="h-4 w-4" />
          <span>Profile</span>
        </Button>
      </Link>
      <Link href="/english-tools">
        <Button
          variant={pathname === "/english-tools" ? "default" : "ghost"}
          size="sm"
          className="flex items-center gap-2"
        >
          <Brain className="h-4 w-4" />
          <span>English Tools</span>
        </Button>
      </Link>

      {/* User section */}
      <div className="ml-4 flex items-center gap-2">
        {session ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut()}
            className="flex items-center gap-2"
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
            <span className="hidden sm:inline">
              {formatName(session.user.name ?? "User")}
            </span>
            <LogOut className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2"
          >
            <Avatar className="h-6 w-6">
              <AvatarFallback>?</AvatarFallback>
            </Avatar>
            <span className="hidden sm:inline">Sign In</span>
            <LogIn className="h-4 w-4" />
          </Button>
        )}
      </div>
    </nav>
  );

  return (
    <>
      <MainLayout navigation={navigation}>{children}</MainLayout>

      {isOpen && <SignInModal />}
    </>
  );
}
