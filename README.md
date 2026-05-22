# 🏎️ Paddock Intelligence — FIA RAG Engine 📊

**Paddock Intelligence** es un asistente técnico especializado de Inteligencia Artificial diseñado para escuderías, ingenieros de pista y entusiastas de la Fórmula 1. La aplicación permite realizar consultas ultra precisas sobre los complejos **Reglamentos Técnicos y Deportivos de la FIA (Fórmula 1 2026)** utilizando una arquitectura **RAG (Retrieval-Augmented Generation)**.

La interfaz está inspirada en los monitores de telemetría y software de estrategia del *Pit Lane*, ofreciendo una experiencia inmersiva de alto rendimiento en modo oscuro.

---

## 🚀 Características Clave

* **FIA RAG Engine (Local & Cloud):** El motor recupera extractos exactos del reglamento oficial indexados en vectores y los inyecta en el contexto de LLMs de última generación (Gemini 2.5) para evitar alucinaciones.
* **Procesamiento de Embeddings Eficiente:** Preparado para interactuar con la API de Google o procesar vectores de 768 dimensiones localmente mediante `sentence-transformers`.
* **Historial Sincronizado en Tiempo Real:** Persistencia de sesiones y logs de mensajes individuales mediante **Supabase** vinculados de forma segura (RLS).
* **Consola de Ingeniería Avanzada:** Interfaz de usuario construida en React y Tailwind CSS que emula una cabina de telemetría, incluyendo renderizado dinámico de Markdown para directivas técnicas, scroll inteligente y barras laterales reactivas.
* **Autenticación Blindada:** Sistema de Login integrado con Google OAuth y Magic Links configurados con políticas de seguridad a nivel de fila (Row Level Security).

---

## 🛠️ Stack Tecnológico

### Backend (El Motor)
* **Python 3.11+** & **FastAPI:** API REST de alta velocidad para el procesamiento de prompts.
* **Google GenAI / Sentence-Transformers:** Generación de respuestas y embeddings vectoriales.
* **Supabase Python SDK:** Conectividad directa con la base de datos de vectores.

### Frontend (La Cabina)
* **React** & **Tailwind CSS:** Interfaz responsiva y estilizada en modo oscuro técnico.
* **ReactMarkdown:** Renderizado de texto enriquecido para estructurar artículos y penalizaciones.
* **Lucide React:** Iconografía minimalista e industrial.

### Base de Datos & Seguridad (Los Boxes)
* **Supabase (PostgreSQL con extensiones):** Gestión de usuarios (`auth.users`), tabla relacional de `conversaciones` e historial de `mensajes`.

---

## 📂 Estructura del Repositorio

```text
├── backend/                  # Código del servidor Python
│   ├── main.py               # Endpoints de FastAPI y lógica RAG
│   ├── requirements.txt      # Dependencias de Python
│   └── .env.example          # Variables de entorno (API Keys)
│
├── frontend/                 # Aplicación de React
│   ├── public/               # Favicon F1 e index.html personalizado
│   ├── src/
│   │   ├── components/       # Sidebar, AuthModal, LogoutModal
│   │   ├── lib/              # Inicialización de Supabase Client
│   │   ├── App.js            # Layout principal del Chat de Telemetría
│   │   └── index.css         # Estilos globales y scrollbars personalizados
│   └── package.json          # Dependencias de Node
└── README.md