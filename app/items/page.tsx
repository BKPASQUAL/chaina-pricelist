"use client";

import React, { useState, useEffect } from "react";
import {
  Pencil,
  Trash2,
  AlertTriangle,
  Eye,
  EyeOff,
  Search,
  Filter,
  Download,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import EditPricing from "@/components/EditPricing";

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
import * as XLSX from "xlsx";

export default function AllItemsPage() {
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [filteredCalculations, setFilteredCalculations] = useState<
    Calculation[]
  >([]);
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

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<
    "created_at" | "final_value" | "qty" | "item_name"
  >("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [shopFilter, setShopFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // Fetch all calculations
  useEffect(() => {
    fetchAllCalculations();
  }, []);

  // Apply filters whenever search term, sort, or shop filter changes
  useEffect(() => {
    applyFilters();
  }, [calculations, searchTerm, sortBy, sortOrder, shopFilter]);

  const fetchAllCalculations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/calculations?limit=1000&orderBy=${sortBy}&order=${sortOrder}`
      );
      if (response.ok) {
        const data = await response.json();
        setCalculations(data);
      }
    } catch (error) {
      console.error("Error fetching all calculations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...calculations];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (calc) =>
          calc.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          calc.shops?.shop_name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    // Shop filter
    if (shopFilter !== "all") {
      filtered = filtered.filter(
        (calc) => calc.shops?.shop_name === shopFilter
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "created_at":
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case "final_value":
          aValue = a.final_value;
          bValue = b.final_value;
          break;
        case "qty":
          aValue = a.qty;
          bValue = b.qty;
          break;
        case "item_name":
          aValue = a.item_name || "";
          bValue = b.item_name || "";
          break;
        default:
          aValue = 0;
          bValue = 0;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredCalculations(filtered);
    setCurrentPage(1); // Reset to first page when filters change
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
    // Refresh the calculations list
    fetchAllCalculations();
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
      const response = await fetch(`/api/calculations?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete calculation");
      }

      // Refresh the calculations list
      fetchAllCalculations();
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

  const exportData = () => {
    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();

    // Group calculations by shop - Fix: Add proper type annotation
    const groupedByShop: Record<string, Calculation[]> =
      filteredCalculations.reduce((groups, calc) => {
        const shopName = calc.shops?.shop_name || "No Shop";
        if (!groups[shopName]) {
          groups[shopName] = [];
        }
        groups[shopName].push(calc);
        return groups;
      }, {} as Record<string, Calculation[]>);

    // Prepare data with title row and headers
    const title = `All Items Report - ${new Date().toLocaleDateString(
      "en-LK"
    )}`;
    const headers = [
      "Item Name",
      "Date",
      "Quantity",
      "RMB Price",
      "RMB Amount",
      "LKR Amount",
      "CMB Rate",
      "CMB Amount",
      "CMB Value",
      "Extra Tax",
      "Final Value",
      "Unit Price",
      "Exchange Rate",
    ];

    // Build worksheet data
    const wsData: (string | number)[][] = [
      [title], // Title row
      [], // Empty row
    ];

    let currentRow = 2;
    const shopRows: number[] = []; // Fix: Add proper type annotation
    const mergeRanges: {
      s: { c: number; r: number };
      e: { c: number; r: number };
    }[] = []; // Fix: Add proper type annotation

    // Add title merge range
    mergeRanges.push({ s: { c: 0, r: 0 }, e: { c: headers.length - 1, r: 0 } });

    // Process each shop
    Object.keys(groupedByShop)
      .sort()
      .forEach((shopName) => {
        const shopItems = groupedByShop[shopName]; // This now works because groupedByShop has proper type

        // Add shop name row
        const shopRow: (string | number)[] = [shopName];
        wsData.push(shopRow);
        shopRows.push(currentRow);

        // Merge shop name across all columns
        mergeRanges.push({
          s: { c: 0, r: currentRow },
          e: { c: headers.length - 1, r: currentRow },
        });
        currentRow++;

        // Add headers for this shop
        wsData.push(headers);
        currentRow++;

        // Add items for this shop - Fix: Add type annotation for calc parameter
        shopItems.forEach((calc: Calculation) => {
          const itemRow: (string | number)[] = [
            calc.item_name || "",
            formatDate(calc.created_at),
            calc.qty,
            calc.rmb_price.toFixed(2),
            calc.rmb_amount.toFixed(2),
            calc.lkr_amount.toFixed(2),
            calc.cmb_rate.toFixed(2),
            calc.cmb_amount.toFixed(2),
            calc.cmb_value.toFixed(2),
            calc.extra_tax.toFixed(2),
            calc.final_value.toFixed(2),
            calc.unit_price.toFixed(2),
            calc.exchange_rate.toFixed(2),
          ];
          wsData.push(itemRow);
          currentRow++;
        });

        // Add empty row between shops
        wsData.push([]);
        currentRow++;
      });

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(wsData);

    // Apply merges - Fix: Add null check
    if (!worksheet["!merges"]) worksheet["!merges"] = [];
    mergeRanges.forEach((range) => {
      worksheet["!merges"]?.push(range); // Use optional chaining
    });

    // Style the title row (row 1)
    try {
      const titleCell = "A1";
      if (worksheet[titleCell]) {
        if (!worksheet[titleCell].s) worksheet[titleCell].s = {};
        worksheet[titleCell].s = {
          font: { bold: true, size: 16 },
          alignment: { horizontal: "center", vertical: "center" },
          fill: { fgColor: { rgb: "4472C4" } },
        };
      }

      // Style shop header rows (green background and center alignment)
      // Style shop name rows (center + green highlight only)
      shopRows.forEach((rowIndex: number) => {
        const cellAddress = XLSX.utils.encode_cell({ c: 0, r: rowIndex }); // Only first cell
        if (!worksheet[cellAddress]) {
          worksheet[cellAddress] = { v: "", t: "s" };
        }
        worksheet[cellAddress].s = {
          font: { bold: true, size: 14, color: { rgb: "FFFFFF" } }, // White text
          alignment: { horizontal: "center", vertical: "center" },
          fill: { fgColor: { rgb: "70AD47" } }, // Green background
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
          },
        };
      });

      // Style all header rows
      wsData.forEach((row, rowIndex) => {
        if (row.length > 0 && row[0] === "Item Name") {
          headers.forEach((header, colIndex) => {
            const cellAddress = XLSX.utils.encode_cell({
              c: colIndex,
              r: rowIndex,
            });
            if (worksheet[cellAddress]) {
              if (!worksheet[cellAddress].s) worksheet[cellAddress].s = {};
              worksheet[cellAddress].s = {
                font: { bold: true },
                fill: { fgColor: { rgb: "D9E1F2" } },
                alignment: { horizontal: "center" },
              };
            }
          });
        }
      });
    } catch (error) {
      console.warn(
        "Styling failed, but Excel file will still be created:",
        error
      );
    }

    // Set column widths
    const colWidths = [
      { wch: 25 }, // Item Name
      { wch: 18 }, // Date
      { wch: 10 }, // Quantity
      { wch: 12 }, // RMB Price
      { wch: 12 }, // RMB Amount
      { wch: 12 }, // LKR Amount
      { wch: 12 }, // CMB Rate
      { wch: 12 }, // CMB Amount
      { wch: 12 }, // CMB Value
      { wch: 12 }, // Extra Tax
      { wch: 12 }, // Final Value
      { wch: 12 }, // Unit Price
      { wch: 15 }, // Exchange Rate
    ];
    worksheet["!cols"] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Items by Shop");

    // Generate Excel file and download
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `items_by_shop_${new Date().toISOString().split("T")[0]}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Get unique shops for filter dropdown
  const uniqueShops = Array.from(
    new Set(calculations.map((calc) => calc.shops?.shop_name).filter(Boolean))
  );

  // Get item identifier for delete modal
  const getItemIdentifier = (calculation: Calculation) => {
    return (
      calculation?.item_name ||
      calculation?.shops?.shop_name ||
      "this calculation"
    );
  };

  // Pagination
  const totalPages = Math.ceil(filteredCalculations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredCalculations.slice(startIndex, endIndex);

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <div className="text-center text-gray-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-6"></div>
            <p className="text-xl font-medium">Loading all items...</p>
            <p className="text-sm mt-2">
              Please wait while we fetch your data.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (calculations.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <div className="text-center text-gray-500">
            <p className="text-xl font-medium">No items found</p>
            <p className="text-sm mt-2">
              Start by creating your first calculation.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Mobile Card View
  const MobileCardView = () => (
    <div className="space-y-4">
      {currentItems.map((calculation) => (
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

  // Mobile Table View
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
            {currentItems.map((calculation) => (
              <React.Fragment key={calculation.id}>
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

  // Desktop Table View
  const DesktopTableView = () => (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {calculations.some((calc) => calc.item_name) && (
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => {
                      setSortBy("item_name");
                      setSortOrder(
                        sortBy === "item_name" && sortOrder === "asc"
                          ? "desc"
                          : "asc"
                      );
                    }}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Item</span>
                    <span className="text-xs">
                      {sortBy === "item_name"
                        ? sortOrder === "asc"
                          ? "↑"
                          : "↓"
                        : "↕"}
                    </span>
                  </button>
                </th>
              )}
              {calculations.some((calc) => calc.shops?.shop_name) && (
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shop
                </th>
              )}
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => {
                    setSortBy("created_at");
                    setSortOrder(
                      sortBy === "created_at" && sortOrder === "asc"
                        ? "desc"
                        : "asc"
                    );
                  }}
                  className="flex items-center space-x-1 hover:text-gray-700"
                >
                  <span>Date</span>
                  <span className="text-xs">
                    {sortBy === "created_at"
                      ? sortOrder === "asc"
                        ? "↑"
                        : "↓"
                      : "↕"}
                  </span>
                </button>
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => {
                    setSortBy("qty");
                    setSortOrder(
                      sortBy === "qty" && sortOrder === "asc" ? "desc" : "asc"
                    );
                  }}
                  className="flex items-center space-x-1 hover:text-gray-700"
                >
                  <span>Qty</span>
                  <span className="text-xs">
                    {sortBy === "qty" ? (sortOrder === "asc" ? "↑" : "↓") : "↕"}
                  </span>
                </button>
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
                <button
                  onClick={() => {
                    setSortBy("final_value");
                    setSortOrder(
                      sortBy === "final_value" && sortOrder === "asc"
                        ? "desc"
                        : "asc"
                    );
                  }}
                  className="flex items-center space-x-1 hover:text-gray-700"
                >
                  <span>Final Value</span>
                  <span className="text-xs">
                    {sortBy === "final_value"
                      ? sortOrder === "asc"
                        ? "↑"
                        : "↓"
                      : "↕"}
                  </span>
                </button>
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
            {currentItems.map((calculation) => (
              <tr key={calculation.id} className="hover:bg-gray-50">
                {calculations.some((calc) => calc.item_name) && (
                  <td className="px-3 py-2 text-xs text-gray-900 max-w-[120px] truncate">
                    {calculation.item_name || "-"}
                  </td>
                )}
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
    <div className="container mx-auto px-1 py-4">
      {/* Header */}
      {/* <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">All Items</h1>
        <p className="text-gray-600">
          Manage and view all your pricing calculations in one place.
        </p>
      </div> */}

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-2 mb-4">
        {/* Export Button */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ">
          <button
            onClick={exportData}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>
          {/* Search */}
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Search items or shops..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Shop Filter */}
          <select
            value={shopFilter}
            onChange={(e) => setShopFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Shops</option>
            {uniqueShops.map((shop) => (
              <option key={shop} value={shop}>
                {shop}
              </option>
            ))}
          </select>
        </div>

        {/* Results Summary */}
        {/* <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0 text-sm text-gray-600">
          <span>
            Showing {startIndex + 1}-
            {Math.min(endIndex, filteredCalculations.length)} of{" "}
            {filteredCalculations.length} items
            {filteredCalculations.length !== calculations.length &&
              ` (filtered from ${calculations.length} total)`}
          </span>
          <span className="font-semibold text-green-600">
            Total Value: Rs.
            {formatCurrency(
              filteredCalculations.reduce(
                (sum, calc) => sum + calc.final_value,
                0
              )
            )}
          </span>
        </div> */}
      </div>

      {/* View Toggle - Mobile Only */}
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

      {/* Main Content */}
      {filteredCalculations.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <div className="text-center text-gray-500">
            <Filter size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-xl font-medium">No items match your filters</p>
            <p className="text-sm mt-2">
              Try adjusting your search criteria or filters.
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setShopFilter("all");
              }}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Mobile Views */}
          <div className="md:hidden">
            {viewMode === "cards" ? <MobileCardView /> : <MobileTableView />}
          </div>

          {/* Desktop View */}
          <div className="hidden md:block">
            <DesktopTableView />
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white border border-t-0 border-gray-200 rounded-b-lg px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm text-gray-700">
                  <span>
                    Page {currentPage} of {totalPages}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  {/* Page Numbers */}
                  <div className="hidden sm:flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1 text-sm border rounded-md ${
                            currentPage === pageNum
                              ? "bg-blue-600 text-white border-blue-600"
                              : "border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

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
