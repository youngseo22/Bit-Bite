import { Navbar } from "@/components/Navbar";
import { Outlet } from "react-router-dom";

export function Layout() {
  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <main className="flex-grow overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
