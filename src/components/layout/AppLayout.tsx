import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export const AppLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showHeader, setShowHeader] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerWidth >= 1024) {
        if (window.scrollY > 50) {
          setShowHeader(true); // नीचे जाने पर hide
        } else {
          setShowHeader(true); // top पर visible
        }
      } else {
        setShowHeader(true); // mobile/tablet पर हमेशा visible
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background w-full">
      {/* Sidebar */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content */}
      <div className="flex flex-col min-h-screen w-full lg:pl-64">
        {/* Header → hide if sidebar open */}
        {!mobileOpen && (
          <div
            className={`z-10 sticky top-0 transition-transform duration-300 ${showHeader ? "translate-y-0" : "-translate-y-full"
              }`}
          >
            <Header onMenuClick={() => setMobileOpen(true)} />
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-auto py-2 sm:py-2 lg:py-4 sm:px-2 px-2">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
