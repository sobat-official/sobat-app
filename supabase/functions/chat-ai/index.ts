import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { message } = await req.json()
    const apiKey = Deno.env.get("GEMINI_API_KEY")

    // Panggil langsung ke endpoint v1 (bukan v1beta)
   const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contents: [{ parts: [{ text: message }] }]
  }),
})

    const data = await response.json()

    if (!response.ok) {
      throw new Error(`Google API Error: ${JSON.stringify(data)}`)
    }

    const reply = data.candidates[0].content.parts[0].text
    
    return new Response(JSON.stringify({ reply }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    })

  } catch (error) {
    return new Response(JSON.stringify({ reply: `Error: ${error.message}` }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 
    })
  }
})
