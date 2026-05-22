# --- Etapa 1: Compilación de la App ---
FROM node:18-alpine AS build
WORKDIR /app

# Copiamos paquetes e instalamos dependencias
COPY package*.json ./
RUN npm install

# Copiamos el código y compilamos para producción
COPY . .
RUN npm run build

# --- Etapa 2: Servidor de Producción ---
FROM nginx:stable-alpine
# Copiamos los archivos compilados de React al directorio de Nginx
COPY --from=build /app/build /usr/share/nginx/html

# Exponemos el puerto estándar web
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]