import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import {
  User,
  Users,
  Send,
  Lock,
  Loader2,
  CheckCircle,
  Crown,
  Image as ImageIcon,
  Package,
  Calendar,
  FileText,
  MessageCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { BaseLoading } from "../components/BaseLoading";
import {
  getProfile,
  updateProfile,
  changePassword,
} from "../features/auth/authSlice";

// Types
interface Profile {
  name: string;
  email: string;
  number: string;
  profileImage: string;
  bio: string;
  activePlan: string;
  companyLogo: string;
  companyName: string;
  companyEmail: string;
  companyMobile: string;
  companyAddress: string;
  activePackage?: {
    packageName: string;
    packageDesc: string;
    startDate: string;
    endDate: string;
    msgCount: number;
    templateCount: number;
    day: number;
  };
}

interface ProfileState {
  profile: Profile | null;
  loading: boolean;
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ProfileData {
  name: string;
  email: string;
  number: string;
  profileImage: string | File | null;
  bio: string;
  activePlan: string;
  companyLogo: string | File | null;
  companyName: string;
  companyEmail: string;
  companyMobile: string;
  companyAddress: string;
}
interface ProfileErrors {
  name?: string;
  number?: string;
  bio?: string;
  companyName?: string;
  companyEmail?: string;
  companyMobile?: string;
  companyAddress?: string;
}

// Custom hook for password validation

export const Profile: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { profile: UserProfile, loading } = useSelector(
    (state: { auth: ProfileState }) => state.auth
  );

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  // State for profile data
  const [errors, setErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const [profileErrors, setProfileErrors] = useState<ProfileErrors>({});
  const [profileData, setProfileData] = useState<ProfileData>({
    name: "",
    email: "",
    number: "",
    profileImage: "",
    bio: "",
    activePlan: "",
    companyLogo: "",
    companyName: "",
    companyEmail: "",
    companyMobile: "",
    companyAddress: "",
  });

  // State for password data
  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // State for loading and errors
  const [isSubmitting, setIsSubmitting] = useState({
    profile: false,
    company: false,
    password: false,
  });

  // Sync Redux state to local state
  useEffect(() => {
    if (UserProfile) {
      setProfileData({
        name: UserProfile.name || "",
        email: UserProfile.email || "",
        number: UserProfile.number || "",
        profileImage: UserProfile.profileImage || "",
        bio: UserProfile.bio || "",
        activePlan: UserProfile?.activePackage?.packageName || "",
        companyLogo: UserProfile.companyLogo || "",
        companyName: UserProfile.companyName || "",
        companyEmail: UserProfile.companyEmail || "",
        companyMobile: UserProfile.companyMobile || "",
        companyAddress: UserProfile.companyAddress || "",
      });
    }
  }, [UserProfile]);
  const validateProfile = (): boolean => {
    const errors: ProfileErrors = {};

    if (!profileData.name.trim()) errors.name = "Full name is required";
    if (!profileData.number.trim()) errors.number = "Phone number is required";
    // if (!profileData.bio.trim()) errors.bio = "Bio cannot be empty";

    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "profileImage" | "companyLogo"
  ) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setProfileData((prev) => ({ ...prev, [type]: file }));
    }
  };

  console.log("profileData", profileData.profileImage);
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateProfile()) return; // only profile validation

    setIsSubmitting((prev) => ({ ...prev, profile: true }));

    try {
      await dispatch(updateProfile({ token, profileData })).unwrap();
      dispatch(getProfile(token));
      toast.success("Profile updated successfully");
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message || // API से आया error
        err?.message || // JS / Axios error
        "Failed to update profile"; // fallback

      toast.error(errorMessage);
    } finally {
      setIsSubmitting((prev) => ({ ...prev, profile: false }));
    }
  };
  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting((prev) => ({ ...prev, company: true }));

    try {
      await dispatch(updateProfile({ token, profileData })).unwrap();
      dispatch(getProfile(token));
      toast.success("Company details updated successfully");
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update company details";

      toast.error(errorMessage);
    } finally {
      setIsSubmitting((prev) => ({ ...prev, company: false }));
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    let valid = true;
    const newErrors: {
      currentPassword?: string;
      newPassword?: string;
      confirmPassword?: string;
    } = {};

    if (!passwordData.currentPassword.trim()) {
      newErrors.currentPassword = "Current password is required";
      valid = false;
    }

    if (!passwordData.newPassword.trim()) {
      newErrors.newPassword = "New password is required";
      valid = false;
    }
    if (!passwordData.confirmPassword.trim()) {
      newErrors.confirmPassword = "Confirm password is required";
      valid = false;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      valid = false;
    }

    if (!valid) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting((prev) => ({ ...prev, password: true }));
    try {
      const result = await dispatch(
        changePassword({
          token,
          passwordData: { ...passwordData },
        })
      ).unwrap();

      toast.success("Password changed successfully");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      const msg = error || "Current password is incorrect";
      toast.error(msg);
      setErrors((prev) => ({ ...prev, currentPassword: msg }));
    } finally {
      setIsSubmitting((prev) => ({ ...prev, password: false }));
    }
  };

  if (loading) return <BaseLoading message="Loading..." />;

  return (
    <div className="w-full">
      {/* Profile Settings Header */}
      <div className="mb-8 px-2 sm:px-4">
        <h1 className="text-3xl font-bold text-foreground">Profile Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Profile and Package Cards */}
      {/* Profile and Package Cards */}
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-12 gap-6 items-stretch">
          <div
            className={`col-span-12 ${UserProfile?.activePackage ? "md:col-span-8" : "md:col-span-12"
              } flex flex-col gap-6`}
          >
            {/* Profile Card */}
            <Card className="card-elegant p-0 shadow-lg rounded-2xl bg-white flex-1">
              <CardHeader className="p-2 sm:p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2 text-lg font-semibold">
                      <User className="w-5 h-5 text-indigo-500" />
                      <span>Profile Information</span>
                    </CardTitle>
                    <CardDescription className="text-gray-500 mt-1">
                      Update your personal information
                    </CardDescription>
                  </div>

                  <div className="mt-4 md:mt-0 flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-lg border">
                    <Crown className="w-5 h-5 text-indigo-600" />
                    <span className="font-medium text-indigo-700">
                      {profileData.activePlan ? (
                        <>Active Plan: {profileData.activePlan}</>
                      ) : (
                        <>No plan active</>
                      )}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-2 sm:p-4">
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="flex flex-col items-center space-y-3">
                    <input
                      id="profileImage"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageChange(e, "profileImage")}
                    />

                    <div
                      role="button"
                      tabIndex={0}
                      className="relative h-36 w-36 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 p-1 overflow-hidden cursor-pointer"
                      onClick={() =>
                        document.getElementById("profileImage")?.click()
                      }
                      onKeyDown={(e) =>
                        e.key === "Enter" &&
                        document.getElementById("profileImage")?.click()
                      }
                    >
                      {profileData.profileImage ? (
                        <img
                          src={
                            typeof profileData.profileImage === "string"
                              ? profileData.profileImage
                              : URL.createObjectURL(profileData.profileImage)
                          }
                          alt={profileData.name}
                          className="h-full w-full rounded-full object-cover border-2 border-white"
                        />
                      ) : (
                        <div className="h-full w-full rounded-full bg-gray-100 flex items-center justify-center border-2 border-white">
                          <ImageIcon className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      className="flex items-center gap-2 text-sm"
                      onClick={() =>
                        document.getElementById("profileImage")?.click()
                      }
                    >
                      <ImageIcon className="w-4 h-4" />
                      Change Image
                    </Button>
                  </div>
                  <div className="flex flex-col md:flex-row md:items-start md:space-x-6">
                    {/* Profile Image */}

                    {/* Input Fields */}
                    <div className="flex-1">
                      <div className="grid grid-cols-1 gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                              id="name"
                              value={profileData.name}
                              onChange={(e) =>
                                setProfileData((prev) => ({
                                  ...prev,
                                  name: e.target.value,
                                }))
                              }
                              placeholder="Enter your full name"
                            />
                            {profileErrors.name && (
                              <p className="text-xs text-red-500">
                                {profileErrors.name}
                              </p>
                            )}
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                              id="phone"
                              type="tel"
                              value={profileData.number}
                              onChange={(e) =>
                                setProfileData((prev) => ({
                                  ...prev,
                                  number: e.target.value,
                                }))
                              }
                              placeholder="Enter your phone number"
                            />
                            {profileErrors.number && (
                              <p className="text-xs text-red-500">
                                {profileErrors.number}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="email">Email Address</Label>
                          <Input
                            id="email"
                            type="email"
                            value={profileData.email}
                            disabled
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="bio">Bio</Label>
                          <Textarea
                            id="bio"
                            value={profileData.bio}
                            onChange={(e) =>
                              setProfileData((prev) => ({
                                ...prev,
                                bio: e.target.value,
                              }))
                            }
                            placeholder="Write something about yourself..."
                            rows={2}
                          />
                          {profileErrors.bio && (
                            <p className="text-xs text-red-500">
                              {profileErrors.bio}
                            </p>
                          )}
                        </div>
                        <div className="flex justify-end">
                          <Button
                            type="submit"
                            disabled={isSubmitting.profile}
                            className="bg-gradient-primary hover:shadow-glow whitespace-nowrap px-6 py-2 rounded-lg transition-all"
                          >
                            {isSubmitting.profile ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="mr-2 h-4 w-4" />
                            )}
                            Update Profile
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>

          </div>
          {UserProfile?.activePackage && (
            <div className="col-span-12 md:col-span-4">
              <div className="sticky top-4 flex flex-col gap-2">
                <Card className="card-elegant p-0 shadow-lg rounded-2xl bg-white">
                  <CardHeader className="flex items-center justify-between p-2 sm:p-4">
                    <div className="flex items-center gap-2">
                      <Package className="w-6 h-6 text-indigo-500" />
                      <CardTitle className="text-lg font-semibold">
                        Active Package
                      </CardTitle>
                    </div>
                    <Badge
                      className={`px-3 py-1 rounded-full font-medium ${new Date(UserProfile.activePackage.endDate) > new Date()
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                        }`}
                    >
                      {new Date(UserProfile.activePackage.endDate) > new Date()
                        ? "Active"
                        : "Expired"}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-4 p-2 sm:p-4">
                    {/* Package Info */}
                    <div className="bg-indigo-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold">
                        {UserProfile.activePackage.packageName || "-"}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {UserProfile.activePackage.packageDesc || "-"}
                      </p>
                    </div>

                    {/* Dates Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-indigo-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-indigo-500" />
                          <span className="text-sm font-medium text-muted-foreground">
                            Start Date
                          </span>
                        </div>
                        <p className="text-sm mt-1">
                          {UserProfile.activePackage.startDate
                            ? new Date(
                              UserProfile.activePackage.startDate
                            ).toLocaleDateString()
                            : "-"}
                        </p>
                      </div>
                      <div className="bg-indigo-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-indigo-500" />
                          <span className="text-sm font-medium text-muted-foreground">
                            End Date
                          </span>
                        </div>
                        <p className="text-sm mt-1">
                          {UserProfile.activePackage.endDate
                            ? new Date(
                              UserProfile.activePackage.endDate
                            ).toLocaleDateString()
                            : "-"}
                        </p>
                      </div>
                      <div className="bg-indigo-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-indigo-500" />
                          <span className="text-sm font-medium text-muted-foreground">
                            Next Renewal
                          </span>
                        </div>
                        <p className="text-sm mt-1">
                          {UserProfile.activePackage.endDate
                            ? new Date(
                              UserProfile.activePackage.endDate
                            ).toLocaleDateString()
                            : "-"}
                        </p>
                      </div>
                      <div className="bg-indigo-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <MessageCircle className="w-4 h-4 text-indigo-500" />
                          <span className="text-sm font-medium text-muted-foreground">
                            Messages
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {UserProfile?.activePackage.usage?.totalUsedMessages ||
                            0}{" "}
                          / {UserProfile.activePackage.msgCount || 0}
                        </p>
                      </div>
                    </div>

                    {/* Usage Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* <div className="bg-indigo-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-500" />
                        <span className="text-sm font-medium text-muted-foreground">
                          Templates
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {UserProfile.activePackage.usage
                          ?.monthlyUsedTemplates || 0}{" "}
                        / {UserProfile.activePackage.templateCount || 0}
                      </p>
                    </div> */}
                      {/* <div className="bg-indigo-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-indigo-500" />
                        <span className="text-sm font-medium text-muted-foreground">
                          Contacts
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {UserProfile.activePackage.usage?.monthlyUsedContacts ||
                          0}{" "}
                        / {UserProfile?.activePackage?.contactCount || 0}
                      </p>
                    </div> */}
                    </div>

                    {/* Days Info */}
                    <div className="grid grid-cols-1 gap-4">
                      <div className="bg-indigo-50 p-3 rounded-lg flex items-center justify-center gap-2">
                        <Calendar className="w-5 h-5 text-indigo-500" />
                        <h3 className="text-sm font-semibold">
                          Total Days - {UserProfile?.activePackage?.day || 0} days
                        </h3>
                      </div>
                      {/* <div className="bg-indigo-50 p-3 rounded-lg flex items-center justify-center gap-2">
                      <Calendar className="w-5 h-5 text-indigo-500" />
                      <h3 className="text-sm font-semibold">
                        Days Until Renewal -{" "}
                        {UserProfile.activePackage?.daysUntilRenewal || 0} days
                      </h3>
                    </div> */}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions Card */}
                <Card className="card-elegant p-0 shadow-lg rounded-2xl bg-white">
                  <CardHeader className="p-6 pb-4">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <Package className="w-5 h-5 text-indigo-500" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-0 space-y-3">
                    <Button onClick={() => navigate('/contacts')} variant="outline" className="w-full justify-start gap-3 h-12 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all border-gray-200">
                      <Users className="w-5 h-5 text-indigo-500" />
                      <span className="font-medium">Add Contacts</span>
                    </Button>
                    <Button onClick={() => navigate('/bulk-send')} variant="outline" className="w-full justify-start gap-3 h-12 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all border-gray-200">
                      <Send className="w-5 h-5 text-green-500" />
                      <span className="font-medium">Bulk Send</span>
                    </Button>
                    {/* <Button variant="outline" className="w-full justify-start gap-3 h-12 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all border-gray-200">
                    <FileText className="w-5 h-5 text-blue-500" />
                    <span className="font-medium">Templates</span>
                  </Button> */}
                  </CardContent>
                </Card>

              </div>
            </div>
          )}
        </div>
        {/* Company Details Card */}
        {role === "admin" && ( // Only show for admin users}
          <Card className="card-elegant">
            <CardHeader className="p-2 sm:p-4">
              <CardTitle className="flex items-center space-x-2">
                <ImageIcon className="w-5 h-5 text-indigo-500" />
                <span>Company Details</span>
              </CardTitle>
              <CardDescription>Update your company information</CardDescription>
            </CardHeader>
            <CardContent className="p-2 sm:p-4">
              <form onSubmit={handleCompanySubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="flex flex-col items-center space-y-3 md:col-span-2">
                    <input
                      id="companyLogo"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageChange(e, "companyLogo")}
                    />

                    <div
                      role="button"
                      tabIndex={0}
                      className="relative h-36 w-36 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 p-1 overflow-hidden cursor-pointer"
                      onClick={() =>
                        document.getElementById("companyLogo")?.click()
                      }
                      onKeyDown={(e) =>
                        e.key === "Enter" &&
                        document.getElementById("companyLogo")?.click()
                      }
                    >
                      {profileData.companyLogo ? (
                        <img
                          src={
                            typeof profileData.companyLogo === "string"
                              ? profileData.companyLogo
                              : URL.createObjectURL(profileData.companyLogo)
                          }
                          alt="Company Logo"
                          className="h-full w-full rounded-full object-cover border-2 border-white"
                        />
                      ) : (
                        <div className="h-full w-full rounded-full bg-gray-100 flex items-center justify-center border-2 border-white">
                          <ImageIcon className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        document.getElementById("companyLogo")?.click()
                      }
                    >
                      <ImageIcon className="w-4 h-4" />
                      Change Logo
                    </Button>
                  </div>
                  <div className="md:col-span-10 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input
                        id="companyName"
                        value={profileData.companyName}
                        onChange={(e) =>
                          setProfileData((prev) => ({
                            ...prev,
                            companyName: e.target.value,
                          }))
                        }
                        placeholder="Enter company name"
                      />
                      {profileErrors.companyName && (
                        <p className="text-xs text-red-500">
                          {profileErrors.companyName}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="companyMobile">Company Mobile</Label>
                      <Input
                        id="companyMobile"
                        value={profileData.companyMobile}
                        onChange={(e) =>
                          setProfileData((prev) => ({
                            ...prev,
                            companyMobile: e.target.value,
                          }))
                        }
                        placeholder="Enter company mobile"
                      />
                      {profileErrors.companyMobile && (
                        <p className="text-xs text-red-500">
                          {profileErrors.companyMobile}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1 md:col-span-1">
                      <Label htmlFor="companyEmail">Company Email</Label>
                      <Input
                        id="companyEmail"
                        type="email"
                        value={profileData.companyEmail}
                        onChange={(e) =>
                          setProfileData((prev) => ({
                            ...prev,
                            companyEmail: e.target.value,
                          }))
                        }
                        placeholder="Enter company email"
                      />
                      {profileErrors.companyEmail && (
                        <p className="text-xs text-red-500">
                          {profileErrors.companyEmail}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1 md:col-span-3">
                      <Label htmlFor="companyAddress">Company Address</Label>
                      <Textarea
                        id="companyAddress"
                        value={profileData.companyAddress}
                        onChange={(e) =>
                          setProfileData((prev) => ({
                            ...prev,
                            companyAddress: e.target.value,
                          }))
                        }
                        placeholder="Enter company address"
                        rows={2}
                      />
                    </div>
                    <div className="flex justify-end md:col-span-3">
                      <Button
                        type="submit"
                        disabled={isSubmitting.company}
                        className="bg-gradient-primary hover:shadow-glow"
                      >
                        {isSubmitting.company ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="mr-2 h-4 w-4" />
                        )}
                        Save Company Details
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
        {/* Change Password Card */}
        <Card className="card-elegant">
          <CardHeader className="p-2 sm:p-4">
            <CardTitle className="flex items-center space-x-2">
              <Lock className="w-5 h-5" />
              <span>Change Password</span>
            </CardTitle>
            <CardDescription>Update your account password</CardDescription>
          </CardHeader>
          <CardContent className="p-2 sm:p-4">
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      currentPassword: e.target.value,
                    }))
                  }
                  placeholder="Enter your current password"
                />
                {errors.currentPassword && (
                  <p className="text-xs text-red-500">
                    {errors.currentPassword}
                  </p>
                )}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData((prev) => ({
                        ...prev,
                        newPassword: e.target.value,
                      }))
                    }
                    placeholder="Enter new password"
                  />
                  {errors.newPassword && (
                    <p className="text-xs text-red-500">{errors.newPassword}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      }))
                    }
                    placeholder="Confirm new password"
                  />
                  {errors.confirmPassword && (
                    <p className="text-xs text-red-500">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>
              <Button
                type="submit"
                // disabled={isSubmitting.password || !!errors.password}
                className="bg-gradient-primary hover:shadow-glow"
              >
                {isSubmitting.password ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Lock className="mr-2 h-4 w-4" />
                )}
                Change Password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};