"use client";

import ItemsTable from "@/components/ItemsTable";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Shop {
  id: string;
  shop_name: string;
  created_at: string;
}

interface Calculation {
  id: string;
  shop_id: string;
  qty: number;
  rmb_price: number;
  rmb_amount: number;
  lkr_amount: number;
  cmb_rate: number;
  cmb_amount: number;
  cmb_value: number;
  extra_tax: number;
  final_value: number;
  unit_price: number;
  exchange_rate: number;
  created_at: string;
  shops?: {
    shop_name: string;
  };
}

export default function ShopPage() {
  const params = useParams();
  const shopId = params?.id;

  const [shop, setShop] = useState<Shop | null>(null);
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch shop details and calculations
  const fetchShopData = async () => {
    try {
      const response = await fetch(`/api/shops/${shopId}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError("Shop not found");
        } else {
          throw new Error("Failed to fetch shop data");
        }
        return;
      }

      const data = await response.json();
      setShop(data.shop);
      setCalculations(data.calculations);
    } catch (err) {
      console.error("Error fetching shop data:", err);
      setError("Failed to fetch shop details");
    }
  };

  useEffect(() => {
    if (shopId) {
      fetchShopData().finally(() => setLoading(false));
    }
  }, [shopId]);

  // Calculate totals
  const totalItems = calculations.length;
  const totalAmount = calculations.reduce(
    (sum, calc) => sum + calc.final_value,
    0
  );

  if (loading) {
    return (
      <div className="p-3">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4 w-48"></div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="p-3">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-semibold">Error</h2>
          <p className="text-red-600">{error || "Shop not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3">
      <div className="mb-3">
        <h1 className="text-xl font-bold text-gray-800">{shop.shop_name}</h1>
      </div>

      {/* Cards Row */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        {/* Items Count Card */}
        <div className="bg-white rounded-lg p-2 border border-gray-200">
          <div className="flex flex-col">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Items</h3>
            <div className="text-sm font-bold text-blue-600">{totalItems}</div>
          </div>
        </div>

        {/* Amount Card */}
        <div className="bg-white rounded-lg p-2 border border-gray-200">
          <div className="flex flex-col">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">
              Amount (LKR)
            </h3>
            <div className="text-sm font-bold text-green-600">
              {totalAmount.toLocaleString("en-LK", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <ItemsTable
        calculations={calculations}
        onCalculationUpdate={fetchShopData}
      />
    </div>
  );
}
