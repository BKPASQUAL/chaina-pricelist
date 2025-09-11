"use client";

import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculation } from '@/types';
import { formatCurrency } from '@/app/lib/utils';

interface CalculationsTableProps {
  refreshTrigger: number;
}

export function CalculationsTable({ refreshTrigger }: CalculationsTableProps) {
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCalculations();
  }, [refreshTrigger]);

  const fetchCalculations = async () => {
    try {
      const response = await fetch('/api/calculations');
      if (response.ok) {
        const data = await response.json();
        setCalculations(data);
      }
    } catch (error) {
      console.error('Error fetching calculations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center">Loading calculations...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Saved Calculations</CardTitle>
        <CardDescription>
          History of all pricing calculations
        </CardDescription>
      </CardHeader>
      <CardContent>
        {calculations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No calculations found. Create your first calculation above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shop Name</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">RMB Price</TableHead>
                  <TableHead className="text-right">RMB Amount</TableHead>
                  <TableHead className="text-right">CMB Rs</TableHead>
                  <TableHead className="text-right">Extra Tax</TableHead>
                  <TableHead className="text-right">Final Value</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calculations.map((calc) => (
                  <TableRow key={calc.id}>
                    <TableCell className="font-medium">{calc.shop_name}</TableCell>
                    <TableCell className="text-right">{calc.qty}</TableCell>
                    <TableCell className="text-right">¥{formatCurrency(calc.rmb_price)}</TableCell>
                    <TableCell className="text-right">¥{formatCurrency(calc.rmb_amount)}</TableCell>
                    <TableCell className="text-right">Rs {formatCurrency(calc.cmb_rs)}</TableCell>
                    <TableCell className="text-right">¥{formatCurrency(calc.extra_tax)}</TableCell>
                    <TableCell className="text-right font-bold text-green-600">
                      ¥{formatCurrency(calc.final_value)}
                    </TableCell>
                    <TableCell className="text-right">
                      {calc.created_at ? new Date(calc.created_at).toLocaleDateString() : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}