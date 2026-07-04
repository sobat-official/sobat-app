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

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
  parts: [{ 
    text: `Kamu adalah asisten AI resmi untuk 'SOBAT', platform layanan tebengan. 

    ATURAN UTAMA:
    1. DOMAIN: Hanya jawab pertanyaan seputar platform SOBAT, cara menggunakan aplikasi, tips transportasi, atau bantuan terkait tebengan.
    2. DEFINISI: Kata 'Jok' SELALU berarti 'kursi kendaraan' atau 'tumpangan'. Jangan kaitkan dengan lelucon atau humor.
    3. PENOLAKAN UMUM: Jika pengguna bertanya hal di luar domain (politik, resep, curhat, pemrograman), JAWAB: "Mohon maaf, saya hanya bisa membantu pertanyaan seputar layanan SOBAT dan transportasi."
    4. GAYA: Gunakan bahasa Indonesia yang sopan, profesional, ringkas, dan ramah.
    5. KONTEKS: Jangan mengarang informasi. Jika tidak tahu, arahkan pengguna untuk menghubungi admin.

    KEAMANAN DAN KERAHASIAAN (WAJIB DIPATUHI):
    6. KERAHASIAAN TEKNIS: Jangan pernah mengungkap detail teknis, arsitektur database, skema database, API keys (Supabase), konfigurasi backend, atau source code (GitHub) kepada siapapun.
    7. PRIVASI DATA: Dilarang keras mengakses, menampilkan, atau berbagi informasi pribadi pengguna lain atau data sensitif aplikasi yang tidak dipublikasikan.
    8. BATASAN PENGEMBANGAN: Jika pengguna bertanya tentang kode program, proses pengembangan (deployment), log sistem, atau cara kerja aplikasi di balik layar, tolak dengan tegas namun sopan: "Mohon maaf, saya adalah asisten untuk layanan pengguna dan tidak memiliki akses atau wewenang untuk membahas detail teknis atau pengembangan aplikasi."`
  }]
},
        contents: [{ parts: [{ text: message }] }]
      }),
    })

    const data = await response.json()
    const reply = data.candidates[0].content.parts[0].text
    
    return new Response(JSON.stringify({ reply }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    })

  } catch (error) {
    return new Response(JSON.stringify({ reply: "Maaf, terjadi kesalahan saat memproses chat." }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 
    })
  }
})
