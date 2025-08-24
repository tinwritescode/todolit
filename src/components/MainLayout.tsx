"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Menu, X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

interface MainLayoutProps {
  children: ReactNode;
  title?: string;
  navigation?: ReactNode | ((closeMenu: () => void) => ReactNode);
}

export function MainLayout({ children, title, navigation }: MainLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileMenuOpen) {
        closeMobileMenu();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isMobileMenuOpen]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Desktop Header */}
      <header className="bg-background fixed top-0 right-0 left-0 z-50 hidden h-16 shrink-0 items-center border-b sm:flex">
        <div className="flex w-full items-center px-6">
          <div className="flex min-w-0 flex-1 items-center">
            <h1 className="truncate text-base font-semibold capitalize lg:text-lg">
              {title}
            </h1>
          </div>
          {navigation && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <div className="flex-shrink-0 touch-manipulation">
                {typeof navigation === "function"
                  ? navigation(() => undefined)
                  : navigation}
              </div>
            </>
          )}
        </div>
      </header>

      {/* Mobile Header */}
      <header className="bg-background fixed top-0 right-0 left-0 z-50 flex h-14 shrink-0 items-center border-b sm:hidden">
        <div className="flex w-full items-center justify-between px-4">
          <div className="flex min-w-0 flex-1 items-center">
            <h1 className="truncate text-sm font-semibold capitalize">
              {title}
            </h1>
          </div>
          {navigation && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMobileMenu}
              className="ml-2 h-8 w-8 touch-manipulation p-0"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </header>

      {/* Mobile Navigation Overlay */}
      {isMobileMenuOpen && navigation && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm sm:hidden"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Mobile Navigation Drawer */}
      {navigation && (
        <div
          ref={drawerRef}
          className={`bg-background fixed top-14 left-0 z-50 h-full w-80 transform border-r shadow-2xl transition-transform duration-300 ease-out sm:hidden ${
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          style={{
            transform: isMobileMenuOpen ? "translateX(0)" : "translateX(-100%)",
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <div className="flex h-full flex-col">
            {/* Drawer Header */}
            <div className="bg-muted/30 border-b p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Menu</h2>
                  <p className="text-muted-foreground text-sm">
                    Navigate your app
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeMobileMenu}
                  className="hover:bg-muted h-10 w-10 rounded-full p-0"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Navigation Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex flex-col space-y-2">
                {typeof navigation === "function"
                  ? navigation(closeMobileMenu)
                  : navigation}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="bg-muted/30 border-t p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium">
                    N
                  </div>
                  <div>
                    <p className="text-sm font-medium">Navigation</p>
                    <p className="text-muted-foreground text-xs">
                      Swipe left to close
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex flex-1 flex-col gap-4 p-4 pt-18 sm:gap-6 sm:p-6 sm:pt-20 lg:p-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-background flex h-12 shrink-0 items-center border-t sm:h-14">
        <div className="flex w-full items-center px-3 sm:px-6">
          <span className="text-muted-foreground text-xs sm:text-sm">
            © 2024 TaskFlow. All rights reserved.
          </span>
        </div>
      </footer>
    </div>
  );
}
