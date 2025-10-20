"use client";

import React, { useState } from "react";
import CustomerPointsManagement from "@/components/CustomerPointsManagement";
import CustomerOnboarding from "@/components/QRScanner";
import Navbar from "@/components/layout/NavBar";

export default function PointsPage() {
  const [activeTab, setActiveTab] = useState<"manage" | "onboard">("manage");
  const [programId, setProgramId] = useState<string>("");
  const [passId, setPassId] = useState<string>("");
  const [businessId, setBusinessId] = useState<string>(""); // We'll store email here instead of ID
  const [isLoading, setIsLoading] = useState(true);

  // Fetch program and business info on page load
  React.useEffect(() => {
    const fetchProgramData = async () => {
      try {
        // Get the user's active program and business ID
        const response = await fetch("/api/passes");

        if (!response.ok) {
          throw new Error("Failed to fetch program data");
        }

        const data = await response.json();

        // Get the first active program and the user's email
        if (data.passes && data.passes.length > 0) {
          const activePass = data.passes[0];
          setProgramId(activePass.id || ""); // Use passId as programId
          setBusinessId(data.email || ""); // Use the authenticated user's email
          setPassId(activePass.id || "");
        }
      } catch (error) {
        console.error("Error fetching program data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProgramData();
  }, []);

  // Handle customer verification completion
  const handleCustomerVerified = (customerId: string) => {
    // Switch to manage tab and potentially pre-select the customer
    setActiveTab("manage");
    // You could also set a state to highlight the newly onboarded customer
    // or pass this info to the CustomerPointsManagement component
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="w-full max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="p-8">
        <div className="w-full my-22 max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Points Management</h1>
            <p className="text-gray-600">
              Manage customer points and loyalty program
            </p>
          </div>

          {/* Tab Content */}
          <div className="pb-16">
            {activeTab === "manage" ? (
              <CustomerPointsManagement programId={programId} />
            ) : (
              <CustomerOnboarding
                programId={programId}
                businessEmail={businessId} // Using businessId as email since that's what we have in the dashboard
                passId={passId}
                onCustomerVerified={handleCustomerVerified}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
