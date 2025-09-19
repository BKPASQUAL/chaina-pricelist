"use client";

import React, { useState, useEffect } from "react";
import { ShoppingCart, Store, DollarSign, TrendingUp } from "lucide-react";

// TypeScript interfaces
interface Calculation {
  qty: number;
  final_value: number;
  rmb_amount: number;
  item_name: string; // Added item_name field
}

interface Shop {
  id: string;
  name: string;
  // Add other shop properties as needed
}

interface DashboardStats {
  totalItems: number;
  totalShops: number;
  totalAmountLKR: number;
  totalAmountCNY: number;
  loading: boolean;
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string;
  fullValue?: string;
  subtitle?: string;
  bgColor: string;
  textColor: string;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalItems: 0,
    totalShops: 0,
    totalAmountLKR: 0,
    totalAmountCNY: 0,
    loading: true,
  });

  useEffect(() => {
    const fetchDashboardData = async (): Promise<void> => {
      try {
        // Fetch calculations and shops data
        const [calculationsResponse, shopsResponse] = await Promise.all([
          fetch("/api/calculations"),
          fetch("/api/shops"),
        ]);

        const calculations: Calculation[] = await calculationsResponse.json();
        const shops: Shop[] = await shopsResponse.json();

        // Calculate statistics
        const uniqueItemNames = new Set(
          calculations.map((calc) => calc.item_name.toLowerCase().trim())
        );
        const totalItems = uniqueItemNames.size;
        const totalShops = shops.length;
        const totalAmountLKR = calculations.reduce(
          (sum: number, calc: Calculation) => sum + calc.final_value,
          0
        );
        const totalAmountCNY = calculations.reduce(
          (sum: number, calc: Calculation) => sum + calc.rmb_amount,
          0
        );

        setStats({
          totalItems,
          totalShops,
          totalAmountLKR,
          totalAmountCNY,
          loading: false,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setStats((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchDashboardData();
  }, []);

  // Format amount in millions for display
  const formatMillions = (amount: number, symbol: string): string => {
    const millions = amount / 1000000;
    if (millions >= 1) {
      return `${symbol} ${millions.toFixed(2)}M`;
    }
    return `${symbol} ${amount.toLocaleString()}`;
  };

  // Format full amount without millions
  const formatFullAmount = (amount: number, symbol: string): string => {
    return `${symbol} ${amount.toLocaleString()}`;
  };

  const StatCard: React.FC<StatCardProps> = ({
    icon: Icon,
    title,
    value,
    fullValue,
    subtitle,
    bgColor,
    textColor,
  }) => (
    <div
      className={`${bgColor} rounded-xl p-4 shadow-lg transform hover:scale-105 transition-all duration-200`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg bg-white bg-opacity-20`}>
          <Icon className={`w-6 h-6 ${textColor}`} />
        </div>
      </div>
      <div>
        <h3 className={`text-sm font-medium ${textColor} opacity-90 mb-1`}>
          {title}
        </h3>
        <p className={`text-xl font-bold ${textColor} mb-1`}>{value}</p>
        {fullValue && (
          <p className={`text-sm font-semibold ${textColor} opacity-85 mb-1`}>
            {fullValue}
          </p>
        )}
        {subtitle && (
          <p className={`text-xs ${textColor} opacity-75`}>{subtitle}</p>
        )}
      </div>
    </div>
  );

  if (stats.loading) {
    return (
      <div className="min-h-screen  p-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">Loading your business overview...</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-4 shadow-lg animate-pulse"
              >
                <div className="w-full h-20 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br  to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Overview of your business performance</p>
        </div>

        {/* Stats Cards - Mobile: 2 per row, Desktop: 4 per row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={ShoppingCart}
            title="Total Items"
            value={stats.totalItems.toLocaleString()}
            subtitle="Items in inventory"
            bgColor="bg-gradient-to-br from-blue-500 to-blue-600"
            textColor="text-white"
          />

          <StatCard
            icon={Store}
            title="Total Shops"
            value={stats.totalShops.toLocaleString()}
            subtitle="Active shops"
            bgColor="bg-gradient-to-br from-green-500 to-green-600"
            textColor="text-white"
          />

          <StatCard
            icon={DollarSign}
            title="Total Amount (LKR)"
            value={formatMillions(stats.totalAmountLKR, "Rs")}
            fullValue={formatFullAmount(stats.totalAmountLKR, "Rs")}
            subtitle="Sri Lankan Rupees"
            bgColor="bg-gradient-to-br from-purple-500 to-purple-600"
            textColor="text-white"
          />

          <StatCard
            icon={TrendingUp}
            title="Total Amount (CNY)"
            value={formatMillions(stats.totalAmountCNY, "¥")}
            fullValue={formatFullAmount(stats.totalAmountCNY, "¥")}
            subtitle="Chinese Yuan"
            bgColor="bg-gradient-to-br from-orange-500 to-orange-600"
            textColor="text-white"
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
