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
      console.error("Validation error details:", error.message);
      return NextResponse.json(
        {
          error: "Invalid input data",
          details: error.message,
          validation_error: true,
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        error: "Failed to save calculation",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
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

// PUT method for updating calculations
// PUT method for updating calculations
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Received update body:", body); // Debug log

    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Calculation ID is required" },
        { status: 400 }
      );
    }

    // Check if the calculation exists first
    const { data: existingCalculation, error: fetchError } = await supabase
      .from("calculations")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !existingCalculation) {
      console.error("Calculation not found:", fetchError);
      return NextResponse.json(
        { error: "Calculation not found" },
        { status: 404 }
      );
    }

    // Ensure all numeric fields are properly converted
    const processedData = {
      shop_id: updateData.shop_id || existingCalculation.shop_id,
      item_name: updateData.item_name || existingCalculation.item_name || "", // Handle item_name
      qty: Number(updateData.qty),
      rmb_price: Number(updateData.rmb_price),
      cmb_rate: Number(updateData.cmb_rate),
      cmb_amount: Number(updateData.cmb_amount),
      extra_tax: Number(updateData.extra_tax),
      exchange_rate: Number(updateData.exchange_rate),
    };

    console.log("Processed data before validation:", processedData); // Debug log

    // Validate fields manually to provide better error messages
    if (!processedData.item_name || processedData.item_name.trim() === "") {
      return NextResponse.json(
        { error: "Item name is required" },
        { status: 400 }
      );
    }

    if (isNaN(processedData.qty) || processedData.qty <= 0) {
      return NextResponse.json(
        { error: "Quantity must be greater than 0" },
        { status: 400 }
      );
    }

    if (isNaN(processedData.rmb_price) || processedData.rmb_price < 0) {
      return NextResponse.json(
        { error: "Invalid RMB price value" },
        { status: 400 }
      );
    }

    if (isNaN(processedData.cmb_rate) || processedData.cmb_rate < 0) {
      return NextResponse.json(
        { error: "Invalid CBM rate value" },
        { status: 400 }
      );
    }

    if (isNaN(processedData.cmb_amount) || processedData.cmb_amount < 0) {
      return NextResponse.json(
        { error: "Invalid CBM amount value" },
        { status: 400 }
      );
    }

    if (isNaN(processedData.extra_tax) || processedData.extra_tax < 0) {
      return NextResponse.json(
        { error: "Invalid extra tax value" },
        { status: 400 }
      );
    }

    if (
      isNaN(processedData.exchange_rate) ||
      processedData.exchange_rate <= 0
    ) {
      return NextResponse.json(
        { error: "Invalid exchange rate value" },
        { status: 400 }
      );
    }

    // Verify that the shop exists
    const { data: shopData, error: shopError } = await supabase
      .from("shops")
      .select("id")
      .eq("id", processedData.shop_id)
      .single();

    if (shopError || !shopData) {
      console.error("Shop validation error:", shopError);
      return NextResponse.json(
        { error: "Invalid shop selection" },
        { status: 400 }
      );
    }

    // Try to validate with Zod schema, but handle errors gracefully
    try {
      calculationSchema.parse(processedData);
    } catch (zodError) {
      console.error("Zod validation error:", zodError);
      return NextResponse.json(
        {
          error: "Invalid input data",
          details:
            zodError instanceof Error ? zodError.message : "Validation failed",
        },
        { status: 400 }
      );
    }

    // Calculate values following the calculation flow:
    // Step 1: Qty × RMB Price = RMB Amount
    const rmb_amount = processedData.qty * processedData.rmb_price;

    // Step 2: RMB Amount × Exchange Rate = LKR Amount
    const lkr_amount = rmb_amount * processedData.exchange_rate;

    // Step 3: CBM Rate × CBM Amount = CMB Value
    const cmb_value = processedData.cmb_rate * processedData.cmb_amount;

    // Step 4: Final Value = LKR Amount + CMB Value + Extra Tax
    const final_value = lkr_amount + cmb_value + processedData.extra_tax;

    // Step 5: Unit Price = Final Value ÷ Quantity
    const unit_price =
      processedData.qty > 0 ? final_value / processedData.qty : 0;

    const calculationData = {
      shop_id: processedData.shop_id,
      item_name: processedData.item_name.trim(), // Ensure item_name is included and trimmed
      qty: processedData.qty,
      rmb_price: processedData.rmb_price,
      rmb_amount,
      lkr_amount,
      cmb_rate: processedData.cmb_rate,
      cmb_amount: processedData.cmb_amount,
      cmb_value,
      extra_tax: processedData.extra_tax,
      final_value,
      unit_price,
      exchange_rate: processedData.exchange_rate,
      // Don't update created_at, keep the original timestamp
    };

    console.log("Updating calculation data:", calculationData); // Debug log

    // Update in Supabase
    const { data, error } = await supabase
      .from("calculations")
      .update(calculationData)
      .eq("id", id)
      .select(
        `
        *,
        shops!shop_id (
          shop_name
        )
      `
      )
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to update calculation", details: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Calculation not found after update" },
        { status: 404 }
      );
    }

    console.log("Successfully updated calculation:", data); // Debug log
    return NextResponse.json(data);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      {
        error: "Failed to update calculation",
        details: error instanceof Error ? error.message : "Unknown error",
      },
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
