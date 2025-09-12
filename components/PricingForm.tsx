"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Edit3, Check, X } from "lucide-react";
import { formatCurrency } from "@/app/lib/utils";

// Define form schema for string inputs (what HTML forms return)
import { z } from "zod";

const calculationFormSchema = z.object({
  item_name: z.string().min(1, "Item name is required"),
  shop_name: z.string().min(1, "Shop name is required"),
  qty: z
    .string()
    .min(1, "Quantity is required")
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) > 0,
      "Quantity must be a positive number"
    ),
  rmb_price: z
    .string()
    .min(1, "RMB price is required")
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) >= 0,
      "RMB price must be a positive number"
    ),
  cmb_rate: z
    .string()
    .min(1, "CBM rate is required")
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) >= 0,
      "CBM rate must be a positive number"
    ),
  cmb_amount: z
    .string()
    .min(1, "CBM amount is required")
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) >= 0,
      "CBM amount must be a positive number"
    ),
  extra_tax: z
    .string()
    .refine(
      (val) => val === "" || (!isNaN(Number(val)) && Number(val) >= 0),
      "Extra tax must be a positive number"
    ),
});

type CalculationFormData = z.infer<typeof calculationFormSchema>;

// Database record type with computed values
interface CalculationRecord {
  id?: string;
  item_name: string;
  shop_name: string;
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
  shop_distribution?: ShopDistribution[];
}

interface ShopDistribution {
  shop_name: string;
  qty: number;
  shop_final_value: number;
  shop_unit_price: number;
}

interface PricingFormProps {
  onCalculationSaved: () => void;
}

// Define the 5 shops
const SHOPS = ["Gampaha", "Rathgama", "Waligama", "Mathara", "Kandy"];

