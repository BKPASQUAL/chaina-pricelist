"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Store, Search, X, Package, DollarSign } from "lucide-react";

// Define the Shop type
interface Shop {
  id: number;
  shop_name: string;
  created_at: string;
}

interface Calculation {
  id: number;
  shop_id: number;
  qty: number;
  final_value: number;
  rmb_amount: number;
  cmb_value: number;
  item_name: string;
}

interface ShopMetrics {
  itemCount: number;
  totalAmount: number;
  totalCmbValue: number;
  totalRmbAmount: number;
}

export default function ShopsTable() {
  const router = useRouter();
  const [shops, setShops] = useState<Shop[]>([]);
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Calculate metrics for each shop
  const shopMetrics = useMemo(() => {
    const metrics: Record<number, ShopMetrics> = {};

    shops.forEach((shop) => {
      const shopCalcs = calculations.filter((calc) => calc.shop_id === shop.id);

      metrics[shop.id] = {
        itemCount: shopCalcs.length,
        totalAmount: shopCalcs.reduce((sum, calc) => sum + calc.final_value, 0),
        totalCmbValue: shopCalcs.reduce((sum, calc) => sum + calc.cmb_value, 0),
        totalRmbAmount: shopCalcs.reduce(
          (sum, calc) => sum + calc.rmb_amount,
          0
        ),
      };
    });

    return metrics;
  }, [shops, calculations]);

  // Filter shops based on search term
  const filteredShops = useMemo(() => {
    if (!searchTerm.trim()) {
      return shops;
    }
    return shops.filter((shop) =>
      shop.shop_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [shops, searchTerm]);

  // Clear search function
  const clearSearch = () => {
    setSearchTerm("");
  };

  // Navigation function
  const handleShopClick = (shopId: number) => {
    router.push(`/shop/${shopId}`);
  };

  // Fetch shops and calculations from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch both shops and calculations in parallel
        const [shopsResponse, calculationsResponse] = await Promise.all([
          fetch("/api/shops"),
          fetch("/api/calculations"),
        ]);

        if (!shopsResponse.ok || !calculationsResponse.ok) {
          throw new Error("Failed to fetch data");
        }

        const shopsData = await shopsResponse.json();
        const calculationsData = await calculationsResponse.json();

        setShops(shopsData);
        setCalculations(calculationsData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Format amount for display (compact format)
  const formatAmount = (amount: number) => {
    return amount.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  if (loading) {
    return (
      <div className="mt-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Store className="w-5 h-5 text-blue-500" />
            Shops Directory
          </h2>
          <p className="text-sm text-gray-600 mt-1">Loading shops...</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <Card key={index} className="border border-gray-200">
              <CardContent className="p-3">
                <div className="animate-pulse">
                  <div className="h-5 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2 w-3/4"></div>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="h-8 bg-gray-200 rounded"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Store className="w-5 h-5 text-blue-500" />
            Shops Directory
          </h2>
          <p className="text-sm text-red-600 mt-1">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Store className="w-5 h-5 text-blue-500" />
          Shops Directory
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {searchTerm
            ? `${filteredShops.length} of ${shops.length} shops found`
            : `${shops.length} shops registered`}
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search shops..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Responsive Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filteredShops.map((shop) => {
          const metrics = shopMetrics[shop.id] || {
            itemCount: 0,
            totalAmount: 0,
            totalCmbValue: 0,
            totalRmbAmount: 0,
          };

          return (
            <Card
              key={shop.id}
              onClick={() => handleShopClick(shop.id)}
              className="hover:shadow-md transition-all duration-200 cursor-pointer border border-gray-200 hover:border-blue-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <CardContent className="p-3">
                {/* Shop Header */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Store className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">
                      {shop.shop_name}
                    </h3>
                  </div>
                </div>

                {/* Metrics Grid - Compact 2x2 Layout */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* Items Count */}
                  <div className="bg-blue-50 rounded p-1.5 border border-blue-100">
                    <div className="flex items-center gap-1 mb-0.5">
                      <Package className="w-3 h-3 text-blue-600" />
                      <span className="text-blue-700 font-medium">Items</span>
                    </div>
                    <div className="font-bold text-blue-900">
                      {metrics.itemCount}
                    </div>
                  </div>

                  {/* Total Amount */}
                  <div className="bg-green-50 rounded p-1.5 border border-green-100">
                    <div className="flex items-center gap-1 mb-0.5">
                      <DollarSign className="w-3 h-3 text-green-600" />
                      <span className="text-green-700 font-medium">Total</span>
                    </div>
                    <div
                      className="font-bold text-green-900 truncate"
                      title={formatAmount(metrics.totalAmount)}
                    >
                      {formatAmount(metrics.totalAmount)}
                    </div>
                  </div>

                  {/* CMB Value */}
                  <div className="bg-orange-50 rounded p-1.5 border border-orange-100">
                    <div className="text-orange-700 font-medium mb-0.5">
                      CMB
                    </div>
                    <div
                      className="font-bold text-orange-900 truncate"
                      title={formatAmount(metrics.totalCmbValue)}
                    >
                      {formatAmount(metrics.totalCmbValue)}
                    </div>
                  </div>

                  {/* RMB Amount */}
                  <div className="bg-red-50 rounded p-1.5 border border-red-100">
                    <div className="text-red-700 font-medium mb-0.5">RMB</div>
                    <div
                      className="font-bold text-red-900 truncate"
                      title={`¥${formatAmount(metrics.totalRmbAmount)}`}
                    >
                      ¥{formatAmount(metrics.totalRmbAmount)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty state for filtered results */}
      {filteredShops.length === 0 && searchTerm && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-sm mb-2">
            No shops found matching &ldquo;{searchTerm}&rdquo;
          </p>
          <button
            onClick={clearSearch}
            className="text-blue-500 hover:text-blue-600 text-sm underline"
          >
            Clear search
          </button>
        </div>
      )}

      {/* Empty state for no shops */}
      {shops.length === 0 && (
        <div className="text-center py-12">
          <Store className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">No shops found</p>
        </div>
      )}
    </div>
  );
}
