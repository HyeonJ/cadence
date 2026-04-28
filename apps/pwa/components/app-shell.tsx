import * as React from "react";
import { Sidebar } from "./sidebar";
import { MobileTabbar } from "./mobile-tabbar";

type NavId = "today" | "sprint" | "settings";

export function AppShell({
  active,
  topBar,
  children,
}: {
  active: NavId;
  topBar?: React.ReactNode;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="flex w-full min-h-screen bg-bg">
      <Sidebar active={active} />
      <main className="flex-1 flex flex-col min-w-0 pb-14 lg:pb-0">
        {topBar && (
          <div className="h-14 border-b border-hairline flex items-center px-7 gap-3.5 bg-bg">
            {topBar}
          </div>
        )}
        <div className="flex-1 px-5 lg:px-9 py-6 lg:py-7 overflow-x-hidden">
          {children}
        </div>
      </main>
      <MobileTabbar />
    </div>
  );
}
