import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const apiKey = Deno.env.get("GEMINI_API_KEY")
  
  // Kita coba ambil daftar model dari API
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
  const data = await response.json()

  return new Response(JSON.stringify(data, null, 2), {
    headers: { "Content-Type": "application/json" }
  })
})
