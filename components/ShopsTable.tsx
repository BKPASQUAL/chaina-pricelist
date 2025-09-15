"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Store, Search, X } from "lucide-react";

// Define the Shop type
interface Shop {
  id: number;
  shop_name: string;
  created_at: string;
}

export default function ShopsTable() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Function to format the created date and time
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

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

  // Fetch shops from API
  useEffect(() => {
    const fetchShops = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/shops");

        if (!response.ok) {
          throw new Error("Failed to fetch shops");
        }

        const data = await response.json();
        setShops(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        console.error("Error fetching shops:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchShops();
  }, []);

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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <Card key={index} className="border border-gray-200">
              <CardContent className="p-2">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 animate-pulse">
                    <Store className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="h-4 bg-gray-200 rounded animate-pulse mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {filteredShops.map((shop) => (
          <Card
            key={shop.id}
            className="hover:shadow-md transition-shadow duration-200 cursor-pointer border border-gray-200 hover:border-blue-300"
          >
            <CardContent className="p-2">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <Store className="w-5 h-5 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-gray-900 text-sm leading-tight truncate">
                    {shop.shop_name}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Created: {formatDateTime(shop.created_at)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
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
