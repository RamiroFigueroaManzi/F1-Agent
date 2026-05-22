# 1. Usamos una imagen oficial de Python optimizada y liviana
FROM python:3.11-slim

# 2. Evita que Python escriba archivos .pyc en el disco y asegura que los logs salgan directo
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 3. Establecemos el directorio de trabajo dentro del contenedor
WORKDIR /app

# 4. Copiamos e instalamos las dependencias primero (aprovecha la caché de Docker)
COPY requirements.txt /app/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# 5. Copiamos todo el código del backend a la imagen
COPY . /app/

# 6. Exponemos el puerto en el que correrá FastAPI
EXPOSE 8000

# 7. Comando para arrancar Uvicorn escuchando en todas las interfaces de red
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
