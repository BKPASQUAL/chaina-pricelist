// components/ItemsTable.tsx
"use client";

import React, { useState } from "react";

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

interface ItemsTableProps {
  calculations: Calculation[];
  onCalculationUpdate?: () => void;
}

export default function ItemsTable({
  calculations,
  onCalculationUpdate,
}: ItemsTableProps) {
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("en-LK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-LK", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (calculations.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center text-gray-500">
          <p className="text-lg font-medium">No calculations found</p>
          <p className="text-sm">Add some items to see them here.</p>
        </div>
      </div>
    );
  }

  // Mobile Card View
  const MobileCardView = () => (
    <div className="space-y-4">
      {calculations.map((calculation) => (
        <div
          key={calculation.id}
          className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="text-xs text-gray-500">
              {formatDate(calculation.created_at)}
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-green-600">
                Rs.{formatCurrency(calculation.final_value)}
              </div>
              <div className="text-xs text-gray-500">Final Value</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs text-gray-500 mb-1">Quantity</div>
              <div className="font-medium">{calculation.qty}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Unit Price</div>
              <div className="font-medium text-blue-600">
                Rs.{formatCurrency(calculation.unit_price)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">RMB Price</div>
              <div>¥{formatCurrency(calculation.rmb_price)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">RMB Amount</div>
              <div>¥{formatCurrency(calculation.rmb_amount)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">LKR Amount</div>
              <div>Rs.{formatCurrency(calculation.lkr_amount)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">CMB Value</div>
              <div>Rs.{formatCurrency(calculation.cmb_value)}</div>
            </div>
          </div>

          {calculation.extra_tax > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Extra Tax</span>
                <span>Rs.{formatCurrency(calculation.extra_tax)}</span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  // Desktop/Tablet Table View
  const TableView = () => (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Qty
              </th>
              <th className="hidden sm:table-cell px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                RMB Price
              </th>
              <th className="hidden md:table-cell px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                RMB Amount
              </th>
              <th className="hidden lg:table-cell px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                LKR Amount
              </th>
              <th className="hidden lg:table-cell px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                CMB Value
              </th>
              <th className="hidden xl:table-cell px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Extra Tax
              </th>
              <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Final Value
              </th>
              <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unit Price
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {calculations.map((calculation) => (
              <tr key={calculation.id} className="hover:bg-gray-50">
                <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                  <div className="sm:hidden">
                    {new Date(calculation.created_at).toLocaleDateString(
                      "en-LK",
                      {
                        month: "short",
                        day: "numeric",
                      }
                    )}
                  </div>
                  <div className="hidden sm:block">
                    {formatDate(calculation.created_at)}
                  </div>
                </td>
                <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                  {calculation.qty}
                </td>
                <td className="hidden sm:table-cell px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                  ¥{formatCurrency(calculation.rmb_price)}
                </td>
                <td className="hidden md:table-cell px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                  ¥{formatCurrency(calculation.rmb_amount)}
                </td>
                <td className="hidden lg:table-cell px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                  Rs.{formatCurrency(calculation.lkr_amount)}
                </td>
                <td className="hidden lg:table-cell px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                  Rs.{formatCurrency(calculation.cmb_value)}
                </td>
                <td className="hidden xl:table-cell px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                  Rs.{formatCurrency(calculation.extra_tax)}
                </td>
                <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs font-semibold text-green-600">
                  <div className="sm:hidden">
                    Rs.
                    {formatCurrency(calculation.final_value).replace(/,/g, "")}
                  </div>
                  <div className="hidden sm:block">
                    Rs.{formatCurrency(calculation.final_value)}
                  </div>
                </td>
                <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs font-semibold text-blue-600">
                  <div className="sm:hidden">
                    Rs.
                    {formatCurrency(calculation.unit_price).replace(/,/g, "")}
                  </div>
                  <div className="hidden sm:block">
                    Rs.{formatCurrency(calculation.unit_price)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="w-full">
      {/* View Toggle - Only show on small screens */}
      <div className="sm:hidden mb-4">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode("table")}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              viewMode === "table"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Table
          </button>
          <button
            onClick={() => setViewMode("cards")}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              viewMode === "cards"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Cards
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="sm:hidden">
        {viewMode === "cards" ? <MobileCardView /> : <TableView />}
      </div>
      <div className="hidden sm:block">
        <TableView />
      </div>

      {/* Summary Row */}
      <div className="bg-gray-50 px-3 py-3 sm:py-2 border border-t-0 sm:border-t border-gray-200 rounded-b-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
          <span className="text-sm font-medium text-gray-700">
            Total Items: {calculations.length}
          </span>
          <span className="text-sm sm:text-base font-semibold text-green-600">
            Total Value: Rs.
            {formatCurrency(
              calculations.reduce((sum, calc) => sum + calc.final_value, 0)
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
