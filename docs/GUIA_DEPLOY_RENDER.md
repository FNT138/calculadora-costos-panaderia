# 🚀 Guía Paso a Paso para Publicar Gratis en Render.com

Con esta guía podrás publicar tu aplicación en internet sin pagar nada, obteniendo una dirección pública con candado de seguridad (**HTTPS**) para acceder desde tu celular en cualquier lugar (incluso con datos móviles 4G/5G fuera de tu casa).

---

## Paso 1: Subir tu Código a GitHub (1 minuto)

1. Entra a tu cuenta en [GitHub.com](https://github.com) (si no tienes, crea una gratis).
2. Haz clic en el botón verde **"New"** o **"+" > "New repository"**.
3. Ponle de nombre al repositorio: `calculadora-costos-panaderia` (puedes dejarlo como *Público* o *Privado*).
4. **NO** marques las casillas de README ni .gitignore (ya los creamos localmente).
5. Haz clic en **"Create repository"**.
6. En la pantalla que aparece, copia los comandos que dicen **"push an existing repository from the command line"**. Serán algo como esto:

```bash
git remote add origin https://github.com/TU_USUARIO/calculadora-costos-panaderia.git
git branch -M main
git push -u origin main
```

*(Ejecuta esos comandos en PowerShell o la terminal dentro de tu carpeta `C:\Users\fede4\Documents\Calculadora Costs`).*

---

## Paso 2: Desplegar en Render.com (Gratis)

1. Entra a [Render.com](https://render.com) y haz clic en **"Get Started for Free"** (inicia sesión directamente con tu cuenta de GitHub).
2. En el panel principal (Dashboard), haz clic en el botón **"New +"** (arriba a la derecha) y selecciona **"Web Service"**.
3. Elige la opción **"Build and deploy from a Git repository"** y haz clic en **"Next"**.
4. Conecta tu cuenta de GitHub y busca el repositorio `calculadora-costos-panaderia`. Haz clic en **"Connect"**.
5. Completa el formulario de configuración (Render detectará casi todo automáticamente gracias al archivo `render.yaml`):
   - **Name:** `panaderia-costos` (o el nombre que prefieras).
   - **Region:** Selecciona la más cercana (ej. *Ohio* u *Oregon*).
   - **Branch:** `main` (o `master`).
   - **Runtime:** `Python 3`.
   - **Build Command:**
     ```bash
     pip install -r backend/requirements.txt
     ```
   - **Start Command:**
     ```bash
     python run.py
     ```
   - **Instance Type:** Selecciona **Free** ($0 / mes).
6. Haz clic al final en **"Create Web Service"**.

---

## Paso 3: ¡Listo! Tu App está en Internet

Render comenzará a construir tu aplicación y en 1 a 2 minutos verás un mensaje en verde que dice **"Live"**.

Arriba a la izquierda, debajo del nombre de tu servicio, verás tu enlace público gratuito, por ejemplo:
👉 **`https://panaderia-costos.onrender.com`**

Puedes abrir ese enlace desde cualquier computadora, celular o tablet del mundo.

---

## 💡 Consejo Pro: Base de Datos Permanente en Render

El plan gratuito de Render funciona con un contenedor web donde tu base de datos SQLite incluida (`panaderia.db`) guardará tus recetas y costos.

Si en el futuro deseas que tus datos se conserven de forma permanente incluso ante actualizaciones de código:
1. En Render, haz clic en **"New +" > "PostgreSQL"**.
2. Dale un nombre y selecciona el plan **Free**.
3. Copia el **"Internal Database URL"**.
4. Ve a tu Web Service > pestaña **"Environment"** > agrega una variable:
   - Clave: `DATABASE_URL`
   - Valor: *(pega la URL que copiaste)*
5. Tu aplicación ya está programada para migrar y conectarse a PostgreSQL de forma 100% automática sin tocar una sola línea de código.
