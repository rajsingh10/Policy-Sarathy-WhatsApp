import React, { useState } from "react";
import FacebookLogin from "@greatsumini/react-facebook-login";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function FacebookConfigWizard({ onComplete }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    fb_app_id: "",
    fb_app_secret: "",
    access_token: "",
    waba_id: "",
    phoneNumberId: "",
    webhook_url: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFacebookSuccess = (response) => {
    console.log("FB Response:", response);
    setForm((prev) => ({
      ...prev,
      access_token: response.accessToken || "",
    }));
    setStep(3);
  };

  const handleSubmit = () => {
    onComplete(form);
  };

  return (
    <Card className="max-w-xl mx-auto mt-10">
      <CardHeader>
        <CardTitle className="text-xl font-bold">
          Facebook Configuration Wizard
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div>
          <Progress value={(step / 3) * 100} className="mb-2" />
          <p className="text-center text-sm text-gray-600">
            Step {step} of 3
          </p>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <Input
              name="fb_app_id"
              placeholder="Facebook App ID"
              value={form.fb_app_id}
              onChange={handleChange}
            />
            <Input
              name="fb_app_secret"
              placeholder="Facebook App Secret"
              value={form.fb_app_secret}
              onChange={handleChange}
            />
            <div className="flex justify-end space-x-2">
              <Button onClick={() => setStep(2)}>Next</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 text-center">
            <FacebookLogin
              appId={form.fb_app_id}
              onSuccess={handleFacebookSuccess}
              onFail={(err) => console.error("FB Error:", err)}
              onProfileSuccess={(profile) =>
                console.log("Profile:", profile)
              }
              className="bg-blue-600 text-white px-4 py-2 rounded-md"
            />
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <Input
              name="waba_id"
              placeholder="WABA ID"
              value={form.waba_id}
              onChange={handleChange}
            />
            <Input
              name="phoneNumberId"
              placeholder="Phone Number ID"
              value={form.phoneNumberId}
              onChange={handleChange}
            />
            <Input
              name="webhook_url"
              placeholder="Webhook URL"
              value={form.webhook_url}
              onChange={handleChange}
            />
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button onClick={handleSubmit}>Save Configuration</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
