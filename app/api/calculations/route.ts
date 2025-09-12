import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { calculationSchema } from "@/app/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Received body:", body); // Debug log

    // Validate input
    const validatedData = calculationSchema.parse(body);

    // Verify that the shop exists
    const { data: shopData, error: shopError } = await supabase
      .from("shops")
      .select("id")
      .eq("id", validatedData.shop_id)
      .single();

    if (shopError || !shopData) {
      return NextResponse.json(
        { error: "Invalid shop selection" },
        { status: 400 }
      );
    }

    // Get exchange rate from body or use default
    const exchangeRate = body.exchange_rate || 42.1;

    // Calculate values following the calculation flow:
    // Step 1: Qty × RMB Price = RMB Amount
    const rmb_amount = validatedData.qty * validatedData.rmb_price;

    // Step 2: RMB Amount × Exchange Rate = LKR Amount
    const lkr_amount = rmb_amount * exchangeRate;

    // Step 3: CBM Rate × CBM Amount = CMB Value
    const cmb_value = validatedData.cmb_rate * validatedData.cmb_amount;

    // Step 4: Final Value = LKR Amount + CMB Value + Extra Tax
    const final_value = lkr_amount + cmb_value + validatedData.extra_tax;

    // Step 5: Unit Price = Final Value ÷ Quantity
    const unit_price =
      validatedData.qty > 0 ? final_value / validatedData.qty : 0;

    const calculationData = {
      ...validatedData,
      rmb_amount,
      lkr_amount,
      cmb_value,
      final_value,
      unit_price,
      exchange_rate: exchangeRate,
      created_at: new Date().toISOString(),
    };

    console.log("Saving calculation data:", calculationData); // Debug log

    // Save to Supabase
    const { data, error } = await supabase
      .from("calculations")
      .insert([calculationData])
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to save calculation", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("API error:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input data", details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
  }
}

export async function GET() {
  try {
    // Join with shops table to get shop names
    const { data, error } = await supabase
      .from("calculations")
      .select(
        `
        *,
        shops!shop_id (
          shop_name
        )
      `
      )
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
