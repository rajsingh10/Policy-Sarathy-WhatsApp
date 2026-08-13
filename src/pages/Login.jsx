import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MessageSquare, Mail, Lock } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../features/auth/authSlice";
import { BaseLoading } from "../components/BaseLoading";

export const Login = () => {
  const tokens = localStorage.getItem("token");
  console.log("token", tokens);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const dispatch = useDispatch();
  const { loading, error, token } = useSelector((state) => state.auth);
  const [errors, setErrors] = useState({});
  console.log(token);
  useEffect(() => {
    if (token) {
      navigate("/dashboard"); // or redirect to last visited page if you track it
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // frontend field validation (optional)
    if (!email || !password) {
      setErrors({
        email: !email ? "Email is required" : "",
        password: !password ? "Password is required" : "",
      });
      return;
    }

    try {
      const result = await dispatch(loginUser({ email, password })).unwrap();

      if (result.status === false) {
        setErrors({ general: result.message });
        return;
      }
    } catch (err) {
      console.error("Login failed:", err);
      setErrors({ general: err?.message || "Login failed" });
    }
  };

  const handleInputChange = (setter, field) => (e) => {
    setter(e.target.value);
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };
  // if (loading) return <BaseLoading message="Login..." />;
  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 mb-4">
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-foreground">Fablead</h1>
              <p className="text-muted-foreground text-sm">WA-Broadcast</p>
            </div>
          </div>
        </div>

        <Card className="card-elegant border-0 shadow-elegant">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to your Fablead WA-Broadcast account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={handleInputChange(setEmail, "email")}
                    className={`pl-10 h-11 ${
                      errors.email ? "border-red-500" : ""
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={handleInputChange(setPassword, "password")}
                    className={`pl-10 h-11 ${
                      errors.password ? "border-red-500" : ""
                    }`}
                  />
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                )}
              </div>
              {errors.general && (
                <p className="text-red-500 text-sm text-center">
                  {errors.general}
                </p>
              )}
              {/* Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-gradient-primary hover:shadow-glow transition-all duration-300"
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>
        {/* Footer */}
        {/* Footer */}
        {/* Footer */}
        <div className="p-4 border-sidebar-hover/30">
          <div className="text-sm text-center text-black">
            © {new Date().getFullYear()}{" "}
            <Link
              to="https://fableadtechnolabs.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Fablead WA-Broadcast
            </Link>
            . All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
};
