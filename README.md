# 🥖 Panadería Costos - Sistema de Costeo y Maximización de Precios

Aplicación web integral y responsive (optimizada para celular y computadora), diseñada para que reposteros y panaderos caseros calculen con precisión matemática sus costos reales de producción (ingredientes, packaging, mano de obra y costos indirectos) y maximicen sus ganancias con precios de venta competitivos.

---

## 🚀 Inicio Rápido (1 solo paso)

En la carpeta del proyecto, ejecuta el archivo de inicio:

- **En Windows**: Doble clic en `iniciar.bat` (o abre PowerShell y corre `python run.py`).
- **En Linux / Mac**: `python3 run.py`

El servidor se iniciará automáticamente y mostrará en la terminal:
```text
=================================================================
      PANADERIA COSTOS - SISTEMA DE COSTEO Y PRECIOS        
=================================================================
 Servidor iniciado con exito!
 Acceso en esta PC:              http://localhost:8000
 Acceso desde Celular (Wi-Fi):   http://192.168.1.XX:8000
=================================================================
```

---

## 📱 ¿Cómo usar la app desde el celular en tu casa?

1. Asegúrate de que tu celular esté conectado a la **misma red Wi-Fi** que la computadora donde corre la app.
2. Abre el navegador de tu celular (Chrome o Safari) e ingresa la dirección que aparece en la terminal (ejemplo: `http://192.168.1.35:8000`).
3. *(Opcional)* En Chrome de tu celular, pulsa el menú de 3 puntos y elige **"Agregar a la pantalla de inicio"**. Tendrás un ícono como si fuera una aplicación nativa instalada.

---

## 💡 Características Principales

### 1. Insumos & Packaging (Efecto Cascada)
- Cargas el precio que pagas por paquete o bulto (ej. Harina $1.800 el kg, Bolsitas $2.800 el pack de 100, Dulce de Leche $19.500 el balde de 5 kg).
- El sistema convierte automáticamente a gramos, mililitros o unidades y descuenta el porcentaje de merma/pérdida.
- **Efecto Cascada:** Si sube el precio del dulce de leche o la harina por inflación, lo actualizas en el catálogo de insumos y **todas tus recetas se recalculan inmediatamente**.

### 2. Constructor de Recetas & Escandallo Unitario
- Creas tus recetas indicando los insumos de la tanda y el rendimiento (ej. tanda de 24 cañoncitos).
- El sistema suma ingredientes, packaging (bolsitas, bandejitas, etiquetas), mano de obra estimada y gastos indirectos (gas, luz, desgaste de herramientas).
- Te dice con precisión cuánto te cuesta fabricar cada cañoncito individual.

### 3. Prorrateo de Mano de Obra por Ventana Temporal
- Si dedicas una jornada de horneado (ej. 3 horas el sábado cobrando tu hora a $20.000 = $60.000) y sacas 48 cañoncitos y 40 alfajores, el sistema divide el costo laboral de esas horas exactamente entre los productos horneados.
- Guarda un **historial permanente en base de datos** de todas las tandas horneadas para comparar la rentabilidad con el tiempo.

### 4. Simulador Estratégico de Ganancias & Precios
- Gráfico interactivo con curva de sensibilidad de beneficios.
- Te muestra 5 hitos estratégicos:
  1. **Punto de Equilibrio (Break-even):** Costo puro (ganancia $0).
  2. **Precio Económico / Promo:** Margen del +30% (para ventas por volumen o docenas).
  3. **Precio Competitivo Recomendado:** Margen configurado (+60%), ideal para venta habitual.
  4. **Pico de Máxima Ganancia:** Precio óptimo que maximiza el ingreso neto total considerando rotación.
  5. **Precio Premium:** Margen para cajas de regalo o cafeterías de especialidad.
- Calculadora rápida: ingresas a cuánto quieres vender y cuántas unidades estimas por semana, y te calcula la ganancia limpia mensual proyectada.

---

## 🛠️ Tecnologías y Arquitectura

- **Backend:** Python 3.13 con **FastAPI** + **Pydantic** + **SQLAlchemy**.
- **Base de Datos:** **SQLite** (`panaderia.db`). Un solo archivo local, fácil de respaldar o copiar a un pendrive.
- **Frontend:** **React 18** + **Vite** + **Tailwind CSS** + **Lucide Icons** + **Recharts**.
- **Arquitectura Servidor Único:** FastAPI sirve directamente los archivos del frontend compilado en modo producción (`dist/`), evitando tener que levantar múltiples servidores.

---

## 📚 Documentación Adicional

- [Manual de Usuario Detallado](docs/MANUAL_DE_USUARIO.md)
- [Guía de Hosting Casero y Acceso Móvil](docs/GUIA_HOSTING_LOCAL.md)
