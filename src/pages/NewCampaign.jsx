import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CampaignWizard } from "../components/campaigns/CampaignWizard";
import { toast } from "sonner";

const mockTemplates = [
  {
    id: "1",
    name: "Welcome Message",
    category: "Marketing",
    body: "Hello {{1}}, welcome to our service!",
    status: "approved",
  },
  {
    id: "2",
    name: "Order Confirmation",
    category: "Transactional",
    body: "Hi {{1}}, your order #{{2}} is confirmed.",
    status: "approved",
  },
  {
    id: "3",
    name: "Holiday Promo",
    category: "Marketing",
    body: "Special offer for {{1}}! Get {{2}}% off.",
    status: "approved",
  },
];

const mockContacts = [
  {
    id: "1",
    name: "John Doe",
    phone: "+1234567890",
    email: "john@example.com",
    tags: ["VIP", "Customer"],
  },
  {
    id: "2",
    name: "Jane Smith",
    phone: "+1345678912",
    email: "jane@example.com",
    tags: ["Lead"],
  },
  {
    id: "3",
    name: "Bob Johnson",
    phone: "+1234567893",
    email: "bob@example.com",
    tags: ["Customer"],
  },
];

export const NewCampaignPage = () => {
  const navigate = useNavigate();

  const handleWizardComplete = (campaignData) => {
    toast.success(
      `Campaign "${campaignData.name}" ${
        campaignData.scheduleType === "now" ? "launched" : "scheduled"
      } successfully!`
    );
    navigate("/campaigns");
  };

  return (
    <div className="container mx-auto px-0 sm:px-6 lg:px-4 py-8">
      <CampaignWizard
        templates={mockTemplates}
        contacts={mockContacts}
        onComplete={handleWizardComplete}
        onClose={() => navigate("/campaigns")}
      />
    </div>
  );
};
