"use client";

import React, { useState } from "react";

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
  const [formData, setFormData] = useState({
    item_name: calculation.item_name || "", // Add item_name to formData
    qty: calculation.qty,
    rmb_price: calculation.rmb_price,
    cmb_rate: calculation.cmb_rate,
    cmb_amount: calculation.cmb_amount,
    extra_tax: calculation.extra_tax,
    exchange_rate: calculation.exchange_rate,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: string, value: number | string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError(null); // Clear any previous errors
  };

  const calculateValues = () => {
    // Following the same calculation flow as PricingForm and API:

    // Step 1: Qty × RMB Price = RMB Amount
    const rmb_amount = formData.qty * formData.rmb_price;

    // Step 2: RMB Amount × Exchange Rate = LKR Amount
    const lkr_amount = rmb_amount * formData.exchange_rate;

    // Step 3: CBM Rate × CBM Amount = CMB Value
    const cmb_value = formData.cmb_rate * formData.cmb_amount;

    // Step 4: Final Value = LKR Amount + CMB Value + Extra Tax
    const final_value = lkr_amount + cmb_value + formData.extra_tax;

    // Step 5: Unit Price = Final Value ÷ Quantity
    const unit_price = formData.qty > 0 ? final_value / formData.qty : 0;

    return {
      rmb_amount,
      lkr_amount,
      cmb_value,
      final_value,
      unit_price,
    };
  };

  const validateFormData = () => {
    if (!formData.item_name || formData.item_name.trim() === "") {
      throw new Error("Item name is required");
    }
    if (formData.qty <= 0) {
      throw new Error("Quantity must be greater than 0");
    }
    if (formData.rmb_price < 0) {
      throw new Error("RMB price cannot be negative");
    }
    if (formData.cmb_rate < 0) {
      throw new Error("CBM rate cannot be negative");
    }
    if (formData.cmb_amount < 0) {
      throw new Error("CBM amount cannot be negative");
    }
    if (formData.extra_tax < 0) {
      throw new Error("Extra tax cannot be negative");
    }
    if (formData.exchange_rate <= 0) {
      throw new Error("Exchange rate must be greater than 0");
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Client-side validation
      validateFormData();

      // Prepare the update data - ensure all required fields are included
      const updateData = {
        id: calculation.id,
        shop_id: calculation.shop_id,
        item_name: formData.item_name.trim(), // Include item_name from form
        qty: Number(formData.qty),
        rmb_price: Number(formData.rmb_price),
        cmb_rate: Number(formData.cmb_rate),
        cmb_amount: Number(formData.cmb_amount),
        extra_tax: Number(formData.extra_tax),
        exchange_rate: Number(formData.exchange_rate),
      };

      console.log("Sending update request:", updateData); // Debug log

      // Make API call to update the calculation
      const response = await fetch("/api/calculations", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      // Log the raw response for debugging
      console.log("Response status:", response.status);
      console.log(
        "Response headers:",
        Object.fromEntries(response.headers.entries())
      );

      let errorData;
      try {
        errorData = await response.json();
        console.log("Response data:", errorData);
      } catch (parseError) {
        console.error("Failed to parse response JSON:", parseError);
        throw new Error("Server returned invalid response");
      }

      if (!response.ok) {
        console.error("Server error response:", errorData); // Enhanced debug log

        // Provide more specific error messages
        if (errorData.details) {
          throw new Error(`${errorData.error}: ${errorData.details}`);
        } else if (errorData.error) {
          throw new Error(errorData.error);
        } else {
          throw new Error(
            `Server error (${response.status}): Failed to update calculation`
          );
        }
      }

      console.log("Updated calculation:", errorData); // Debug log

      // Call the onSave callback with the updated data from the server
      onSave(errorData);
    } catch (err) {
      console.error("Error updating calculation:", err);
      let errorMessage = "Failed to update calculation";

      if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const calculatedValues = calculateValues();

  return (
    <div className="space-y-6 p-1">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="text-red-700 text-sm font-medium">Error:</div>
          <div className="text-red-700 text-sm">{error}</div>
        </div>
      )}

      {/* Input Fields */}
      <div className="grid  grid-cols-1 gap-4">
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
        <div className="grid  grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity *
            </label>
            <input
              type="number"
              value={formData.qty}
              onChange={(e) =>
                handleInputChange("qty", parseFloat(e.target.value) )
              }
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              min="1"
              step="1"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              RMB Price (per unit) *
            </label>
            <input
              type="number"
              value={formData.rmb_price}
              onChange={(e) =>
                handleInputChange("rmb_price", parseFloat(e.target.value) )
              }
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              min="0"
              step="0.01"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Exchange Rate *
            </label>
            <input
              type="number"
              value={formData.exchange_rate}
              onChange={(e) =>
                handleInputChange(
                  "exchange_rate",
                  parseFloat(e.target.value) 
                )
              }
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              min="0.01"
              step="0.01"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CBM Amount
            </label>
            <input
              type="number"
              value={formData.cmb_amount}
              onChange={(e) =>
                handleInputChange("cmb_amount", parseFloat(e.target.value) )
              }
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CBM Rate
            </label>
            <input
              type="number"
              value={formData.cmb_rate}
              onChange={(e) =>
                handleInputChange("cmb_rate", parseFloat(e.target.value) )
              }
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Extra Tax (LKR)
            </label>
            <input
              type="number"
              value={formData.extra_tax}
              onChange={(e) =>
                handleInputChange("extra_tax", parseFloat(e.target.value) )
              }
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              min="0"
              step="0.01"
            />
          </div>
        </div>
      </div>

      {/* Calculated Values Display */}
      {/* <div className="bg-gray-50 p-4 rounded-lg">
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
      </div> */}

      {/* Calculation Breakdown */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-blue-700 mb-3">
          Calculation Breakdown
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">
              Step 1: RMB Amount (Qty × RMB Price):
            </span>
            <span>¥{calculatedValues.rmb_amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">
              Step 2: Convert to LKR (× {formData.exchange_rate}):
            </span>
            <span>Rs.{calculatedValues.lkr_amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">
              Step 3: CMB Value ({formData.cmb_rate} × {formData.cmb_amount}):
            </span>
            <span>Rs.{calculatedValues.cmb_value.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Step 4: Extra Tax:</span>
            <span>Rs.{formData.extra_tax.toFixed(2)}</span>
          </div>
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between font-medium">
              <span className="text-green-700">Final Value:</span>
              <span className="text-green-600">
                Rs.{calculatedValues.final_value.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between font-medium">
              <span className="text-blue-700">Unit Price (Final ÷ Qty):</span>
              <span className="text-blue-600">
                Rs.{calculatedValues.unit_price.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
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
