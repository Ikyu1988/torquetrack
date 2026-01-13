
"use client";

import { UserNav } from "../navigation/UserNav";
import { Button }  from "../ui/button";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "../ui/sheet"; // Added SheetHeader, SheetTitle
import { SidebarNav } from "../navigation/SidebarNav";
import { AppLogo } from "./AppLogo";
import { cn } from "../../lib/utils";

export function AppHeader({ toggleSidebar, isSidebarCollapsed }: { toggleSidebar?: () => void, isSidebarCollapsed?: boolean }) {
  const pathname = usePathname();
  // Extract a readable title from the pathname
  const pageTitle = pathname.split('/').filter(Boolean).pop()?.replace(/-/g, ' ') ?? "Dashboard";
  const capitalizedTitle = pageTitle.charAt(0).toUpperCase() + pageTitle.slice(1);

  return (
    <header className={cn(
        "sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-md px-4 md:px-6 print:hidden"
      )}>
      <div className="md:hidden">
         <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 flex flex-col">
            <SheetHeader className="p-4 border-b h-[65px] flex items-center"> {/* Added SheetHeader */}
              <SheetTitle>
                <AppLogo /> {/* Using AppLogo as a visually prominent title element */}
              </SheetTitle>
            </SheetHeader>
            <SidebarNav />
          </SheetContent>
        </Sheet>
      </div>
     
      {toggleSidebar && (
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="hidden md:flex">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
      )}
       <div className="hidden md:block">
        <h1 className="font-headline text-xl font-semibold">{capitalizedTitle}</h1>
      </div>
      <div className="flex w-full items-center justify-end gap-4 md:ml-auto md:gap-2 lg:gap-4">
        {/* TODO: Add global search if needed */}
        {/* <Search className="h-5 w-5 text-muted-foreground" /> */}
        <UserNav />
      </div>
    </header>
  );
}
