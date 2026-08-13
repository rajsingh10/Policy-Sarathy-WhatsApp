import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Star,
  MessageSquare,
  Calendar,
  FileText,
  Check,
} from "lucide-react";
import { use } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchPackages } from "../features/package/packagesSlice";
import { BaseLoading } from "../components/BaseLoading";

const PurchaseDetails = () => {
  const dispatch = useDispatch();
  const { data, loading, error } = useSelector((state) => state.packages);
  console.log(data);
  useEffect(() => {
    const token = localStorage.getItem("token");
    dispatch(fetchPackages(token));
  }, [dispatch]);
  if (loading) return <BaseLoading message="Loading..." />;
  return (
    <div className="container mx-auto px-0 sm:px-6 lg:px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        {/* Header */}
        <div className="w-full sm:w-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Packages
          </h1>
          <p className="text-muted-foreground mt-2">
            Choose the right package to scale your messaging with confidence.
          </p>
        </div>
      </div>

      {/* Package Grid */}
      <Card className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        {data.map((pkg) => (
          <Card
            key={pkg.id}
            className="relative transition-all cursor-pointer hover:-translate-y-1 hover:shadow-xl border-2 
             border-primary shadow-lg
          "
          >
            {pkg.popular && (
              <Badge className="absolute top-3 right-3 bg-primary text-white">
                Popular
              </Badge>
            )}

            <CardHeader className="text-center space-y-2">
              <div className="flex justify-center mb-2">
                <div className="p-3 rounded-full bg-yellow-100">
                  {pkg.packageName === "Pro Pack" ? (
                    <Star className="w-8 h-8 text-yellow-500" />
                  ) : (
                    <CreditCard className="w-8 h-8 text-blue-500" />
                  )}
                </div>
              </div>

              <CardTitle className="text-2xl">{pkg.packageName}</CardTitle>
              <CardDescription className="text-sm">
                {pkg.packageDesc}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-green-500" />
                  <span>{pkg.day} days validity</span>
                </li>
                <li className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-green-500" />
                  <span>Up to {pkg.msgCount} messages</span>
                </li>
                <li className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-green-500" />
                  <span>Up to {pkg.templateCount} templates</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        ))}
      </Card>
    </div>
  );
};

export default PurchaseDetails;
