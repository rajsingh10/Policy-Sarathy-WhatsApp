import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Menu, User, LogOut, Package, Zap, Calendar, MessageSquare, FileText, Clock } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout, getProfile } from "../../features/auth/authSlice";

export const Header = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { profile } = useSelector((state: any) => state.auth);
  // const { balance } = useSelector((state: any) => state.credits);
  const token = localStorage.getItem("token");

  const calculateDaysLeft = () => {
    if (profile?.activePackage?.endDate) {
      const end = new Date(profile.activePackage.endDate);
      const now = new Date();
      if (!isNaN(end.getTime())) {
        const diffTime = Math.max(end.getTime() - now.getTime(), 0);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
    }
    return 0;
  };
  const daysLeft = calculateDaysLeft();

  console.log(profile);
  useEffect(() => {
    if (token) dispatch(getProfile(token));
  }, [dispatch, token]);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const handleProfile = () => navigate("/profile");
  const handlePackage = () => navigate("/plan-history");

  return (
    <header className="h-16 border-b border-border/50 bg-card/50 backdrop-blur-sm flex items-center justify-between px-2 sm:px-4">
      {/* Left side */}
      <div className="flex items-center space-x-0">
        {/* Mobile menu icon (only on mobile) */}
        <div
          onClick={onMenuClick}
          className="lg:hidden cursor-pointer p-1.5 bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition"
        >
          <Menu className="w-6 h-6" />
        </div>
      </div>

      {/* Center marquee message */}
      {/* <div className="hidden lg:block md:block overflow-hidden relative w-screen h-6 mx-5">
        <div className="absolute whitespace-nowrap animate-marquee font-medium text-muted-foreground">
          WhatsApp Business Message Charges (Marketing ₹0.78 | Utility ₹0.12 |
          OTP ₹0.12 | Service Free)
        </div>
      </div> */}

      {/* Right side */}
      <div className="flex items-center space-x-4">
        {profile?.activePackage && (
          <>
            <HoverCard openDelay={0} closeDelay={100}>
              <HoverCardTrigger asChild>
                <Button variant="outline" size="sm" className="hidden sm:flex border-primary/20 text-primary font-medium hover:bg-primary/5 hover:text-primary">
                  <Calendar className="w-4 h-4 mr-2" />
                  Expire: {profile.activePackage.endDate ? new Date(profile.activePackage.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : 'N/A'}
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-[320px] p-0 overflow-hidden shadow-xl border-border" align="end" sideOffset={8}>
                <div className="bg-primary/5 p-4 border-b border-primary/10">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold flex items-center gap-2 text-lg">
                      <Zap className="w-5 h-5 text-primary fill-primary/20" />
                      {profile.activePackage.packageName || "Pro Package"}
                    </h3>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1 rounded-full px-2">
                      <Clock className="w-3 h-3" />
                      Active
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground ml-7">{profile.activePackage.packageDesc || "Advanced package for medium businesses."}</p>
                </div>

                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col p-3 bg-blue-50/50 rounded-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        <span className="text-xs text-muted-foreground font-medium">Duration</span>
                      </div>
                      <span className="font-bold text-sm pl-6">{profile.activePackage.day || 365} days</span>
                    </div>
                    <div className="flex flex-col p-3 bg-orange-50/50 rounded-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-orange-500" />
                        <span className="text-xs text-muted-foreground font-medium">Days Left</span>
                      </div>
                      <span className="font-bold text-sm pl-6">{daysLeft > 0 ? daysLeft : 0}</span>
                    </div>
                    <div className="flex flex-col p-3 bg-indigo-50/50 rounded-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <MessageSquare className="w-4 h-4 text-indigo-500" />
                        <span className="text-xs text-muted-foreground font-medium">Messages</span>
                      </div>
                      <span className="font-bold text-sm pl-6">{(profile.activePackage.usage?.yearlyUsedMessages ?? profile.activePackage.usedMsgCount ?? 0).toLocaleString()} / {(profile.activePackage.msgCount || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col p-3 bg-emerald-50/50 rounded-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs text-muted-foreground font-medium">Renewal</span>
                      </div>
                      <span className="font-bold text-sm pl-6">{profile.activePackage.endDate ? new Date(profile.activePackage.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : 'N/A'}</span>
                    </div>

                    {/* <div className="flex flex-col p-3 bg-green-50/50 rounded-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-4 h-4 text-green-500" />
                        <span className="text-xs text-muted-foreground font-medium">Templates</span>
                      </div>
                      <span className="font-bold text-sm pl-6">{profile.activePackage.usage?.monthlyUsedTemplates ?? profile.activePackage.usedTemplateCount ?? 0} / {profile.activePackage.templateCount || 0}</span>
                    </div> */}


                  </div>

                  <div className="bg-muted/50 rounded-xl p-3 text-sm">
                    <div className="flex justify-between items-center mb-2 text-xs">
                      <div><span className="font-semibold text-black">Start:</span> {profile.activePackage.startDate ? new Date(profile.activePackage.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : 'N/A'}</div>
                      <div><span className="font-semibold text-black">End:</span> {profile.activePackage.endDate ? new Date(profile.activePackage.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : 'N/A'}</div>
                    </div>
                    <Badge variant="outline" className={`w-full justify-center py-1 rounded-full text-xs font-semibold ${daysLeft > 0 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                      {daysLeft > 0 ? `${daysLeft} days remaining` : 'Plan Expired'}
                    </Badge>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>

            <Button
              variant="ghost"
              size="sm"
              className="
      bg-gradient-to-r from-[#0B2D8C] to-[#1E3DB8]
      text-white font-semibold
      px-5 py-2 rounded-lg
      shadow-lg hover:shadow-xl
      transform hover:-translate-y-0.5
      transition-all duration-300
      flex items-center gap-2
    "
              onClick={() => navigate("/plan-history")}
            >
              <Package className="h-4 w-4" />
              <span className="truncate">
                {profile?.activePackage?.packageName}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Button>
          </>
        )}
        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9 border-2 border-blue-900 rounded-full">
                {profile?.profileImage ? (
                  <img
                    src={profile.profileImage}
                    alt={profile?.name}
                    className="h-9 w-9 rounded-full object-cover"
                  />
                ) : (
                  <AvatarFallback className="bg-gradient-primary text-white font-semibold">
                    {profile?.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase() || "W"}
                  </AvatarFallback>
                )}
              </Avatar>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {profile?.name}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {profile?.email}
                </p>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleProfile}
              className="cursor-pointer"
            >
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handlePackage}
              className="cursor-pointer"
            >
              <Package className="mr-2 h-4 w-4" />
              Package Details
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
