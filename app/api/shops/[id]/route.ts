// app/api/shops/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// GET /api/shops/[id]
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "Shop ID is required" },
        { status: 400 }
      );
    }

    const { data: shopData, error: shopError } = await supabase
      .from("shops")
      .select("*")
      .eq("id", id)
      .single();

    if (shopError || !shopData) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    const { data: calculationsData, error: calculationsError } = await supabase
      .from("calculations")
      .select("*")
      .eq("shop_id", id)
      .order("created_at", { ascending: false });

    if (calculationsError) {
      console.error("Error fetching calculations:", calculationsError);
      return NextResponse.json(
        { error: "Failed to fetch shop calculations" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      shop: shopData,
      calculations: calculationsData || [],
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch shop details" },
      { status: 500 }
    );
  }
}

// PUT /api/shops/[id]
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Shop ID is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("shops")
      .update({
        shop_name: body.shop_name,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to update shop" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Failed to update shop" },
      { status: 500 }
    );
  }
}

// DELETE /api/shops/[id]
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "Shop ID is required" },
        { status: 400 }
      );
    }

    await supabase.from("calculations").delete().eq("shop_id", id);
    const { error } = await supabase.from("shops").delete().eq("id", id);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to delete shop" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Shop deleted successfully" });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Failed to delete shop" },
      { status: 500 }
    );
  }
}
