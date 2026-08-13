import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, CreditCard, Star } from "lucide-react";
import {
  addCreditBalance,
  creditVerify,
} from "../features/credits/creditSlice";
import { useNavigate } from "react-router-dom";

const plans = [
  {
    id: "basic",
    name: "Basic",
    price: 500,
    credits: 100,
    messages: "1,000",
    support: "7-day support",
    campaigns: "1 campaign at a time",
    analytics: false,
    icon: <CreditCard className="w-6 h-6" />,
    color: "border-gray-200",
    popular: false,
  },
  {
    id: "silver",
    name: "Silver",
    price: 900,
    credits: 200,
    messages: "2,500",
    support: "14-day support",
    campaigns: "2 campaigns simultaneously",
    analytics: "Basic analytics",
    icon: <Star className="w-6 h-6" />,
    color: "border-gray-200",
    popular: true,
  },
  {
    id: "gold",
    name: "Gold",
    price: 1200,
    credits: 250,
    messages: "5,000",
    support: "1-month support",
    campaigns: "3 campaigns simultaneously",
    analytics: "Analytics & reporting",
    icon: <Star className="w-6 h-6 text-yellow-500" />,
    color: "border-gray-200",
    popular: false,
  },
];

// Load Razorpay script dynamically
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Recharge = () => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const handleRecharge = async () => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!token || !userStr || !selectedPlan) {
      return toast.error("Missing data or plan not selected");
    }

    const user = JSON.parse(userStr);
    const planDetails = plans.find((plan) => plan.id === selectedPlan);
    if (!planDetails) return toast.error("Invalid plan selected");

    try {
      setLoading(true);

      // 1️⃣ Create order on backend
      const formData = new FormData();
      formData.append("userId", user.id);
      formData.append("amount", (planDetails.price * 100).toString()); // in paise

      const orderRes = await dispatch(
        addCreditBalance({ token, balanceData: formData })
      ).unwrap();

      const { id: razorpay_order_id, amount, currency } = orderRes;
      if (!razorpay_order_id || !amount || !currency) {
        setLoading(false);
        return toast.error("Invalid order data from server");
      }

      // 2️⃣ Load Razorpay script
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        setLoading(false);
        return toast.error("Razorpay SDK failed to load.");
      }

      // 3️⃣ Razorpay options
      const options = {
        key: "rzp_test_RDQAi1q4sMgxxj",
        amount,
        currency,
        name: "Fablead WA-Broadcast",
        order_id: razorpay_order_id,
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.number,
        },
        handler: async (response) => {
          const verifyData = new FormData();
          verifyData.append("userId", user.id);
          verifyData.append("razorpay_order_id", response.razorpay_order_id);
          verifyData.append(
            "razorpay_payment_id",
            response.razorpay_payment_id
          );
          verifyData.append("razorpay_signature", response.razorpay_signature);
          verifyData.append("amount", planDetails.price);
          verifyData.append("email", user.email);

          try {
            await dispatch(
              creditVerify({ token, creditData: verifyData })
            ).unwrap();
            toast.success("Payment verified & credits added!");
            navigate(-1);
          } catch (err) {
            console.error("Payment verification failed:", err);
            toast.error(err?.message || "Payment verification failed");
          }
        },
        modal: { escape: true, backdrop_close: false },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err) {
      console.error("Order creation failed:", err);
      toast.error(err?.message || "Failed to create order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-0 sm:px-6 lg:px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Recharge Credits
          </h1>
          <p className="text-muted-foreground">
            Add credits to your WhatsApp account to keep sending messages
            without interruption.
          </p>
        </div>

        <Button
          size="lg"
          onClick={handleRecharge}
          disabled={!selectedPlan || loading}
        >
          <CreditCard className="w-5 h-5 mr-2" />
          {loading ? "Processing..." : "Proceed to Payment"}
        </Button>
      </div>

      {/* Available Plans */}
      <Card className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-6 p-6">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`relative cursor-pointer transition-all hover:shadow-lg ${
              selectedPlan === plan.id ? "ring-2 ring-primary" : ""
            } ${plan.color} ${plan.popular ? "border-primary" : ""}`}
            onClick={() => setSelectedPlan(plan.id)}
          >
            {plan.popular && (
              <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary">
                Most Popular
              </Badge>
            )}

            <CardHeader className="text-center">
              <div className="flex justify-center mb-2">{plan.icon}</div>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <div className="space-y-1">
                <div className="text-3xl font-bold text-primary">
                  ₹{plan.price}
                </div>
                <CardDescription>{plan.credits} Credits</CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Send up to {plan.messages} messages</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>{plan.support}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>{plan.campaigns}</span>
                </div>
                {plan.analytics && (
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>{plan.analytics}</span>
                  </div>
                )}
              </div>

              <Button
                className="w-full"
                variant={selectedPlan === plan.id ? "default" : "outline"}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPlan(plan.id);
                }}
              >
                {selectedPlan === plan.id ? "Selected" : "Select Plan"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </Card>
    </div>
  );
};

export default Recharge;