export function PricingForm({ onCalculationSaved }: PricingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(42.1); // Default rate
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Exchange rate editing states
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [tempExchangeRate, setTempExchangeRate] = useState("");

  // Shop distribution state
  const [shopDistribution, setShopDistribution] = useState<{
    [key: string]: number;
  }>({
    Gampaha: 0,
    Rathgama: 0,
    Waligama: 0,
    Mathara: 0,
    Kandy: 0,
  });

  const [previewValues, setPreviewValues] = useState({
    rmb_amount: 0,
    lkr_amount: 0,
    cmb_value: 0,
    final_value: 0,
    unit_price: 0,
  });

  const [shopValues, setShopValues] = useState<ShopDistribution[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<CalculationFormData>({
    resolver: zodResolver(calculationFormSchema),
    defaultValues: {
      item_name: "",
      shop_name: "",
      qty: "",
      rmb_price: "",
      cmb_rate: "",
      cmb_amount: "",
      extra_tax: "",
    },
  });

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

  // Handle shop quantity distribution
  const handleShopQtyChange = (shopName: string, qty: number) => {
    setShopDistribution((prev) => ({
      ...prev,
      [shopName]: qty || 0,
    }));
  };

  // Auto-distribute quantity equally among shops
  const autoDistributeQty = () => {
    const totalQty = parseFloat(watch("qty")) || 0;
    const qtyPerShop = totalQty / SHOPS.length;
    const distribution: { [key: string]: number } = {};

    SHOPS.forEach((shop) => {
      distribution[shop] = parseFloat(qtyPerShop.toFixed(2));
    });

    setShopDistribution(distribution);
  };

  // Watch form values for live preview
  const qty = watch("qty");
  const rmb_price = watch("rmb_price");
  const cmb_rate = watch("cmb_rate");
  const cmb_amount = watch("cmb_amount");
  const extra_tax = watch("extra_tax");

  // Update preview whenever form values change
  useEffect(() => {
    // Convert string inputs to numbers, default to 0 if empty or invalid
    const qtyNum = parseFloat(qty) || 0;
    const rmbPriceNum = parseFloat(rmb_price) || 0;
    const cmbRateNum = parseFloat(cmb_rate) || 0;
    const cmbAmountNum = parseFloat(cmb_amount) || 0;
    const extraTaxNum = parseFloat(extra_tax) || 0;

    // Step 1: Calculate RMB Amount (Qty × RMB Price)
    const rmb_amount = qtyNum * rmbPriceNum;

    // Step 2: Convert RMB to LKR (RMB Amount × Exchange Rate)
    const lkr_amount = rmb_amount * exchangeRate;

    // Step 3: Calculate CMB Value (CMB Rate × CMB Amount)
    const cmb_value = cmbRateNum * cmbAmountNum;

    // Step 4: Calculate final value in LKR (LKR Amount + CMB Value + Extra Tax)
    const final_value = lkr_amount + cmb_value + extraTaxNum;

    // Step 5: Calculate unit price (Final Value ÷ Quantity)
    const unit_price = qtyNum > 0 ? final_value / qtyNum : 0;

    setPreviewValues({
      rmb_amount,
      lkr_amount,
      cmb_value,
      final_value,
      unit_price,
    });
  }, [qty, rmb_price, cmb_rate, cmb_amount, extra_tax, exchangeRate]);

  // Calculate shop values when distribution changes
  useEffect(() => {
    if (previewValues.unit_price > 0) {
      const shopVals: ShopDistribution[] = SHOPS.map((shopName) => {
        const shopQty = shopDistribution[shopName] || 0;
        const shop_final_value = shopQty * previewValues.unit_price;

        return {
          shop_name: shopName,
          qty: shopQty,
          shop_final_value,
          shop_unit_price: previewValues.unit_price,
        };
      });

      setShopValues(shopVals);
    }
  }, [shopDistribution, previewValues.unit_price]);

  const onSubmit = async (data: CalculationFormData) => {
    setIsSubmitting(true);

    try {
      // Convert string form data to numbers for database storage
      const numericData = {
        item_name: data.item_name,
        shop_name: data.shop_name,
        qty: parseFloat(data.qty) || 0,
        rmb_price: parseFloat(data.rmb_price) || 0,
        cmb_rate: parseFloat(data.cmb_rate) || 0,
        cmb_amount: parseFloat(data.cmb_amount) || 0,
        extra_tax: parseFloat(data.extra_tax) || 0,
      };

      // Calculate all values using new formula
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
        shop_distribution: shopValues.filter((shop) => shop.qty > 0), // Only include shops with quantity
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

      reset();
      // Reset shop distribution
      setShopDistribution({
        Gampaha: 0,
        Rathgama: 0,
        Waligama: 0,
        Mathara: 0,
        Kandy: 0,
      });
      onCalculationSaved();
    } catch (error) {
      console.error("Error saving calculation:", error);
      alert("Error saving calculation. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalDistributedQty = Object.values(shopDistribution).reduce(
    (sum, qty) => sum + qty,
    0
  );
  const originalQty = parseFloat(qty) || 0;

  return (
    <div className="w-full px-2 sm:px-1 py-1">
      <Card className="w-full max-w-4xl mx-auto shadow-sm">
        <CardHeader className="px-4 sm:px-6 ">
          <CardTitle className="text-lg sm:text-xl md:text-2xl text-center sm:text-left">
            China to Sri Lanka Pricing Calculator
          </CardTitle>

          {/* Exchange Rate Display - Mobile Optimized */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 bg-blue-50 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <Badge variant="secondary" className="self-start sm:self-center">
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
          </div>
        </CardHeader>

        <CardContent className="px-4 sm:px-6 pb-2 sm:pb-2">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4 sm:space-y-6"
          >
            <div className="space-y-4">
              {/* Item Name Field */}
              <div>
                <Label htmlFor="item_name" className="text-sm font-medium">
                  Item Name
                </Label>
                <Input
                  id="item_name"
                  {...register("item_name")}
                  placeholder="Enter item name"
                  className="mt-1"
                />
                {errors.item_name && (
                  <p className="text-xs sm:text-sm text-red-600 mt-1">
                    {errors.item_name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="shop_name" className="text-sm font-medium">
                  Shop Name
                </Label>
                <Input
                  id="shop_name"
                  {...register("shop_name")}
                  placeholder="Enter shop name"
                  className="mt-1"
                />
                {errors.shop_name && (
                  <p className="text-xs sm:text-sm text-red-600 mt-1">
                    {errors.shop_name.message}
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
                    {...register("qty")}
                    placeholder="Enter quantity"
                    className="mt-1"
                  />
                  {errors.qty && (
                    <p className="text-xs sm:text-sm text-red-600 mt-1">
                      {errors.qty.message}
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
                    {...register("rmb_price")}
                    placeholder="Enter RMB price"
                    className="mt-1"
                  />
                  {errors.rmb_price && (
                    <p className="text-xs sm:text-sm text-red-600 mt-1">
                      {errors.rmb_price.message}
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
                    {...register("cmb_amount")}
                    placeholder="Enter CBM amount"
                    className="mt-1"
                  />
                  {errors.cmb_amount && (
                    <p className="text-xs sm:text-sm text-red-600 mt-1">
                      {errors.cmb_amount.message}
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
                    {...register("cmb_rate")}
                    placeholder="Enter CBM rate"
                    className="mt-1"
                  />
                  {errors.cmb_rate && (
                    <p className="text-xs sm:text-sm text-red-600 mt-1">
                      {errors.cmb_rate.message}
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
                  {...register("extra_tax")}
                  placeholder="Enter extra tax in LKR"
                  className="mt-1"
                />
                {errors.extra_tax && (
                  <p className="text-xs sm:text-sm text-red-600 mt-1">
                    {errors.extra_tax.message}
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Calculation Breakdown - Mobile Optimized */}
            <div className="space-y-3">
              <h3 className="text-base sm:text-lg font-semibold">
                Calculation Breakdown
              </h3>

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
                      ({parseFloat(qty) || 0} × ¥
                      {(parseFloat(rmb_price) || 0).toFixed(2)})
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
                      ({parseFloat(cmb_rate) || 0} ×{" "}
                      {parseFloat(cmb_amount) || 0})
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
                      Rs {formatCurrency(parseFloat(extra_tax) || 0)}
                    </span>
                  </div>
                </div>

                <Separator className="my-3 border-2" />

                {/* Final Result - Mobile Optimized */}
                <div className="bg-green-100 p-3 sm:p-4 rounded-lg space-y-2">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                    <span className="font-bold text-green-800 text-base sm:text-lg">
                      Final Value (LKR):
                    </span>
                    <span className="font-bold text-green-600 text-lg sm:text-xl">
                      Rs {formatCurrency(previewValues.final_value)}
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm text-green-700">
                    (Rs {formatCurrency(previewValues.lkr_amount)} + Rs{" "}
                    {formatCurrency(previewValues.cmb_value)} + Rs{" "}
                    {formatCurrency(parseFloat(extra_tax) || 0)})
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
              </div>
            </div>

            {/* Shop Distribution Section */}
            {previewValues.final_value > 0 && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <h3 className="text-base sm:text-lg font-semibold">
                      Shop Distribution
                    </h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={autoDistributeQty}
                      className="self-start sm:self-center"
                    >
                      Auto Distribute Equally
                    </Button>
                  </div>

                  {/* Quantity Validation */}
                  {totalDistributedQty !== originalQty && originalQty > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-800 text-sm font-medium">
                          ⚠️ Quantity Mismatch:
                        </span>
                        <span className="text-yellow-700 text-sm">
                          Total distributed ({totalDistributedQty}) ≠ Original
                          quantity ({originalQty})
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Shop Distribution Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {SHOPS.map((shopName) => (
                      <Card
                        key={shopName}
                        className="border border-gray-200 flex flex-row gap-2 p-3 items-center"
                      >
                        <CardTitle className="text-sm font-medium  w-1/3">
                          {shopName}
                        </CardTitle>
                        <div className="flex flex-row items-center w-1/3">
                          <Input
                            id={`shop_${shopName}`}
                            type="number"
                            step="0.01"
                            min="0"
                            value={shopDistribution[shopName] || ""}
                            onChange={(e) =>
                              handleShopQtyChange(
                                shopName,
                                parseFloat(e.target.value)
                              )
                            }
                            placeholder="0"
                            className="mt-1 h-8 text-sm"
                          />
                        </div>

                        {shopDistribution[shopName] > 0 && (
                          <div className="bg-blue-50 p-2 rounded text-center w-1/3">
                            <div className="font-semibold text-blue-600 text-sm">
                              Rs
                              {formatCurrency(
                                shopDistribution[shopName] *
                                  previewValues.unit_price
                              )}
                            </div>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>

                  {/* Shop Distribution Summary */}
                </div>
              </>
            )}

            <Button
              type="submit"
              className="w-full py-3 text-base font-medium"
              disabled={
                isSubmitting ||
                (originalQty > 0 && totalDistributedQty !== originalQty)
              }
            >
              {isSubmitting ? "Saving..." : "Save Calculation"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
