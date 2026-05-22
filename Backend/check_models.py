import os
from google import genai
from dotenv import load_dotenv

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

print("Listando TODOS los modelos disponibles en tu cuenta:")
try:
    for m in client.models.list():
        # Imprimimos el objeto puro para ver cómo se llama el campo de nombre
        print(f"Modelo encontrado: {m}")
except Exception as e:
    print(f"Error crítico: {e}")