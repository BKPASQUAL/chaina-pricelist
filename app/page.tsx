"use client";

import { useState } from "react";
import { PricingForm } from "@/components/PricingForm";
import { CalculationsTable } from "@/components/CalculationsTable";

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCalculationSaved = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <main className="min-h-screen bg-gray-50 py-2 px-2">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            China Pricing Calculator
          </h1>
          <p className="text-lg text-gray-600">
            Calculate and track your product pricing with taxes and additional
            costs
          </p>
        </div> */}

        <PricingForm onCalculationSaved={handleCalculationSaved} />
        <CalculationsTable refreshTrigger={refreshTrigger} />
      </div>
    </main>
  );
}
