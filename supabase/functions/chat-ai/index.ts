import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// IMPORT SDK RESMI GOOGLE
import { GoogleGenerativeAI } from "npm:@google/generative-ai"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle preflight request untuk CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message } = await req.json()
    
    // Ambil kunci rahasia
    const rawApiKey = Deno.env.get("GEMINI_API_KEY")
    
    if (!rawApiKey) {
      return new Response(
        JSON.stringify({ reply: "Sistem error: Kunci GEMINI_API_KEY belum terpasang." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      )
    }

    // TRIK PEMBERSIH: .trim() akan membuang spasi/enter gaib yang tidak sengaja ter-copy
    const cleanApiKey = rawApiKey.trim()

    // INISIALISASI MESIN AI GOOGLE
    const genAI = new GoogleGenerativeAI(cleanApiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" })

    // Eksekusi percakapan
    const result = await model.generateContent(message)
    const reply = result.response.text()
    
    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ reply: `Error SDK AI: ${error.message}` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    )
  }
})
