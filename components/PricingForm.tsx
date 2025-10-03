"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Edit3,
  Check,
  X,
  Plus,
  Store,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// Shop interface - simplified to only require shop_name
interface Shop {
  id: string;
  shop_name: string;
  created_at: string;
}

// Database record type with computed values
interface CalculationRecord {
  id?: string;
  item_name: string;
  shop_id: string;
  qty: number;
  rmb_price: number;
  cmb_rate: number;
  cmb_amount: number;
  extra_tax: number;
  rmb_amount: number;
  lkr_amount: number;
  cmb_value: number;
  final_value: number;
  unit_price: number;
  exchange_rate: number;
  created_at: string;
}

interface PricingFormProps {
  onCalculationSaved: () => void;
}

// Utility function to format currency
const formatCurrency = (value: number) => {
  return value.toFixed(2);
};

export function PricingForm({ onCalculationSaved }: PricingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(43.20);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  const [isAddShopDialogOpen, setIsAddShopDialogOpen] = useState(false);
  const [isSubmittingShop, setIsSubmittingShop] = useState(false);
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);

  // Exchange rate editing states
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [tempExchangeRate, setTempExchangeRate] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    item_name: "",
    shop_id: "",
    qty: "",
    rmb_price: "",
    cmb_rate: "",
    cmb_amount: "",
    extra_tax: "",
  });

  // Shop form state - simplified to only shop_name
  const [shopFormData, setShopFormData] = useState({
    shop_name: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shopErrors, setShopErrors] = useState<Record<string, string>>({});

  const [previewValues, setPreviewValues] = useState({
    rmb_amount: 0,
    lkr_amount: 0,
    cmb_value: 0,
    final_value: 0,
    unit_price: 0,
  });

  // Load shops on component mount and restore last selected shop
  useEffect(() => {
    loadShops();
    // Load last selected shop from localStorage
    const savedShopId = localStorage.getItem("lastSelectedShopId");
    if (savedShopId) {
      setFormData((prev) => ({ ...prev, shop_id: savedShopId }));
    }
  }, []);

  const loadShops = async () => {
    try {
      const response = await fetch("/api/shops");
      if (response.ok) {
        const shopsData = await response.json();
        setShops(shopsData);
      }
    } catch (error) {
      console.error("Error loading shops:", error);
    }
  };

  // Validation functions
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.item_name.trim()) {
      newErrors.item_name = "Item name is required";
    }
    if (!formData.shop_id) {
      newErrors.shop_id = "Shop selection is required";
    }
    if (
      !formData.qty ||
      isNaN(Number(formData.qty)) ||
      Number(formData.qty) <= 0
    ) {
      newErrors.qty = "Quantity must be a positive number";
    }
    if (
      !formData.rmb_price ||
      isNaN(Number(formData.rmb_price)) ||
      Number(formData.rmb_price) < 0
    ) {
      newErrors.rmb_price = "RMB price must be a positive number";
    }
    if (
      !formData.cmb_rate ||
      isNaN(Number(formData.cmb_rate)) ||
      Number(formData.cmb_rate) < 0
    ) {
      newErrors.cmb_rate = "CBM rate must be a positive number";
    }
    if (
      !formData.cmb_amount ||
      isNaN(Number(formData.cmb_amount)) ||
      Number(formData.cmb_amount) < 0
    ) {
      newErrors.cmb_amount = "CBM amount must be a positive number";
    }
    if (
      formData.extra_tax &&
      (isNaN(Number(formData.extra_tax)) || Number(formData.extra_tax) < 0)
    ) {
      newErrors.extra_tax = "Extra tax must be a positive number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateShopForm = () => {
    const newErrors: Record<string, string> = {};

    if (!shopFormData.shop_name.trim()) {
      newErrors.shop_name = "Shop name is required";
    }

    setShopErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form changes
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Handle shop selection change and save to localStorage
  const handleShopChange = (value: string) => {
    setFormData((prev) => ({ ...prev, shop_id: value }));
    localStorage.setItem("lastSelectedShopId", value);
    if (errors.shop_id) {
      setErrors((prev) => ({ ...prev, shop_id: "" }));
    }
  };

  const handleShopInputChange = (field: string, value: string) => {
    setShopFormData((prev) => ({ ...prev, [field]: value }));
    if (shopErrors[field]) {
      setShopErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Handle adding new shop
  const onSubmitShop = async () => {
    if (!validateShopForm()) return;

    setIsSubmittingShop(true);
    try {
      const response = await fetch("/api/shops", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(shopFormData),
      });

      if (!response.ok) {
        throw new Error("Failed to add shop");
      }

      const newShop = await response.json();
      setShops([...shops, newShop]);
      setFormData((prev) => ({ ...prev, shop_id: newShop.id }));
      localStorage.setItem("lastSelectedShopId", newShop.id);
      setShopFormData({
        shop_name: "",
      });
      setIsAddShopDialogOpen(false);
    } catch (error) {
      console.error("Error adding shop:", error);
      alert("Error adding shop. Please try again.");
    } finally {
      setIsSubmittingShop(false);
    }
  };

  // Handle manual exchange rate editing
  const handleEditRate = () => {
    setTempExchangeRate(exchangeRate.toString());
    setIsEditingRate(true);
  };

  const handleSaveRate = () => {
    const newRate = parseFloat(tempExchangeRate);
    if (!isNaN(newRate) && newRate > 0) {
      setExchangeRate(newRate);
      setLastUpdated(new Date());
      setIsEditingRate(false);
    } else {
      alert("Please enter a valid exchange rate");
    }
  };

  const handleCancelEdit = () => {
    setIsEditingRate(false);
    setTempExchangeRate("");
  };

  // Update preview whenever form values change
  useEffect(() => {
    const qtyNum = parseFloat(formData.qty) || 0;
    const rmbPriceNum = parseFloat(formData.rmb_price) || 0;
    const cmbRateNum = parseFloat(formData.cmb_rate) || 0;
    const cmbAmountNum = parseFloat(formData.cmb_amount) || 0;
    const extraTaxNum = parseFloat(formData.extra_tax) || 0;

    const rmb_amount = qtyNum * rmbPriceNum;
    const lkr_amount = rmb_amount * exchangeRate;
    const cmb_value = cmbRateNum * cmbAmountNum;
    const final_value = lkr_amount + cmb_value + extraTaxNum;
    const unit_price = qtyNum > 0 ? final_value / qtyNum : 0;

    setPreviewValues({
      rmb_amount,
      lkr_amount,
      cmb_value,
      final_value,
      unit_price,
    });
  }, [
    formData.qty,
    formData.rmb_price,
    formData.cmb_rate,
    formData.cmb_amount,
    formData.extra_tax,
    exchangeRate,
  ]);

  const onSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const numericData = {
        item_name: formData.item_name,
        shop_id: formData.shop_id,
        qty: parseFloat(formData.qty) || 0,
        rmb_price: parseFloat(formData.rmb_price) || 0,
        cmb_rate: parseFloat(formData.cmb_rate) || 0,
        cmb_amount: parseFloat(formData.cmb_amount) || 0,
        extra_tax: parseFloat(formData.extra_tax) || 0,
      };

      const rmb_amount = numericData.qty * numericData.rmb_price;
      const lkr_amount = rmb_amount * exchangeRate;
      const cmb_value = numericData.cmb_rate * numericData.cmb_amount;
      const final_value = lkr_amount + cmb_value + numericData.extra_tax;
      const unit_price =
        numericData.qty > 0 ? final_value / numericData.qty : 0;

      const calculationData: Omit<CalculationRecord, "id" | "created_at"> = {
        ...numericData,
        rmb_amount,
        lkr_amount,
        cmb_value,
        final_value,
        unit_price,
        exchange_rate: exchangeRate,
      };

      const response = await fetch("/api/calculations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(calculationData),
      });

      if (!response.ok) {
        throw new Error("Failed to save calculation");
      }

      // Keep the shop_id when resetting the form
      const currentShopId = formData.shop_id;
      setFormData({
        item_name: "",
        shop_id: currentShopId,
        qty: "",
        rmb_price: "",
        cmb_rate: "",
        cmb_amount: "",
        extra_tax: "",
      });
      onCalculationSaved();
    } catch (error) {
      console.error("Error saving calculation:", error);
      alert("Error saving calculation. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full px-2 sm:px-1 py-1">
      <Card className="w-full max-w-4xl mx-auto shadow-sm">
        <CardHeader className="px-4 sm:px-6 ">
          <CardTitle className="text-lg sm:text-xl md:text-2xl text-center sm:text-left">
            China to Sri Lanka Pricing Calculator
          </CardTitle>

          {/* Exchange Rate Display - Mobile Optimized */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 bg-blue-50 rounded-lg">
            <div className="flex justify-between w-full items-center">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <Badge
                  variant="secondary"
                  className="self-start sm:self-center"
                >
                  Exchange Rate
                </Badge>
                {isEditingRate ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.0001"
                      value={tempExchangeRate}
                      onChange={(e) => setTempExchangeRate(e.target.value)}
                      className="w-20 sm:w-24 h-8 text-sm"
                      placeholder="Rate"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleSaveRate}
                      className="h-8 w-8 p-0"
                    >
                      <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEdit}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm sm:text-base">
                      1 CNY = {exchangeRate.toFixed(4)} LKR
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleEditRate}
                      className="h-6 w-6 p-0"
                      title="Edit exchange rate"
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                {lastUpdated && (
                  <span className="text-xs sm:text-sm text-gray-500">
                    Updated: {lastUpdated.toLocaleTimeString()}
                  </span>
                )}
              </div>
              <div>
                <Dialog
                  open={isAddShopDialogOpen}
                  onOpenChange={setIsAddShopDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Add Shop
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Store className="h-5 w-5" />
                        Add New Shop
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label
                          htmlFor="shop_name"
                          className="text-sm font-medium"
                        >
                          Shop Name *
                        </Label>
                        <Input
                          id="shop_name"
                          value={shopFormData.shop_name}
                          onChange={(e) =>
                            handleShopInputChange("shop_name", e.target.value)
                          }
                          placeholder="Enter shop name"
                          className="mt-1"
                        />
                        {shopErrors.shop_name && (
                          <p className="text-sm text-red-600 mt-1">
                            {shopErrors.shop_name}
                          </p>
                        )}
                      </div>

                      <div className="flex justify-end gap-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsAddShopDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={onSubmitShop}
                          disabled={isSubmittingShop}
                        >
                          {isSubmittingShop ? "Adding..." : "Add Shop"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-4 sm:px-6 pb-2 sm:pb-2">
          <div className="space-y-4 sm:space-y-6">
            <div className="space-y-4">
              {/* Item Name Field */}
              <div>
                <Label htmlFor="item_name" className="text-sm font-medium">
                  Item Name
                </Label>
                <Input
                  id="item_name"
                  value={formData.item_name}
                  onChange={(e) =>
                    handleInputChange("item_name", e.target.value)
                  }
                  placeholder="Enter item name"
                  className="mt-1"
                />
                {errors.item_name && (
                  <p className="text-xs sm:text-sm text-red-600 mt-1">
                    {errors.item_name}
                  </p>
                )}
              </div>

              {/* Shop Selection Dropdown - Now with persistence */}
              <div className="w-full">
                <Label htmlFor="shop_id" className="text-sm font-medium">
                  Shop Name
                </Label>
                <Select
                  value={formData.shop_id}
                  onValueChange={handleShopChange}
                >
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue placeholder="Select a shop" />
                  </SelectTrigger>
                  <SelectContent className="w-full max-h-60 overflow-y-auto">
                    {shops.map((shop) => (
                      <SelectItem key={shop.id} value={shop.id}>
                        {shop.shop_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.shop_id && (
                  <p className="text-xs sm:text-sm text-red-600 mt-1">
                    {errors.shop_id}
                  </p>
                )}
              </div>

              {/* Form Grid - Responsive */}
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="qty" className="text-sm font-medium">
                    Quantity
                  </Label>
                  <Input
                    id="qty"
                    type="number"
                    step="0.01"
                    value={formData.qty}
                    onChange={(e) => handleInputChange("qty", e.target.value)}
                    placeholder="Enter quantity"
                    className="mt-1"
                  />
                  {errors.qty && (
                    <p className="text-xs sm:text-sm text-red-600 mt-1">
                      {errors.qty}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="rmb_price" className="text-sm font-medium">
                    RMB Price (per unit)
                  </Label>
                  <Input
                    id="rmb_price"
                    type="number"
                    step="0.01"
                    value={formData.rmb_price}
                    onChange={(e) =>
                      handleInputChange("rmb_price", e.target.value)
                    }
                    placeholder="Enter RMB price"
                    className="mt-1"
                  />
                  {errors.rmb_price && (
                    <p className="text-xs sm:text-sm text-red-600 mt-1">
                      {errors.rmb_price}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cmb_amount" className="text-sm font-medium">
                    CBM Amount
                  </Label>
                  <Input
                    id="cmb_amount"
                    type="number"
                    step="0.01"
                    value={formData.cmb_amount}
                    onChange={(e) =>
                      handleInputChange("cmb_amount", e.target.value)
                    }
                    placeholder="Enter CBM amount"
                    className="mt-1"
                  />
                  {errors.cmb_amount && (
                    <p className="text-xs sm:text-sm text-red-600 mt-1">
                      {errors.cmb_amount}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="cmb_rate" className="text-sm font-medium">
                    CBM Rate
                  </Label>
                  <Input
                    id="cmb_rate"
                    type="number"
                    step="0.01"
                    value={formData.cmb_rate}
                    onChange={(e) =>
                      handleInputChange("cmb_rate", e.target.value)
                    }
                    placeholder="Enter CBM rate"
                    className="mt-1"
                  />
                  {errors.cmb_rate && (
                    <p className="text-xs sm:text-sm text-red-600 mt-1">
                      {errors.cmb_rate}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="extra_tax" className="text-sm font-medium">
                  Extra Tax (LKR)
                </Label>
                <Input
                  id="extra_tax"
                  type="number"
                  step="0.01"
                  value={formData.extra_tax}
                  onChange={(e) =>
                    handleInputChange("extra_tax", e.target.value)
                  }
                  placeholder="Enter extra tax in LKR"
                  className="mt-1"
                />
                {errors.extra_tax && (
                  <p className="text-xs sm:text-sm text-red-600 mt-1">
                    {errors.extra_tax}
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Calculation Summary (Always Visible) */}
            <div className="bg-green-100 p-3 sm:p-4 rounded-lg space-y-2">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                <span className="font-bold text-green-800 text-base sm:text-lg">
                  Final Value (LKR):
                </span>
                <span className="font-bold text-green-600 text-lg sm:text-xl">
                  Rs {formatCurrency(previewValues.final_value)}
                </span>
              </div>

              {/* Unit Price Display */}
              <Separator className="my-2" />
              <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                <span className="font-semibold text-green-700 text-sm sm:text-base">
                  Unit Price (Final Value ÷ Qty):
                </span>
                <span className="font-semibold text-green-600 text-base sm:text-lg">
                  Rs {formatCurrency(previewValues.unit_price)} per unit
                </span>
              </div>
            </div>

            {/* Collapsible Calculation Breakdown */}
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsBreakdownOpen(!isBreakdownOpen)}
                className="w-full flex items-center justify-center gap-2"
              >
                {isBreakdownOpen ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Hide Calculation Breakdown
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Show Calculation Breakdown
                  </>
                )}
              </Button>

              {/* Breakdown Content - Only show when isBreakdownOpen is true */}
              {isBreakdownOpen && (
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg space-y-3">
                  {/* Step 1 */}
                  <div className="space-y-2">
                    <div className="flex justify-between sm:items-center gap-2">
                      <span className="font-medium text-blue-700 text-xs sm:text-base">
                        Step 1: RMB Amount
                      </span>
                      <Badge
                        variant="outline"
                        className="self-start sm:self-center text-xs"
                      >
                        Qty × RMB Price
                      </Badge>
                    </div>
                    <div className="flex justify-between gap-1">
                      <span className="text-xs sm:text-base text-gray-600">
                        ({parseFloat(formData.qty) || 0} × ¥
                        {(parseFloat(formData.rmb_price) || 0).toFixed(2)})
                      </span>
                      <span className="font-medium text-xs sm:text-base">
                        ¥{formatCurrency(previewValues.rmb_amount)}
                      </span>
                    </div>
                  </div>

                  <Separator className="my-2" />

                  {/* Step 2 */}
                  <div className="space-y-2">
                    <div className="flex justify-between sm:items-center gap-2">
                      <span className="font-medium text-green-700 text-xs sm:text-base">
                        Step 2: Convert to LKR
                      </span>
                      <Badge
                        variant="outline"
                        className="self-start sm:self-center text-xs"
                      >
                        RMB × Exchange Rate
                      </Badge>
                    </div>
                    <div className="flex justify-between gap-1">
                      <span className="text-xs sm:text-base text-gray-600 break-words">
                        (¥{formatCurrency(previewValues.rmb_amount)} ×{" "}
                        {exchangeRate.toFixed(4)})
                      </span>
                      <span className="font-medium text-xs sm:text-base">
                        Rs {formatCurrency(previewValues.lkr_amount)}
                      </span>
                    </div>
                  </div>

                  <Separator className="my-2" />

                  {/* Step 3 - Updated CMB Calculation */}
                  <div className="space-y-2">
                    <div className="flex justify-between sm:items-center gap-2">
                      <span className="font-medium text-purple-700 text-xs sm:text-base">
                        Step 3: CMB Value
                      </span>
                      <Badge
                        variant="outline"
                        className="self-start sm:self-center text-xs"
                      >
                        CBM Rate × CBM Amount
                      </Badge>
                    </div>
                    <div className="flex justify-between gap-1">
                      <span className="text-xs sm:text-base text-gray-600 break-words">
                        ({parseFloat(formData.cmb_rate) || 0} ×{" "}
                        {parseFloat(formData.cmb_amount) || 0})
                      </span>
                      <span className="font-medium text-xs sm:text-base">
                        Rs {formatCurrency(previewValues.cmb_value)}
                      </span>
                    </div>
                  </div>

                  <Separator className="my-2" />

                  {/* Step 4 */}
                  <div className="space-y-2">
                    <div className="flex justify-between sm:items-center gap-2">
                      <span className="font-medium text-orange-700 text-xs sm:text-base">
                        Step 4: Extra Tax
                      </span>
                      <Badge
                        variant="outline"
                        className="self-start sm:self-center text-xs"
                      >
                        Additional LKR
                      </Badge>
                    </div>
                    <div className="flex justify-between gap-1">
                      <span className="text-xs sm:text-base text-gray-600">
                        Extra Tax
                      </span>
                      <span className="font-medium text-xs sm:text-base">
                        Rs {formatCurrency(parseFloat(formData.extra_tax) || 0)}
                      </span>
                    </div>
                  </div>

                  <Separator className="my-3 border-2" />
                </div>
              )}
            </div>

            <Button
              onClick={onSubmit}
              className="w-full py-3 text-base font-medium"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Calculation"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
