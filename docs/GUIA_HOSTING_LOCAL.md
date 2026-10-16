# 🌐 Guía de Hosting Casero y Acceso desde el Celular

Esta guía te explica cómo configurar la aplicación en una computadora o servidor de tu casa para acceder cómodamente desde tu celular o tablet mientras estás en la cocina o amasando.

---

## 1. Acceso en la Red Wi-Fi de tu Casa

Cuando inicias el servidor con `iniciar.bat` o `python run.py`, la aplicación queda escuchando en todas las interfaces de red (`0.0.0.0:8000`).

La terminal te mostrará tu dirección local, por ejemplo:
```text
Acceso desde Celular (Wi-Fi):   http://192.168.1.35:8000
```

### Pasos para conectar tu celular:
1. Conecta tu celular a la misma red Wi-Fi de tu casa.
2. Abre el navegador web (Google Chrome en Android, o Safari en iPhone).
3. Escribe en la barra de direcciones: `http://192.168.1.35:8000` *(reemplaza los números por la IP que muestre tu terminal)*.
4. ¡Listo! Verás la aplicación adaptada perfectamente a la pantalla del celular.

---

## 2. Instalar como App en tu Celular (Acceso Directo)

Puedes agregar un ícono en la pantalla de inicio de tu celular para abrirla con un solo toque como si fuera una aplicación instalada:

### En Android (Google Chrome):
1. Entra a la web en tu celular.
2. Toca el menú de los **3 puntos** arriba a la derecha.
3. Elige **"Agregar a la pantalla de inicio"** o **"Instalar aplicación"**.
4. Ahora tendrás el ícono de *Panadería Costos* junto a tus otras apps.

### En iPhone (Safari):
1. Entra a la web en Safari.
2. Toca el botón de **Compartir** (el cuadrado con la flecha hacia arriba en la barra inferior).
3. Desliza hacia abajo y selecciona **"Agregar al inicio"**.
4. Toca **"Agregar"** arriba a la derecha.

---

## 3. Si tu Celular no puede Conectar (Permiso de Firewall en Windows)

La primera vez que ejecutas Python en Windows, puede que el Firewall te pregunte si deseas permitir el acceso a redes privadas:

1. Si aparece una ventana de **Seguridad de Windows (Firewall)**:
   - Marca la casilla **"Redes privadas (como la red doméstica o del trabajo)"**.
   - Haz clic en **"Permitir acceso"**.
2. Si sigue sin conectar:
   - Ve a *Panel de Control > Firewall de Windows Defender*.
   - Selecciona *"Permitir que una aplicación o una característica pase a través del Firewall"*.
   - Busca `python.exe` y asegúrate de que la casilla **Privada** esté tildada.

---

## 4. Respaldar tus Datos (Base de Datos SQLite)

Toda tu información (recetas, ingredientes, precios de compra, valor hora y sesiones de producción históricas) se almacena en un único archivo:

📁 `panaderia.db` *(ubicado en la carpeta raíz del proyecto)*

### Cómo hacer una copia de seguridad:
- Para hacer un respaldo, simplemente copia el archivo `panaderia.db` a una carpeta en Google Drive, Dropbox, o un pendrive.
- Si cambias de computadora, llevas tu carpeta con `panaderia.db` y no perderás ningún dato.
