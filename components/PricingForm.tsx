"use client";

import { useState, useEffect } from "react"; // ⬅️ added useEffect
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CalculationFormData } from "@/types";
import { formatCurrency } from "@/app/lib/utils";
import { calculationSchema } from "@/app/lib/validations";

interface PricingFormProps {
  onCalculationSaved: () => void;
}

export function PricingForm({ onCalculationSaved }: PricingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewValues, setPreviewValues] = useState({
    rmb_amount: 0,
    final_value: 0,
  });

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<CalculationFormData>({
    resolver: zodResolver(calculationSchema),
    defaultValues: {
      shop_name: "",
      qty: 1,
      rmb_price: 0,
      cmb_rs: 0,
      extra_tax: 0,
    },
  });

  // Watch form values for live preview
  const watchedValues = watch();

  // Update preview whenever form values change
  const qty = watch("qty");
  const rmb_price = watch("rmb_price");
  const cmb_rs = watch("cmb_rs");
  const extra_tax = watch("extra_tax");

  useEffect(() => {
    const rmb_amount = (Number(qty) || 0) * (Number(rmb_price) || 0);
    const final_value =
      rmb_amount + (Number(cmb_rs) || 0) + (Number(extra_tax) || 0);

    setPreviewValues({ rmb_amount, final_value });
  }, [qty, rmb_price, cmb_rs, extra_tax]);

  const onSubmit = async (data: CalculationFormData) => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/calculations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to save calculation");
      }

      reset();
      onCalculationSaved();
    } catch (error) {
      console.error("Error saving calculation:", error);
      alert("Error saving calculation. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>China Pricing Calculator</CardTitle>
        <CardDescription>
          Calculate total pricing including taxes and additional costs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="shop_name">Shop Name</Label>
              <Input
                id="shop_name"
                {...register("shop_name")}
                placeholder="Enter shop name"
              />
              {errors.shop_name && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.shop_name.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="qty">Quantity</Label>
                <Input
                  id="qty"
                  type="number"
                  min="1"
                  {...register("qty", { valueAsNumber: true })}
                  placeholder="Enter quantity"
                />
                {errors.qty && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.qty.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="rmb_price">RMB Price</Label>
                <Input
                  id="rmb_price"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("rmb_price", { valueAsNumber: true })}
                  placeholder="Enter RMB price"
                />
                {errors.rmb_price && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.rmb_price.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cmb_rs">CMB Rs</Label>
                <Input
                  id="cmb_rs"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("cmb_rs", { valueAsNumber: true })}
                  placeholder="Enter CMB Rs"
                />
                {errors.cmb_rs && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.cmb_rs.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="extra_tax">Extra Tax</Label>
                <Input
                  id="extra_tax"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("extra_tax", { valueAsNumber: true })}
                  placeholder="Enter extra tax"
                />
                {errors.extra_tax && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.extra_tax.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Calculation Preview</h3>

            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>RMB Amount (Qty × Price):</span>
                <span className="font-medium">
                  ¥{formatCurrency(previewValues.rmb_amount)}
                </span>
              </div>

              <div className="flex justify-between">
                <span>CMB Rs:</span>
                <span className="font-medium">
                  Rs {formatCurrency(Number(watchedValues.cmb_rs) || 0)}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Extra Tax:</span>
                <span className="font-medium">
                  ¥{formatCurrency(Number(watchedValues.extra_tax) || 0)}
                </span>
              </div>

              <Separator />

              <div className="flex justify-between text-lg font-bold">
                <span>Final Value:</span>
                <span className="text-green-600">
                  ¥{formatCurrency(previewValues.final_value)}
                </span>
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Calculation"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
