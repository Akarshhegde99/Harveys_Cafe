import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Try to fetch from Supabase
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('Error fetching invoices from database:', error)
      return NextResponse.json(
        { error: 'Failed to fetch invoices', data: [] },
        { status: 200 } // Return 200 with empty data for graceful fallback
      )
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    })
  } catch (error) {
    console.error('Error in invoices API:', error)
    return NextResponse.json(
      { error: 'Internal server error', data: [] },
      { status: 200 } // Return 200 with empty data for graceful fallback
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const invoiceData = await request.json()

    // Save invoice to Supabase
    const { error } = await supabase
      .from('invoices')
      .insert([invoiceData])

    if (error) {
      console.error('Error saving invoice to database:', error)
      return NextResponse.json(
        { error: 'Failed to save invoice' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Invoice saved successfully',
    })
  } catch (error) {
    console.error('Error in invoices POST API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
