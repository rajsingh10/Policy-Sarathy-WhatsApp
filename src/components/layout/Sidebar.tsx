import React from "react";
import { Link, NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileText,
  Send,
  Settings,
  MessageSquare,
  MessageCircle,
  Plus,
  Folder,
  IndianRupee,
  UserCog,
  BarChart3,
  Package,
  Activity,
  Eye,
  Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const role = localStorage.getItem("role");
  const navigationItems = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },

    { title: "Contacts", url: "/contacts", icon: Users },
    { title: "Media Library", url: "/media", icon: Folder },
    // { title: "Media Library", url: "/media", icon: Folder },

    { title: "Templates", url: "/templates", icon: FileText },

    { title: "Bulk Send", url: "/bulk-send", icon: MessageSquare },
    // { title: "Automation", url: "/automation", icon: Activity },
    // { title: "Details", url: "/messageDetails", icon: Eye },
    // { title: "Credits", url: "/credits", icon: IndianRupee },
    // ...(role === "admin"
    //   ? [
    //     { title: "Packages", url: "/purchage", icon: Package },
    //     ]
    //   : []),
    // { title: "New Campaign", url: "/campaigns/new", icon: Plus },
    { title: "Campaigns", url: "/campaigns", icon: Send },
    { title: "Reports", url: "/reports", icon: BarChart3 },
    { title: "Groups", url: "/groups", icon: Folder },

    // { title: "Chat", url: "/chat", icon: MessageCircle },
    { title: "Chat", url: "/message-inbox", icon: Inbox },
    // ...(role === "admin"
    //   ? [{ title: "Users", url: "/users", icon: UserCog }]
    //   : []),
    // { title: "WABA Status", url: "/waba-status", icon: Activity },
    ...(role === "admin"
      ? [{ title: "Settings", url: "/settings", icon: Settings }]
      : []),
  ];
  return (
    <>
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col sidebar-gradient border-r border-border/20 transition-transform duration-300",
          "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}{" "}
        <Link to="/">
          <div className="p-4 border-b border-sidebar-hover/30 flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sidebar-foreground font-bold text-lg">
                Fablead{" "}
              </h1>
              <p className="text-sidebar-foreground/70 text-xs">WA-Broadcast</p>
            </div>
          </div>
        </Link>
        {/* Navigation */}
        <nav className="flex-1 p-2.5 space-y-2 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.url}
                to={item.url}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center space-x-3 px-3 py-2.5 rounded-full transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-hover"
                  )
                }
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="font-medium lg:inline">{item.title}</span>
              </NavLink>
            );
          })}
        </nav>
        {/* Footer */}
        <div className="p-4 border-t border-sidebar-hover/30">
          <div className="text-sidebar-foreground/60 text-xs text-start">
            © {new Date().getFullYear()}{" "}
            <a
              href="https://www.fableadtech.com/"
              target="_blank"
              className="hover:underline"
              rel="noopener noreferrer"
            >
              Fablead WA-Broadcast
            </a>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
};
