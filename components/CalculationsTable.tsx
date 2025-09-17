// components/RecentItemsTable.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Pencil, Trash2, AlertTriangle, Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import EditPricing from "./EditPricing";

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
  item_name?: string;
  shops?: {
    shop_name: string;
  };
}

interface RecentItemsTableProps {
  refreshTrigger?: number;
  limit?: number;
  onCalculationUpdate?: () => void;
  onEdit?: (calculation: Calculation) => void;
  onDelete?: (id: string) => void;
}

export default function RecentItemsTable({
  refreshTrigger = 0,
  limit = 10,
  onCalculationUpdate,
  onEdit,
  onDelete,
}: RecentItemsTableProps) {
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCalculation, setSelectedCalculation] =
    useState<Calculation | null>(null);
  const [calculationToDelete, setCalculationToDelete] =
    useState<Calculation | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Fetch recent calculations
  useEffect(() => {
    fetchRecentCalculations();
  }, [refreshTrigger, limit]);

  const fetchRecentCalculations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/calculations?limit=${limit}&orderBy=created_at&order=desc`
      );
      if (response.ok) {
        const data = await response.json();
        setCalculations(data);
      }
    } catch (error) {
      console.error("Error fetching recent calculations:", error);
    } finally {
      setIsLoading(false);
    }
  };

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

  const formatMobileDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-LK", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const toggleRowExpansion = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const handleEdit = (calculation: Calculation) => {
    setSelectedCalculation(calculation);
    setIsEditModalOpen(true);
  };

  const handleEditSave = (updatedCalculation: Calculation) => {
    if (onEdit) {
      onEdit(updatedCalculation);
    }
    if (onCalculationUpdate) {
      onCalculationUpdate();
    }
    // Refresh the recent calculations list
    fetchRecentCalculations();
    setIsEditModalOpen(false);
    setSelectedCalculation(null);
  };

  const handleEditCancel = () => {
    setIsEditModalOpen(false);
    setSelectedCalculation(null);
  };

  const handleDeleteClick = (id: string) => {
    const calculation = calculations.find((calc) => calc.id === id);
    if (calculation) {
      setCalculationToDelete(calculation);
      setIsDeleteModalOpen(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!calculationToDelete) return;

    const id = calculationToDelete.id;
    const itemIdentifier =
      calculationToDelete.item_name ||
      calculationToDelete.shops?.shop_name ||
      "this calculation";

    setIsDeleting(id);
    setIsDeleteModalOpen(false);

    try {
      // Call the API to delete the calculation
      const response = await fetch(`/api/calculations?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete calculation");
      }

      const result = await response.json();
      console.log("Delete response:", result);

      // If we have a custom onDelete handler, use it
      if (onDelete) {
        onDelete(id);
      }

      // Trigger the calculation update to refresh the list
      if (onCalculationUpdate) {
        onCalculationUpdate();
      }

      // Refresh the recent calculations list
      fetchRecentCalculations();

      console.log("Calculation deleted successfully");
    } catch (error) {
      console.error("Error deleting calculation:", error);
      alert(`Failed to delete "${itemIdentifier}". Please try again.`);
    } finally {
      setIsDeleting(null);
      setCalculationToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setCalculationToDelete(null);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg font-medium">Loading recent calculations...</p>
        </div>
      </div>
    );
  }

  if (calculations.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center text-gray-500">
          <p className="text-lg font-medium">No recent calculations found</p>
          <p className="text-sm">Your recent calculations will appear here.</p>
        </div>
      </div>
    );
  }

  // Get item identifier for delete modal
  const getItemIdentifier = (calculation: Calculation) => {
    return (
      calculation?.item_name ||
      calculation?.shops?.shop_name ||
      "this calculation"
    );
  };

  // Mobile Card View
  const MobileCardView = () => (
    <div className="space-y-4">
      {calculations.map((calculation) => (
        <div
          key={calculation.id}
          className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1 min-w-0">
              {calculation.item_name && (
                <div className="text-sm font-medium text-gray-900 mb-1 truncate">
                  {calculation.item_name}
                </div>
              )}
              {calculation.shops?.shop_name && (
                <div className="text-xs text-gray-600 mb-1 truncate">
                  {calculation.shops.shop_name}
                </div>
              )}
              <div className="text-xs text-gray-500">
                {formatMobileDate(calculation.created_at)}
              </div>
            </div>
            <div className="flex items-center space-x-2 ml-2">
              <div className="text-right">
                <div className="text-sm font-semibold text-green-600 whitespace-nowrap">
                  Rs.{formatCurrency(calculation.final_value)}
                </div>
                <div className="text-xs text-gray-500">Final</div>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => handleEdit(calculation)}
                  className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                  title="Edit calculation"
                  disabled={isDeleting === calculation.id}
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDeleteClick(calculation.id)}
                  disabled={isDeleting === calculation.id}
                  className={`p-1.5 rounded-md transition-colors ${
                    isDeleting === calculation.id
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-red-600 hover:text-red-800 hover:bg-red-50"
                  }`}
                  title={
                    isDeleting === calculation.id
                      ? "Deleting..."
                      : "Delete calculation"
                  }
                >
                  <Trash2 size={14} />
                </button>
              </div>
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
          </div>

          {/* Expandable details */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <button
              onClick={() => toggleRowExpansion(calculation.id)}
              className="flex items-center space-x-1 text-xs text-gray-600 hover:text-gray-800 transition-colors"
            >
              {expandedRows.has(calculation.id) ? (
                <EyeOff size={12} />
              ) : (
                <Eye size={12} />
              )}
              <span>
                {expandedRows.has(calculation.id)
                  ? "Less details"
                  : "More details"}
              </span>
            </button>

            {expandedRows.has(calculation.id) && (
              <div className="grid grid-cols-2 gap-3 text-sm mt-3">
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
                {calculation.extra_tax > 0 && (
                  <div className="col-span-2">
                    <div className="text-xs text-gray-500 mb-1">Extra Tax</div>
                    <div>Rs.{formatCurrency(calculation.extra_tax)}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  // Improved Mobile Table View
  const MobileTableView = () => (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                Item
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                Qty
              </th>
              <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                Final
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {calculations.map((calculation) => (
              <React.Fragment key={calculation.id}>
                {/* Main row */}
                <tr className="hover:bg-gray-50">
                  <td className="px-2 py-3 text-xs">
                    <div className="space-y-1">
                      {calculation.item_name && (
                        <div className="font-medium text-gray-900 truncate max-w-[100px]">
                          {calculation.item_name}
                        </div>
                      )}
                      {calculation.shops?.shop_name && (
                        <div className="text-gray-600 truncate max-w-[100px]">
                          {calculation.shops.shop_name}
                        </div>
                      )}
                      <div className="text-gray-500">
                        {formatMobileDate(calculation.created_at)}
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-3 text-xs text-gray-900">
                    <div className="font-medium">{calculation.qty}</div>
                    <div className="text-blue-600 text-xs">
                      Rs.
                      {formatCurrency(calculation.unit_price).replace(/,/g, "")}
                    </div>
                  </td>
                  <td className="px-2 py-3 text-xs text-right">
                    <div className="font-semibold text-green-600">
                      Rs.
                      {formatCurrency(calculation.final_value).replace(
                        /,/g,
                        ""
                      )}
                    </div>
                    <button
                      onClick={() => toggleRowExpansion(calculation.id)}
                      className="text-gray-500 hover:text-gray-700 mt-1 text-xs"
                    >
                      {expandedRows.has(calculation.id) ? "Less" : "More"}
                    </button>
                  </td>
                  <td className="px-2 py-3 text-xs">
                    <div className="flex justify-center space-x-1">
                      <button
                        onClick={() => handleEdit(calculation)}
                        className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                        title="Edit"
                        disabled={isDeleting === calculation.id}
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(calculation.id)}
                        disabled={isDeleting === calculation.id}
                        className={`p-1 rounded transition-colors ${
                          isDeleting === calculation.id
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-red-600 hover:text-red-800 hover:bg-red-50"
                        }`}
                        title={
                          isDeleting === calculation.id
                            ? "Deleting..."
                            : "Delete"
                        }
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Expandable row */}
                {expandedRows.has(calculation.id) && (
                  <tr className="bg-gray-50">
                    <td colSpan={4} className="px-2 py-3">
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-gray-500">RMB:</span>
                          <span className="ml-1 font-medium">
                            ¥{formatCurrency(calculation.rmb_price)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">LKR:</span>
                          <span className="ml-1 font-medium">
                            Rs.{formatCurrency(calculation.lkr_amount)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">CMB:</span>
                          <span className="ml-1 font-medium">
                            Rs.{formatCurrency(calculation.cmb_value)}
                          </span>
                        </div>
                        {calculation.extra_tax > 0 && (
                          <div>
                            <span className="text-gray-500">Tax:</span>
                            <span className="ml-1 font-medium">
                              Rs.{formatCurrency(calculation.extra_tax)}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Desktop/Tablet Table View
  const DesktopTableView = () => (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {/* Add Item Name column if available */}
              {calculations.some((calc) => calc.item_name) && (
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
              )}
              {/* Add Shop Name column if available */}
              {calculations.some((calc) => calc.shops?.shop_name) && (
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shop
                </th>
              )}
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Qty
              </th>
              <th className="hidden lg:table-cell px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                RMB Price
              </th>
              <th className="hidden lg:table-cell px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                RMB Amount
              </th>
              <th className="hidden xl:table-cell px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                LKR Amount
              </th>
              <th className="hidden xl:table-cell px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                CMB Value
              </th>
              <th className="hidden xl:table-cell px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Extra Tax
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Final Value
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unit Price
              </th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {calculations.map((calculation) => (
              <tr key={calculation.id} className="hover:bg-gray-50">
                {/* Item Name column if available */}
                {calculations.some((calc) => calc.item_name) && (
                  <td className="px-3 py-2 text-xs text-gray-900 max-w-[120px] truncate">
                    {calculation.item_name || "-"}
                  </td>
                )}
                {/* Shop Name column if available */}
                {calculations.some((calc) => calc.shops?.shop_name) && (
                  <td className="px-3 py-2 text-xs text-gray-900 max-w-[100px] truncate">
                    {calculation.shops?.shop_name || "-"}
                  </td>
                )}
                <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                  {formatDate(calculation.created_at)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                  {calculation.qty}
                </td>
                <td className="hidden lg:table-cell px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                  ¥{formatCurrency(calculation.rmb_price)}
                </td>
                <td className="hidden lg:table-cell px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                  ¥{formatCurrency(calculation.rmb_amount)}
                </td>
                <td className="hidden xl:table-cell px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                  Rs.{formatCurrency(calculation.lkr_amount)}
                </td>
                <td className="hidden xl:table-cell px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                  Rs.{formatCurrency(calculation.cmb_value)}
                </td>
                <td className="hidden xl:table-cell px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                  Rs.{formatCurrency(calculation.extra_tax)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs font-semibold text-green-600">
                  Rs.{formatCurrency(calculation.final_value)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs font-semibold text-blue-600">
                  Rs.{formatCurrency(calculation.unit_price)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs">
                  <div className="flex justify-center space-x-1">
                    <button
                      onClick={() => handleEdit(calculation)}
                      className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                      title="Edit calculation"
                      disabled={isDeleting === calculation.id}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(calculation.id)}
                      disabled={isDeleting === calculation.id}
                      className={`p-1.5 rounded-md transition-colors ${
                        isDeleting === calculation.id
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-red-600 hover:text-red-800 hover:bg-red-50"
                      }`}
                      title={
                        isDeleting === calculation.id
                          ? "Deleting..."
                          : "Delete calculation"
                      }
                    >
                      <Trash2 size={14} />
                    </button>
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
      {/* View Toggle - Show on all screen sizes */}
      <div className="mb-4 md:hidden">
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
      <div className="md:hidden">
        {viewMode === "cards" ? <MobileCardView /> : <MobileTableView />}
      </div>
      <div className="hidden md:block">
        <DesktopTableView />
      </div>

      {/* Summary Row */}
      <div className="bg-gray-50 px-3 py-3 sm:py-2 border border-t-0 sm:border-t border-gray-200 rounded-b-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
          <span className="text-sm font-medium text-gray-700">
            Recent Items: {calculations.length} (of {limit} max)
          </span>
          <span className="text-sm sm:text-base font-semibold text-green-600">
            Total Value: Rs.
            {formatCurrency(
              calculations.reduce((sum, calc) => sum + calc.final_value, 0)
            )}
          </span>
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Pricing Calculation</DialogTitle>
          </DialogHeader>
          {selectedCalculation && (
            <EditPricing
              calculation={selectedCalculation}
              onSave={handleEditSave}
              onCancel={handleEditCancel}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-red-600">
              <AlertTriangle size={24} />
              <span>Confirm Delete</span>
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="mb-4">
              <p className="text-gray-700 mb-2">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-gray-900">
                  &quot;
                  {calculationToDelete
                    ? getItemIdentifier(calculationToDelete)
                    : ""}
                  &quot;
                </span>
                ?
              </p>
              <p className="text-sm text-gray-500">
                This action cannot be undone. The calculation data will be
                permanently removed.
              </p>
            </div>

            {/* Additional info about the item being deleted */}
            {calculationToDelete && (
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Final Value:</span>
                    <span className="ml-1 font-medium text-green-600">
                      Rs.{formatCurrency(calculationToDelete.final_value)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Quantity:</span>
                    <span className="ml-1 font-medium">
                      {calculationToDelete.qty}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Date:</span>
                    <span className="ml-1 font-medium">
                      {formatDate(calculationToDelete.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex space-x-3 pt-4 border-t">
            <button
              onClick={handleDeleteCancel}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              className="flex-1 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Delete
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
