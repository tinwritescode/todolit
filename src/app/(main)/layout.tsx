"use client";

import { MainLayout } from "@/components/MainLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatName } from "@/lib/utils";
import { Brain, CheckSquare, LogIn, LogOut, Settings } from "lucide-react";
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

  const navigation = (closeMenu?: () => void) => (
    <nav className="ml-auto flex w-full flex-col gap-2 sm:flex-row sm:items-center">
      <Button
        variant={pathname === "/" ? "default" : "ghost"}
        size="sm"
        className="flex h-12 w-full items-center justify-start gap-3 rounded-lg px-4 text-left sm:h-9 sm:w-auto sm:justify-center"
        asChild
      >
        <Link href="/" onClick={closeMenu}>
          <CheckSquare className="h-5 w-5 shrink-0" />
          <span className="font-medium">Tasks</span>
        </Link>
      </Button>
      <Button
        variant={pathname === "/settings" ? "default" : "ghost"}
        size="sm"
        className="flex h-12 w-full items-center justify-start gap-3 rounded-lg px-4 text-left sm:h-9 sm:w-auto sm:justify-center"
        asChild
      >
        <Link href="/settings" onClick={closeMenu}>
          <Settings className="h-5 w-5 shrink-0" />
          <span className="font-medium">Settings</span>
        </Link>
      </Button>
      <Button
        variant={pathname === "/english-tools" ? "default" : "ghost"}
        size="sm"
        className="flex h-12 w-full items-center justify-start gap-3 rounded-lg px-4 text-left sm:h-9 sm:w-auto sm:justify-center"
        asChild
      >
        <Link href="/english-tools" onClick={closeMenu}>
          <Brain className="h-5 w-5 shrink-0" />
          <span className="font-medium">English Tools</span>
        </Link>
      </Button>

      {/* User section */}
      <div className="mt-4 flex w-full items-center gap-2 border-t pt-4 sm:mt-0 sm:ml-4 sm:w-auto sm:border-t-0 sm:pt-0">
        {session ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              void signOut();
              closeMenu?.();
            }}
            className="flex h-12 w-full items-center justify-start gap-3 rounded-lg px-4 text-left sm:h-9 sm:w-auto sm:justify-center"
          >
            <Avatar className="h-6 w-6 shrink-0">
              <AvatarImage src={session.user.image ?? undefined} />
              <AvatarFallback>
                {session.user.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium sm:hidden">
              {formatName(session.user.name ?? "User")}
            </span>
            <span className="hidden font-medium sm:inline">
              {formatName(session.user.name ?? "User")}
            </span>
            <LogOut className="h-5 w-5 shrink-0" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsOpen(true);
              closeMenu?.();
            }}
            className="flex h-12 w-full items-center justify-start gap-3 rounded-lg px-4 text-left sm:h-9 sm:w-auto sm:justify-center"
          >
            <Avatar className="h-6 w-6 shrink-0">
              <AvatarFallback>?</AvatarFallback>
            </Avatar>
            <span className="font-medium sm:hidden">Sign In</span>
            <span className="hidden font-medium sm:inline">Sign In</span>
            <LogIn className="h-5 w-5 shrink-0" />
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
