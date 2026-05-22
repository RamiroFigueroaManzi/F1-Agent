import os
import time
from PyPDF2 import PdfReader
from google import genai
from supabase import create_client
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Inicializar clientes
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

def procesar_reglamentos(carpeta_nombre):
    # Obtener la ruta absoluta de la carpeta
    ruta_carpeta = os.path.join(os.getcwd(), carpeta_nombre)
    
    if not os.path.exists(ruta_carpeta):
        print(f"❌ Error: La carpeta '{carpeta_nombre}' no existe en {os.getcwd()}")
        return

    # Listar archivos PDF
    archivos_pdf = [f for f in os.listdir(ruta_carpeta) if f.endswith('.pdf')]
    
    if not archivos_pdf:
        print(f"⚠️ No se encontraron archivos PDF en la carpeta '{carpeta_nombre}'")
        return

    print(f"🚀 Se encontraron {len(archivos_pdf)} archivos. Iniciando ingesta...")

    for archivo in archivos_pdf:
        ruta_archivo = os.path.join(ruta_carpeta, archivo)
        print(f"\n--- 📄 Procesando: {archivo} ---")
        
        try:
            reader = PdfReader(ruta_archivo)
            total_paginas = len(reader.pages)
            
            for i, page in enumerate(reader.pages):
                texto = page.extract_text()
                
                # Saltar páginas vacías o muy cortas (ruido)
                if not texto or len(texto.strip()) < 50:
                    continue

                # Preparar contenido con encabezado de fuente para la IA
                contenido_final = f"DOCUMENT: {archivo} | PAGE: {i+1}\n\n{texto}"

                # 1. Generar Embedding (768 dimensiones como pide tu Supabase)
                res = client.models.embed_content(
                    model='gemini-embedding-001',
                    contents=contenido_final,
                    config={'output_dimensionality': 768}
                )
                vector = res.embeddings[0].values

                # 2. Subir a Supabase
                data = {
                    "contenido": contenido_final,
                    "metadata": {
                        "fuente": archivo,
                        "pagina": i + 1,
                        "tipo": "Reglamento Oficial F1"
                    },
                    "embedding": vector
                }
                
                supabase.table("documentos_f1").insert(data).execute()
                print(f"✅ [{archivo}] Página {i+1}/{total_paginas} subida.")
                
                # Pausa de seguridad para no exceder el límite de la API gratuita
                time.sleep(1.5)

        except Exception as e:
            print(f"❌ Error procesando {archivo}: {e}")

if __name__ == "__main__":
    # Ejecutamos la función apuntando a tu carpeta
    procesar_reglamentos("reglamentos")