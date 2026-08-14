import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Mail,
  Calendar,
  Shield,
  Package,
  CreditCard,
  Edit,
  PhoneCall,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchSingleUser } from "../features/users/userSlice";
import { BaseLoading } from "../components/BaseLoading";

const UserDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { toast } = useToast();
  const { singleData: user, loading } = useSelector((state) => state.users);
  console.log("object", user);
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (id) dispatch(fetchSingleUser({ userId: id, token }));
  }, [id, dispatch]);

  const activePackage = user;

  const getInitials = (name) =>
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  const formatDate = (date) => new Date(date).toLocaleDateString();
  const getUsagePercentage = (used, limit) => Math.round((used / limit) * 100);
  if (loading) return <BaseLoading message="Loading..." />;
  return (
    <div className="space-y-6 px-4">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        {/* Left section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/users")}
            className="flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">User Details</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Complete info of user and their active package
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Info Card */}
        <Card className="p-0 shadow-xl rounded-xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Avatar className="w-24 h-24 mx-auto">
                {user?.profileImage ? (
                  <AvatarImage src={user?.profileImage} alt={user?.name} />
                ) : (
                  <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
                )}
              </Avatar>
            </div>
            <CardTitle className="text-2xl capitalize">{user?.name}</CardTitle>
            <div className="flex justify-center mt-2">
              <Badge
                className={
                  user?.status === "active"
                    ? "bg-green-100 text-green-800"
                    : user?.status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                }
              >
                {user?.status.charAt(0).toUpperCase() + user?.status.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 mt-2">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span>{user?.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <PhoneCall className="w-4 h-4 text-muted-foreground" />
              <span>{user?.number}</span>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <span>{user?.role}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground mt-4">
              <div>Joined: {formatDate(user?.created_at)}</div>
              <div>Last Updated: {formatDate(user?.updated_at)}</div>
            </div>
          </CardContent>
        </Card>

        {/* Package Card */}
        {user?.activePackage ? (
          <Card className="lg:col-span-2 p-6 shadow-xl rounded-xl space-y-4">
            <CardHeader className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5" />
              <h3 className="font-semibold text-lg">Active Package</h3>
              <Badge
                className={`ml-auto ${new Date(activePackage?.endDate) > new Date()
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                  }`}
              >
                {new Date(activePackage?.endDate) > new Date()
                  ? "Active"
                  : "Expired"}
              </Badge>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <Badge className="bg-purple-100 text-purple-800">
                    {activePackage?.packageName}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-1">
                    {activePackage?.packageDesc}
                  </p>
                </div>
                <div>
                  <Calendar className="w-4 h-4 mx-auto text-muted-foreground" />
                  <p className="text-sm font-medium mt-1">Start Date</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(activePackage?.startDate)}
                  </p>
                </div>
                <div>
                  <Calendar className="w-4 h-4 mx-auto text-muted-foreground" />
                  <p className="text-sm font-medium mt-1">End Date</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(activePackage?.endDate)}
                  </p>
                </div>
              </div>

              {/* Usage Progress */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium mb-1">Messages Used</p>
                  <Progress
                    value={getUsagePercentage(
                      activePackage?.usage?.messagesSent ?? activePackage?.usedMsgCount ?? 0,
                      activePackage?.msgCount
                    )}
                    className="h-3 rounded-lg"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {activePackage?.usage?.messagesSent ?? activePackage?.usedMsgCount ?? 0} of{" "}
                    {activePackage?.msgCount} messages
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Templates Used</p>
                  <Progress
                    value={getUsagePercentage(
                      activePackage?.usage?.monthlyUsedTemplates ?? activePackage?.usedTemplateCount ?? 0,
                      activePackage?.templateCount
                    )}
                    className="h-3 rounded-lg"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {activePackage?.usage?.monthlyUsedTemplates ?? activePackage?.usedTemplateCount ?? 0} of{" "}
                    {activePackage?.templateCount} templates
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="lg:col-span-2 p-6 shadow-xl rounded-xl">
            <CardContent className="flex justify-center items-center h-32">
              <Badge className="bg-red-100 hover:bg-red-200 text-red-800 flex items-center gap-2">
                <Package className="w-4 h-4" />
                No Active Package
              </Badge>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default UserDetails;
