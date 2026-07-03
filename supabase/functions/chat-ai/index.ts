import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Menangani masalah CORS
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const apiKey = Deno.env.get("GEMINI_API_KEY")
  
  // Deteksi apakah API Key ada atau tidak
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "GEMINI_API_KEY TIDAK DITEMUKAN DI SUPABASE" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    })
  }

  // Panggil list model
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
  const data = await response.json()

  return new Response(JSON.stringify(data, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  })
})
