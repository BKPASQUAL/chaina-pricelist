import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { calculationSchema } from '@/app/lib/validations';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = calculationSchema.parse(body);
    
    // Calculate values
    const rmb_amount = validatedData.qty * validatedData.rmb_price;
    const final_value = rmb_amount + validatedData.cmb_rs + validatedData.extra_tax;
    
    const calculationData = {
      ...validatedData,
      rmb_amount,
      final_value
    };
    
    // Save to Supabase
    const { data, error } = await supabase
      .from('calculations')
      .insert([calculationData])
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to save calculation' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Invalid input data' },
      { status: 400 }
    );
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('calculations')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch calculations' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calculations' },
      { status: 500 }
    );
  }
}