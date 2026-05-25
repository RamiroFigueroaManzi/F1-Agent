import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
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
    conversacion_id: Optional[str] = None  # Parámetro opcional para la memoria

# Inicializamos clientes oficiales
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

@app.post("/preguntar")
async def preguntar_f1(payload: ConsultaChat):
    try:
        pregunta_original = payload.pregunta
        pregunta_para_rag = pregunta_original

        # ========================================================
        # 🧠 CONTENEDOR DE MEMORIA HISTÓRICA CON SUPABASE
        # ========================================================
        if payload.conversacion_id:
            # Descargamos los últimos 6 mensajes del chat actual
            resultado_historial = supabase.table("mensajes") \
                .select("rol, texto") \
                .eq("conversacion_id", payload.conversacion_id) \
                .order("created_at", desc=True) \
                .limit(6) \
                .execute()
            
            registros = resultado_historial.data
            
            if registros:
                # Los ordenamos de más viejos a más nuevos (cronológico)
                registros.reverse()
                
                # Construimos el string de la conversación pasada para Gemini
                historial_texto = ""
                for msg in registros:
                    rol_nombre = "Piloto" if msg['rol'] == 'usuario' else "F1_Agent"
                    historial_texto += f"{rol_nombre}: {msg['texto']}\n"
                
                # Prompt del ingeniero de pista para reformular pronombres confusos
                prompt_contexto = f"""
                Eres un ingeniero de sistemas experto en telemetría y reglamentos de la FIA.
                Analiza el siguiente historial de chat del Pit Lane y la nueva entrada del piloto. 
                Tu tarea es reformular la nueva pregunta para que sea una consulta independiente, técnica y explícita, que contenga todo el contexto necesario para ser buscada en una base de datos vectorial sin depender del historial.

                REGLA CLAVE: Si la nueva pregunta ya es autoexplicativa y no depende de los mensajes pasados, devuélvela exactamente igual.

                HISTORIAL DE CHAT:
                {historial_texto}

                NUEVA ENTRADA DEL PILOTO:
                "{pregunta_original}"

                Responde ÚNICAMENTE con el texto de la pregunta reformulada final. No agregues saludos, ni explicaciones, ni comillas.
                """
                
                verificacion_contexto = client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=prompt_contexto
                )
                
                # Reemplazamos la pregunta por su versión unificada e independiente
                pregunta_para_rag = verificacion_contexto.text.strip()
                print(f"--- 🏎️ CONSULTA REFORMULADA POR CONTEXTO: {pregunta_para_rag} ---")

        # ========================================================
        # 🛡️ FILTRO DE SEGURIDAD PARA SALUDOS
        # ========================================================
        chequeo_prompt = f"""
        Analiza el siguiente texto de un usuario y responde ÚNICAMENTE con la palabra 'SALUDO' si es un saludo, presentación o charla casual sin ninguna pregunta técnica (ej: 'hola', 'holaaa', 'buen día', 'qué tal', 'hola quién eres'). 
        Si contiene una pregunta real o menciona algo de F1, responde 'PREGUNTA'.
        
        TEXTO DEL USUARIO: "{pregunta_para_rag}"
        """
        
        verificacion = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=chequeo_prompt
        )
        
        if "SALUDO" in verificacion.text.upper():
            return {
                "respuesta": "¡Hola! Soy tu asistente técnico de Fórmula 1. Estoy listo para analizar el reglamento oficial de 2026. ¿Qué duda específica tienes hoy?",
                "fuentes": []
            }

        # ========================================================
        # 🔍 GENERACIÓN DE EMBEDDINGS Y LLAMADA RAG
        # ========================================================
        # Convertimos la pregunta limpia/contextualizada en vectores numéricos
        res_embed = client.models.embed_content(
            model='gemini-embedding-001',
            contents=pregunta_para_rag,
            config={'output_dimensionality': 768}
        )
        pregunta_vector = res_embed.embeddings[0].values

        # Hacemos la consulta por similitud de cosenos en Supabase
        rpc_params = {
            'query_embedding': pregunta_vector,
            'match_threshold': 0.4,
            'match_count': 3        
        }
        
        contexto_db = supabase.rpc('match_documents', rpc_params).execute()
        
        if not contexto_db.data:
            return {"respuesta": "No encontré información específica en el reglamento sobre eso con el contexto provisto."}

        # Unimos los fragmentos del PDF reglamentario
        contexto_texto = "\n".join([item['contenido'] for item in contexto_db.data])

        # ========================================================
        # 🏁 RESPUESTA TÉCNICA DEFINITIVA EN ESPAÑOL
        # ========================================================
        prompt = f"""
        Eres un experto técnico en reglamentación de Fórmula 1. 
        El siguiente contexto está en inglés y es parte del reglamento oficial de la FIA de 2026.
        Tu tarea es analizarlo y responder la pregunta del usuario en ESPAÑOL de forma técnica y precisa.

        CONTEXTO OFICIAL DE LA FIA:
        {contexto_texto}

        PREGUNTA ACTUAL DEL PILOTO:
        {pregunta_original}
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