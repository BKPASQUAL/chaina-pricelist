"use client";

import React, { useState, useEffect } from "react";
import { Store, Package, DollarSign } from "lucide-react";
import ShopsTable from "@/components/ShopsTable";

// Define types for the API responses
interface Shop {
  id: number;
  shop_name: string;
  created_at: string;
}

interface Calculation {
  id: number;
  item_name: string; // Added item_name field
  shop_id: number;
  qty: number;
  final_value: number;
  created_at: string;
  shops: {
    shop_name: string;
  };
}

interface DashboardData {
  shopsCount: number;
  totalItems: number; // This will now be count of unique item names
  totalAmount: number;
}

export default function Page() {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    shopsCount: 0,
    totalItems: 0,
    totalAmount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data from APIs
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch shops and calculations in parallel
        const [shopsResponse, calculationsResponse] = await Promise.all([
          fetch("/api/shops"),
          fetch("/api/calculations"),
        ]);

        if (!shopsResponse.ok || !calculationsResponse.ok) {
          throw new Error("Failed to fetch dashboard data");
        }

        const shops: Shop[] = await shopsResponse.json();
        const calculations: Calculation[] = await calculationsResponse.json();

        // Calculate dashboard metrics
        const shopsCount = shops.length;

        // Count unique item names (not quantities)
        const uniqueItemNames = new Set(
          calculations.map((calc) => calc.item_name.toLowerCase().trim())
        );
        const totalItems = uniqueItemNames.size;

        // Sum all final values
        const totalAmount = calculations.reduce(
          (sum, calc) => sum + calc.final_value,
          0
        );

        setDashboardData({
          shopsCount,
          totalItems,
          totalAmount,
        });

        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Format amount for display (show full amount with proper formatting)
  const formatAmount = (amount: number) => {
    return amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="p-2 bg-gray-50 min-h-screen">
      {/* Mobile-friendly single row layout */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {/* Shops Count Card */}
        <div className="bg-white rounded-lg shadow-sm p-3 min-w-30 flex-shrink-0 border-t-4 border-blue-500">
          <div className="flex flex-col items-center text-center">
            <Store className="w-5 h-5 text-blue-500 mb-1" />
            <p className="text-xs text-gray-600 mb-1 font-medium">Shops</p>
            {loading ? (
              <div className="w-8 h-4 bg-gray-200 rounded animate-pulse"></div>
            ) : error ? (
              <p className="text-xs text-red-500">Error</p>
            ) : (
              <p className="text-lg font-bold text-gray-900">
                {dashboardData.shopsCount}
              </p>
            )}
          </div>
        </div>

        {/* Unique Items Count Card */}
        <div className="bg-white rounded-lg shadow-sm p-3 min-w-30 flex-shrink-0 border-t-4 border-green-500">
          <div className="flex flex-col items-center text-center">
            <Package className="w-5 h-5 text-green-500 mb-1" />
            <p className="text-xs text-gray-600 mb-1 font-medium">Items</p>
            {loading ? (
              <div className="w-12 h-4 bg-gray-200 rounded animate-pulse"></div>
            ) : error ? (
              <p className="text-xs text-red-500">Error</p>
            ) : (
              <p className="text-lg font-bold text-gray-900">
                {dashboardData.totalItems}
              </p>
            )}
          </div>
        </div>

        {/* Total Amount Card - Show full amount */}
        <div className="bg-white rounded-lg shadow-sm p-3 min-w-30 flex-shrink-0 border-t-4 border-purple-500">
          <div className="flex flex-col items-center text-center">
            <DollarSign className="w-5 h-5 text-purple-500 mb-1" />
            <p className="text-xs text-gray-600 mb-1 font-medium">
              Total Amount
            </p>
            {loading ? (
              <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
            ) : error ? (
              <p className="text-xs text-red-500">Error</p>
            ) : (
              <p
                className="text-xs font-bold text-gray-900"
                title={`LKR ${formatAmount(dashboardData.totalAmount)}`}
              >
                {formatAmount(dashboardData.totalAmount)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Show global error message if needed */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">
            Failed to load dashboard data: {error}
          </p>
        </div>
      )}

      <ShopsTable />
    </div>
  );
}
