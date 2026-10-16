# 📖 Manual de Usuario - Panadería Costos

Esta guía te explica paso a paso cómo utilizar cada funcionalidad del sistema para tener el control total de los costos y rentabilidad de tu panadería o pastelería casera.

---

## Índice
1. [Insumos y Packaging](#1-insumos-y-packaging)
2. [Recetas y Costeo de Escandallo](#2-recetas-y-costeo-de-escandallo)
3. [Jornadas de Mano de Obra y Ventana Temporal](#3-jornadas-de-mano-de-obra-y-ventana-temporal)
4. [Simulador de Maximización de Precios](#4-simulador-de-maximización-de-precios)
5. [Ajustes del Taller](#5-ajustes-del-taller)

---

## 1. Insumos y Packaging

En esta sección administras todas las materias primas y materiales de embalaje que compras.

### ¿Cómo dar de alta un insumo?
1. Dirígete a la pestaña **"Insumos & Packaging"**.
2. Pulsa el botón **"+ Nuevo Insumo"**.
3. Completa los campos:
   - **Nombre:** Ej. *Dulce de Leche Repostero Vacalin*.
   - **Categoría:** Selecciona *Ingrediente* o *Packaging / Embalaje*.
   - **Unidad de Compra:** Kilo (kg), Gramo (g), Litro (l), Mililitro (ml), Pack o Docena.
   - **Cantidad en Paquete:** Si compraste un balde de 5 kg, pones `5`. Si compraste un paquete de 100 bolsitas, pones `100`.
   - **Precio Total Pagado:** Lo que pagaste en el supermercado o distribuidora (ej. `$19.500`).
   - **Merma o Pérdida (%):** *(Opcional)* Si hay desperdicio en la cocción o manipulación (ej. 2% de dulce de leche que queda en la manga repostera).
4. El sistema calculará en tiempo real el **Costo Unitario Base** (ej. `$3.98 por gramo`).
5. Pulsa **"Crear Insumo"**.

> **💡 Consejo Inflación:** Cuando los insumos aumenten de precio, no necesitas cambiar tus recetas una por una. Solo editas el insumo aquí, pones el nuevo precio de compra, y **todas las recetas que usen ese insumo actualizarán su costo automáticamente**.

---

## 2. Recetas y Costeo de Escandallo

Aquí defines tus productos de venta y los ingredientes necesarios para fabricarlos.

### ¿Cómo crear una receta?
1. Ve a la pestaña **"Recetas & Costos"**.
2. Pulsa **"+ Nueva Receta"**.
3. Ingresa la información general:
   - **Nombre:** Ej. *Cañoncitos de Dulce de Leche*.
   - **Categoría:** Ej. *Facturas / Masas*.
   - **Rendimiento de la Tanda:** ¿Cuántas unidades salen de esta preparación? (Ej. `24` cañoncitos).
   - **Tiempo de trabajo (minutos):** Tiempo total que te lleva amasar, hojaldrar, hornear y rellenar la tanda (ej. `60` minutos).
   - **Gastos Indirectos (%):** Porcentaje para cubrir gas, electricidad y desgaste del horno (el estándar es `10%`).
   - **Margen de Ganancia Deseado (%):** Cuánto deseas ganar sobre el costo (ej. `60%`).
   - **Precio que cobras hoy ($):** *(Opcional)* Si ya vendes este producto a un precio fijo, colócalo para comparar si estás ganando o perdiendo plata.
4. **Agregar Insumos:**
   - Pulsa **"+ Agregar Insumo"**.
   - Elige el ingrediente o packaging de la lista desplegable.
   - Escribe la cantidad requerida para toda la tanda (ej. `450` gramos de harina, `750` gramos de dulce de leche, `24` bolsitas de polipropileno, `24` etiquetas con logo).
5. Observa el resumen dinámico al pie de la ventana: verás exactamente cuánto cuesta cada unidad terminada en materia prima, mano de obra y el precio sugerido de venta.
6. Pulsa **"Crear Receta"**.

---

## 3. Jornadas de Mano de Obra y Ventana Temporal

En la panadería casera, muchas veces no elaboras un solo producto a la vez, sino que prendes el horno y en una ventana de 3 o 4 horas sacas varias cosas simultáneamente.

### ¿Cómo registrar una sesión de producción?
1. Ve a la pestaña **"Mano de Obra & Horas"**.
2. Pulsa **"Registrar Sesión de Trabajo"**.
3. Completa los datos de la jornada:
   - **Título:** Ej. *Producción de sábado a la mañana*.
   - **Horas trabajadas:** Ej. `3.0` horas.
   - **Valor por hora:** Ej. `$20.000` (el sistema lo toma de tus ajustes, pero puedes ajustarlo).
   - Costo total de tu trabajo en esa jornada: `3h * $20.000 = $60.000`.
4. **Productos horneados en esa ventana:**
   - Agrega cada producto terminado y cuántas unidades sacaste (ej. `48` cañoncitos y `40` alfajores de maicena = `88` unidades en total).
5. **Cálculo automático:**
   - El sistema distribuye los `$60.000` entre las 88 unidades elaboradas, asignando a cada una `$681.82` de mano de obra real.
   - Guarda una copia congelada con los costos de ese día en la base de datos para tu archivo histórico.

---

## 4. Simulador de Maximización de Precios

Esta herramienta te ayuda a encontrar el "precio dulce": el valor donde ganas buen dinero por unidad sin que resulte tan caro que los clientes dejen de comprarte.

### ¿Cómo usar el simulador?
1. Ve a la pestaña **"Simulador de Ganancia"** (o pulsa *"Simular Precio"* en cualquier receta).
2. Elige el producto a analizar.
3. Puedes mover los deslizadores de **Valor Hora** y **Margen Objetivo** para ver cómo impactan en el precio final.
4. Consulta los **4 Hitos de Precios:**
   - **Punto de Equilibrio:** Costo exacto por unidad. Por debajo de este valor, estás perdiendo dinero.
   - **Económico / Promo (+30%):** Para ventas por volumen, docenas o ferias.
   - **Competitivo Recomendado (+60%):** El precio justo para venta diaria al público.
   - **Pico de Máxima Ganancia:** El valor óptimo calculado según la curva de elasticidad de demanda.
5. **Calculadora Rápida:** Escribe un precio de venta de prueba y tus ventas estimadas por semana para ver tu ganancia neta mensual limpia proyectada.

---

## 5. Ajustes del Taller

En la esquina superior derecha, pulsa el ícono de engranaje (**Ajustes**) para configurar los valores predeterminados de tu negocio:
- **Valor hora de trabajo por defecto:** Cuánto consideras que vale tu hora de trabajo artesanal (por defecto: `$20.000/h`).
- **Margen de ganancia por defecto:** El porcentaje de ganancia estándar sugerido para nuevas recetas (por defecto: `60%`).
- **Gastos indirectos por defecto:** Porcentaje aplicado para gas, electricidad y desgaste de herramientas (por defecto: `10%`).
