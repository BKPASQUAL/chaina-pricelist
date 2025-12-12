"use client";

import React, { useState, useEffect } from "react";

interface Calculation {
  item_name?: string;
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

interface EditPricingProps {
  calculation: Calculation;
  onSave: (updatedCalculation: Calculation) => void;
  onCancel: () => void;
}

const EditPricing: React.FC<EditPricingProps> = ({
  calculation,
  onSave,
  onCancel,
}) => {
  // Store input values as strings to preserve decimal places while typing
  // Use toString() or keep as-is if already string to preserve all decimals
  const [formData, setFormData] = useState({
    item_name: calculation.item_name || "",
    qty:
      typeof calculation.qty === "string"
        ? calculation.qty
        : calculation.qty.toString(),
    rmb_price:
      typeof calculation.rmb_price === "string"
        ? calculation.rmb_price
        : calculation.rmb_price.toString(),
    cmb_rate:
      typeof calculation.cmb_rate === "string"
        ? calculation.cmb_rate
        : calculation.cmb_rate.toString(),
    cmb_amount:
      typeof calculation.cmb_amount === "string"
        ? calculation.cmb_amount
        : calculation.cmb_amount.toString(),
    extra_tax:
      typeof calculation.extra_tax === "string"
        ? calculation.extra_tax
        : calculation.extra_tax.toString(),
    exchange_rate:
      typeof calculation.exchange_rate === "string"
        ? calculation.exchange_rate
        : calculation.exchange_rate.toString(),
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calculatedValues, setCalculatedValues] = useState({
    rmb_amount: 0,
    lkr_amount: 0,
    cmb_value: 0,
    final_value: 0,
    unit_price: 0,
  });

  // Debug: Log the exact values from database
  useEffect(() => {
    console.log("📊 Exact values from database:", {
      qty: calculation.qty,
      rmb_price: calculation.rmb_price,
      cmb_rate: calculation.cmb_rate,
      cmb_amount: calculation.cmb_amount,
      extra_tax: calculation.extra_tax,
      exchange_rate: calculation.exchange_rate,
    });
  }, [calculation]);

  // Handle input changes - keep as strings
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
  };

  // Calculate values whenever form data changes
  useEffect(() => {
    const qty = parseFloat(formData.qty) || 0;
    const rmb_price = parseFloat(formData.rmb_price) || 0;
    const cmb_rate = parseFloat(formData.cmb_rate) || 0;
    const cmb_amount = parseFloat(formData.cmb_amount) || 0;
    const extra_tax = parseFloat(formData.extra_tax) || 0;
    const exchange_rate = parseFloat(formData.exchange_rate) || 0;

    // Step 1: Qty × RMB Price = RMB Amount
    const rmb_amount = qty * rmb_price;

    // Step 2: RMB Amount × Exchange Rate = LKR Amount
    const lkr_amount = rmb_amount * exchange_rate;

    // Step 3: CBM Rate × CBM Amount = CMB Value
    const cmb_value = cmb_rate * cmb_amount;

    // Step 4: Final Value = LKR Amount + CMB Value + Extra Tax
    const final_value = lkr_amount + cmb_value + extra_tax;

    // Step 5: Unit Price = Final Value ÷ Quantity
    const unit_price = qty > 0 ? final_value / qty : 0;

    setCalculatedValues({
      rmb_amount,
      lkr_amount,
      cmb_value,
      final_value,
      unit_price,
    });
  }, [formData]);

  const validateFormData = () => {
    if (!formData.item_name || formData.item_name.trim() === "") {
      throw new Error("Item name is required");
    }

    const qty = parseFloat(formData.qty);
    if (isNaN(qty) || qty <= 0) {
      throw new Error("Quantity must be greater than 0");
    }

    const rmb_price = parseFloat(formData.rmb_price);
    if (isNaN(rmb_price) || rmb_price < 0) {
      throw new Error("RMB price cannot be negative");
    }

    const cmb_rate = parseFloat(formData.cmb_rate);
    if (isNaN(cmb_rate) || cmb_rate < 0) {
      throw new Error("CBM rate cannot be negative");
    }

    const cmb_amount = parseFloat(formData.cmb_amount);
    if (isNaN(cmb_amount) || cmb_amount < 0) {
      throw new Error("CBM amount cannot be negative");
    }

    const extra_tax = parseFloat(formData.extra_tax);
    if (isNaN(extra_tax) || extra_tax < 0) {
      throw new Error("Extra tax cannot be negative");
    }

    const exchange_rate = parseFloat(formData.exchange_rate);
    if (isNaN(exchange_rate) || exchange_rate <= 0) {
      throw new Error("Exchange rate must be greater than 0");
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Client-side validation
      validateFormData();

      // Convert strings to numbers for API
      const updateData = {
        id: calculation.id,
        shop_id: calculation.shop_id,
        item_name: formData.item_name.trim(),
        qty: parseFloat(formData.qty),
        rmb_price: parseFloat(formData.rmb_price),
        cmb_rate: parseFloat(formData.cmb_rate),
        cmb_amount: parseFloat(formData.cmb_amount),
        extra_tax: parseFloat(formData.extra_tax),
        exchange_rate: parseFloat(formData.exchange_rate),
      };

      console.log("Sending update request:", updateData);

      // Make API call to update the calculation
      const response = await fetch("/api/calculations", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update calculation");
      }

      console.log("Update successful:", data);

      // Call the onSave callback with the updated data
      onSave(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update calculation";
      setError(errorMessage);
      console.error("Error updating calculation:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Debug: Show exact database values */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <p className="text-xs font-medium text-blue-800 mb-2">
          🔍 Exact Database Values (for debugging):
        </p>
        <div className="grid grid-cols-3 gap-2 text-xs text-blue-700">
          <div>
            Qty:{" "}
            <code className="bg-blue-100 px-1 rounded">{calculation.qty}</code>
          </div>
          <div>
            RMB Price:{" "}
            <code className="bg-blue-100 px-1 rounded">
              {calculation.rmb_price}
            </code>
          </div>
          <div>
            Exchange:{" "}
            <code className="bg-blue-100 px-1 rounded">
              {calculation.exchange_rate}
            </code>
          </div>
          <div>
            CMB Amount:{" "}
            <code className="bg-blue-100 px-1 rounded">
              {calculation.cmb_amount}
            </code>
          </div>
          <div>
            CMB Rate:{" "}
            <code className="bg-blue-100 px-1 rounded">
              {calculation.cmb_rate}
            </code>
          </div>
          <div>
            Extra Tax:{" "}
            <code className="bg-blue-100 px-1 rounded">
              {calculation.extra_tax}
            </code>
          </div>
        </div>
      </div>

      {/* Input Fields */}
      <div className="grid grid-cols-1 gap-4">
        {/* Item Name Field */}
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Item Name *
          </label>
          <input
            type="text"
            value={formData.item_name}
            onChange={(e) => handleInputChange("item_name", e.target.value)}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="Enter item name"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity *
            </label>
            <input
              type="number"
              inputMode="decimal"
              value={formData.qty}
              onChange={(e) => handleInputChange("qty", e.target.value)}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              min="0"
              step="any"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              RMB Price (per unit) *
            </label>
            <input
              type="number"
              inputMode="decimal"
              value={formData.rmb_price}
              onChange={(e) => handleInputChange("rmb_price", e.target.value)}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              min="0"
              step="any"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Exchange Rate *
            </label>
            <input
              type="number"
              inputMode="decimal"
              value={formData.exchange_rate}
              onChange={(e) =>
                handleInputChange("exchange_rate", e.target.value)
              }
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              min="0"
              step="any"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CBM Amount
            </label>
            <input
              type="number"
              inputMode="decimal"
              value={formData.cmb_amount}
              onChange={(e) => handleInputChange("cmb_amount", e.target.value)}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              min="0"
              step="any"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CBM Rate
            </label>
            <input
              type="number"
              inputMode="decimal"
              value={formData.cmb_rate}
              onChange={(e) => handleInputChange("cmb_rate", e.target.value)}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              min="0"
              step="any"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Extra Tax (LKR)
            </label>
            <input
              type="number"
              inputMode="decimal"
              value={formData.extra_tax}
              onChange={(e) => handleInputChange("extra_tax", e.target.value)}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              min="0"
              step="any"
            />
          </div>
        </div>
      </div>

      {/* Calculated Values Display */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          Calculated Values
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <div>
            <span className="text-gray-600">RMB Amount:</span>
            <div className="font-medium">
              ¥{calculatedValues.rmb_amount.toFixed(2)}
            </div>
          </div>
          <div>
            <span className="text-gray-600">LKR Amount:</span>
            <div className="font-medium">
              Rs.{calculatedValues.lkr_amount.toFixed(2)}
            </div>
          </div>
          <div>
            <span className="text-gray-600">CMB Value:</span>
            <div className="font-medium">
              Rs.{calculatedValues.cmb_value.toFixed(2)}
            </div>
          </div>
          <div>
            <span className="text-gray-600">Final Value:</span>
            <div className="font-medium text-green-600">
              Rs.{calculatedValues.final_value.toFixed(2)}
            </div>
          </div>
          <div>
            <span className="text-gray-600">Unit Price:</span>
            <div className="font-medium text-blue-600">
              Rs.{calculatedValues.unit_price.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4">
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
};

export default EditPricing;
