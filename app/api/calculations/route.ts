import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { calculationSchema } from "@/app/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = calculationSchema.parse(body);

    // Get exchange rate from body or fetch current rate
    const exchangeRate = body.exchange_rate || 42.1; // Default fallback

    // Calculate values following the new flow:
    // Step 1: Qty × RMB Price = RMB Amount
    const rmb_amount = validatedData.qty * validatedData.rmb_price;

    // Step 2: RMB Amount × Exchange Rate = LKR Amount
    const lkr_amount = rmb_amount * exchangeRate;

    // Step 3: LKR Amount × CBM Rate = CBM Amount in LKR
    const cbm_amount = lkr_amount * validatedData.cmb_rs;

    // Step 4: CBM Amount (already in LKR) + Extra Tax = Additional costs
    const cbm_lkr = cbm_amount; // CBM amount is already in LKR

    // Step 5: Final Value = LKR Amount + CBM LKR + Extra Tax
    const final_value = lkr_amount + cbm_lkr + validatedData.extra_tax;

    const calculationData = {
      ...validatedData,
      rmb_amount,
      lkr_amount,
      cbm_amount,
      cbm_lkr,
      final_value,
      exchange_rate: exchangeRate,
      created_at: new Date().toISOString(),
    };

    // Save to Supabase
    const { data, error } = await supabase
      .from("calculations")
      .insert([calculationData])
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to save calculation" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("calculations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch calculations" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch calculations" },
      { status: 500 }
    );
  }
}

// Optional: Add endpoint to fetch current exchange rate
export async function PATCH() {
  try {
    const response = await fetch(
      "https://api.exchangerate.host/latest?base=CNY&symbols=LKR"
    );
    const data = await response.json();

    if (data.success && data.rates.LKR) {
      return NextResponse.json({
        rate: data.rates.LKR,
        timestamp: new Date().toISOString(),
      });
    } else {
      throw new Error("Failed to fetch exchange rate");
    }
  } catch (error) {
    console.error("Exchange rate fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch exchange rate", rate: 42.1 }, // Fallback rate
      { status: 500 }
    );
  }
}
