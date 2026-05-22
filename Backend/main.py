import os
from fastapi import FastAPI
from pydantic import BaseModel  # <-- NUEVO: Para validar el JSON entrante
from google import genai
from supabase import create_client
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Estructura de datos que esperamos recibir desde el frontend
class ConsultaChat(BaseModel):
    pregunta: str

# Inicializamos clientes
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

@app.post("/preguntar")  # <-- CAMBIADO de .get a .post
async def preguntar_f1(payload: ConsultaChat): # <-- Recibe el JSON validado
    try:
        pregunta = payload.pregunta
        chequeo_prompt = f"""
        Analiza el siguiente texto de un usuario y responde ÚNICAMENTE con la palabra 'SALUDO' si es un saludo, presentación o charla casual sin ninguna pregunta técnica (ej: 'hola', 'holaaa', 'buen día', 'qué tal', 'hola quién eres'). 
        Si contiene una pregunta real o menciona algo de F1, responde 'PREGUNTA'.
        
        TEXTO DEL USUARIO: "{pregunta}"
        """
        
        verificacion = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=chequeo_prompt
        )
        
        # 2. Si Gemini dice que es un saludo, respondemos directo sin tocar Supabase
        if "SALUDO" in verificacion.text.upper():
            return {
                "respuesta": "¡Hola! Soy tu asistente técnico de Fórmula 1. Estoy listo para analizar el reglamento oficial de 2026. ¿Qué duda específica tienes hoy?",
                "fuentes": []
            }

        # 1. Convertir la pregunta en vector
        res_embed = client.models.embed_content(
            model='gemini-embedding-001',
            contents=pregunta,
            config={'output_dimensionality': 768}
        )
        pregunta_vector = res_embed.embeddings[0].values

        # 2. Buscar en Supabase (RPC)
        rpc_params = {
            'query_embedding': pregunta_vector,
            'match_threshold': 0.4,
            'match_count': 3        
        }
        
        contexto_db = supabase.rpc('match_documents', rpc_params).execute()
        
        if not contexto_db.data:
            return {"respuesta": "No encontré información específica en el reglamento sobre eso."}

        # 3. Unir los resultados para el contexto
        contexto_texto = "\n".join([item['contenido'] for item in contexto_db.data])

        # 4. Generar respuesta con Gemini 2.5 Flash
        prompt = f"""
        Eres un expert técnico en reglamentación de Fórmula 1. 
        El siguiente contexto está en inglés y es parte del reglamento oficial.
        Tu tarea es analizarlo y responder la pregunta del usuario en ESPAÑOL de forma técnica y precisa.

        CONTEXTO:
        {contexto_texto}

        PREGUNTA:
        {pregunta}
        """
        
        respuesta_gemini = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )

        return {
            "respuesta": respuesta_gemini.text,
            "fuentes": [item['metadata'] for item in contexto_db.data]
        }

    except Exception as e:
        print("====== ¡EL BACKEND SE ROMPIÓ AQUÍ! ======")
        print(f"Error real: {str(e)}")
        print("=========================================")
        return {"respuesta": f"Error interno en el servidor de Python: {str(e)}"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)