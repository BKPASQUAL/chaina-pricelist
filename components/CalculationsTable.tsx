"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Store, Package, DollarSign, Tag } from "lucide-react";
import { Calculation } from "@/types";
import { formatCurrency } from "@/app/lib/utils";

interface CalculationsTableProps {
  refreshTrigger: number;
}

interface CalculationWithExchangeRate extends Calculation {
  exchange_rate?: number;
  item_name?: string;
  unit_price?: number;
  cmb_rate?: number;
  cmb_amount?: number;
  cmb_value?: number;
}

export function CalculationsTable({ refreshTrigger }: CalculationsTableProps) {
  const [calculations, setCalculations] = useState<
    CalculationWithExchangeRate[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCalculations();
  }, [refreshTrigger]);

  const fetchCalculations = async () => {
    try {
      const response = await fetch("/api/calculations");
      if (response.ok) {
        const data = await response.json();
        setCalculations(data);
      }
    } catch (error) {
      console.error("Error fetching calculations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">Loading calculations...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="px-2 sm:px-6 pb-6">
        {calculations.length === 0 ? (
          <div className="text-center py-2 text-gray-500">
            <Package className="mx-auto h-16 w-16 mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">No calculations found</p>
            <p className="text-sm">
              Create your first calculation above to get started.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card Layout - Hidden on larger screens */}
            <div className="block lg:hidden space-y-2">
              {calculations.map((calc) => (
                <Card
                  key={calc.id}
                  className="border border-gray-200 shadow-sm"
                >
                  <CardContent className="px-2 space-y-2">
                    {/* Header with item name and shop */}
                    <div className="space-y-2">
                      {calc.item_name && (
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-purple-500 flex-shrink-0" />
                          <h3 className="font-semibold text-base text-gray-900 truncate">
                            {calc.item_name}
                          </h3>
                        </div>
                      )}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          <Store className="h-4 w-4 text-blue-500 flex-shrink-0" />
                          <span className="font-medium text-sm text-gray-700 truncate">
                            {calc.shop_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 ml-2">
                          <Calendar className="h-3 w-3" />
                          {calc.created_at
                            ? new Date(calc.created_at).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                }
                              )
                            : "-"}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Key metrics in grid */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="space-y-1">
                        <span className="text-gray-500 text-xs">Quantity</span>
                        <p className="font-medium">{calc.qty}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-gray-500 text-xs">RMB Price</span>
                        <p className="font-medium">
                          ¥{formatCurrency(calc.rmb_price)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-gray-500 text-xs">
                          RMB Amount
                        </span>
                        <p className="font-medium">
                          ¥{formatCurrency(calc.rmb_amount)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-gray-500 text-xs">CBM Value</span>
                        <p className="font-medium">
                          Rs {formatCurrency(calc.cmb_value || 0)}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    {/* Final value and unit price - prominently displayed */}
                    <div className="space-y-2">
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">
                              Final Value
                            </span>
                          </div>
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-green-800 font-bold"
                          >
                            Rs {formatCurrency(calc.final_value)}
                          </Badge>
                        </div>
                      </div>

                      {/* Unit Price */}
                      {calc.unit_price && (
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-blue-800">
                              Unit Price
                            </span>
                            <Badge
                              variant="secondary"
                              className="bg-blue-100 text-blue-800 font-bold text-xs"
                            >
                              Rs {formatCurrency(calc.unit_price)} / unit
                            </Badge>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Extra details (collapsible on very small screens) */}
                    <details className="group">
                      <summary className="cursor-pointer text-xs text-blue-600 font-medium list-none">
                        <span className="group-open:hidden">Show details</span>
                        <span className="hidden group-open:inline">
                          Hide details
                        </span>
                      </summary>
                      <div className="mt-2 pt-2 border-t space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-500">CBM Rate:</span>
                          <span>{formatCurrency(calc.cmb_rate || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">CBM Amount:</span>
                          <span>{formatCurrency(calc.cmb_amount || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Extra Tax:</span>
                          <span>Rs {formatCurrency(calc.extra_tax)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Exchange Rate:</span>
                          <span>
                            {calc.exchange_rate?.toFixed(4) || "N/A"} LKR
                          </span>
                        </div>
                      </div>
                    </details>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Desktop Table Layout - Hidden on mobile */}
            <div className="hidden lg:block">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">Item Name</TableHead>
                      <TableHead className="font-semibold">Shop Name</TableHead>
                      <TableHead className="text-right font-semibold">
                        Qty
                      </TableHead>
                      <TableHead className="text-right font-semibold">
                        RMB Price
                      </TableHead>
                      <TableHead className="text-right font-semibold">
                        RMB Amount
                      </TableHead>
                      <TableHead className="text-right font-semibold">
                        CBM Value
                      </TableHead>
                      <TableHead className="text-right font-semibold">
                        Extra Tax
                      </TableHead>
                      <TableHead className="text-right font-semibold">
                        Final Value
                      </TableHead>
                      <TableHead className="text-right font-semibold">
                        Unit Price
                      </TableHead>
                      <TableHead className="text-right font-semibold">
                        Date
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {calculations.map((calc) => (
                      <TableRow
                        key={calc.id}
                        className="hover:bg-gray-50 transition-colors even:bg-gray-25"
                      >
                        <TableCell className="font-medium text-gray-900 max-w-[150px]">
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-purple-500" />
                            <span
                              className="truncate"
                              title={calc.item_name || "N/A"}
                            >
                              {calc.item_name || "-"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-gray-900 max-w-[150px]">
                          <div className="flex items-center gap-2">
                            <Store className="h-4 w-4 text-blue-500" />
                            <span className="truncate" title={calc.shop_name}>
                              {calc.shop_name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {calc.qty}
                        </TableCell>
                        <TableCell className="text-right">
                          ¥{formatCurrency(calc.rmb_price)}
                        </TableCell>
                        <TableCell className="text-right">
                          ¥{formatCurrency(calc.rmb_amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          Rs {formatCurrency(calc.cmb_value || 0)}
                        </TableCell>
                        <TableCell className="text-right">
                          Rs {formatCurrency(calc.extra_tax)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-green-800 font-bold"
                          >
                            Rs {formatCurrency(calc.final_value)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {calc.unit_price ? (
                            <Badge
                              variant="secondary"
                              className="bg-blue-100 text-blue-800 font-bold text-xs"
                            >
                              Rs {formatCurrency(calc.unit_price)}
                            </Badge>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-sm text-gray-500">
                          {calc.created_at ? (
                            <div className="flex items-center justify-end gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(calc.created_at).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                }
                              )}
                            </div>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Tablet Layout - Visible only on medium screens */}
            <div className="hidden md:block lg:hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">
                        Item & Shop
                      </TableHead>
                      <TableHead className="text-right font-semibold">
                        Details
                      </TableHead>
                      <TableHead className="text-right font-semibold">
                        Final Value
                      </TableHead>
                      <TableHead className="text-right font-semibold">
                        Unit Price
                      </TableHead>
                      <TableHead className="text-right font-semibold">
                        Date
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {calculations.map((calc) => (
                      <TableRow
                        key={calc.id}
                        className="hover:bg-gray-50 transition-colors even:bg-gray-25"
                      >
                        <TableCell className="font-medium max-w-[140px]">
                          <div className="space-y-1">
                            {calc.item_name && (
                              <div className="flex items-center gap-2">
                                <Tag className="h-3 w-3 text-purple-500" />
                                <span
                                  className="text-sm font-medium truncate"
                                  title={calc.item_name}
                                >
                                  {calc.item_name}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Store className="h-3 w-3 text-blue-500" />
                              <span
                                className="text-xs text-gray-600 truncate"
                                title={calc.shop_name}
                              >
                                {calc.shop_name}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="text-xs space-y-1">
                            <div>
                              Qty: {calc.qty} × ¥
                              {formatCurrency(calc.rmb_price)}
                            </div>
                            <div className="text-gray-500">
                              CBM: Rs {formatCurrency(calc.cmb_value || 0)} |
                              Tax: Rs {formatCurrency(calc.extra_tax)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-green-800 font-bold"
                          >
                            Rs {formatCurrency(calc.final_value)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {calc.unit_price ? (
                            <Badge
                              variant="secondary"
                              className="bg-blue-100 text-blue-800 font-bold text-xs"
                            >
                              Rs {formatCurrency(calc.unit_price)}
                            </Badge>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-xs text-gray-500">
                          {calc.created_at
                            ? new Date(calc.created_at).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                }
                              )
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
