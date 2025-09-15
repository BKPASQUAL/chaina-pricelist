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


        <PricingForm onCalculationSaved={handleCalculationSaved} />
        <CalculationsTable refreshTrigger={refreshTrigger} />
      </div>
    </main>
  );
}
