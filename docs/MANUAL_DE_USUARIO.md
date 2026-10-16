# 📘 Manual de Usuario Integral: Calculadora de Costos & Maximización de Precios

> **Panadería y Pastelería Artesanal**  
> *Versión 2.0 — Guía Oficial de Uso, Costeo, Estrategia de Precios y Seguridad*

---

## 📑 Tabla de Contenidos
1. [Introducción & Filosofía del Sistema](#1-introducción--filosofía-del-sistema)
2. [Estructura de la Interfaz & Navegación](#2-estructura-de-la-interfaz--navegación)
3. [Seguridad & PIN Maestro (Modo Lectura vs Admin)](#3-seguridad--pin-maestro-modo-lectura-vs-admin)
4. [Módulo 1: Insumos & Packaging (Materia Prima)](#4-módulo-1-insumos--packaging-materia-prima)
5. [Módulo 2: Recetas & Costeo de Escandallo](#5-módulo-2-recetas--costeo-de-escandallo)
6. [Glosario de Costos y Precios: ¿Qué significa cada valor?](#6-glosario-de-costos-y-precios-qué-significa-cada-valor)
7. [Módulo 3: Mano de Obra & Ventanas Temporales de Horneado](#7-módulo-3-mano-de-obra--ventanas-temporales-de-horneado)
8. [Módulo 4: Simulador de Ganancia & Curvas de Sensibilidad](#8-módulo-4-simulador-de-ganancia--curvas-de-sensibilidad)
9. [Módulo 5: Ajustes del Taller & Copias de Seguridad](#9-módulo-5-ajustes-del-taller--copias-de-seguridad)
10. [Flujos de Trabajo Prácticos del Día a Día](#10-flujos-de-trabajo-prácticos-del-día-a-día)

---

## 1. Introducción & Filosofía del Sistema

La mayoría de los pasteleros y panaderos caseros calculan sus precios multiplicando el costo de la harina y los huevos "por dos" o "por tres". Este método empírico suele llevar a **pérdidas invisibles** porque ignora tres factores cruciales:
1. **Tu tiempo real de trabajo:** Amasar, rellenar, vigilar el horno y limpiar son horas de tu vida que deben tener un salario digno garantizado.
2. **El packaging y embalaje:** Cajas, blondas, bolsas de polipropileno cristal y etiquetas con logo pueden representar hasta el 25% del costo del producto terminado.
3. **Los gastos invisibles del taller (Costos Indirectos):** Gas de horno, electricidad de batidoras y heladeras, agua, detergente y desgaste de latas/moldes.

Este sistema implementa un **costeo profesional de escandallo artesanal**, vinculando compras reales, rendimiento de tandas, valor hora prorrateado y curvas matemáticas de elasticidad para encontrar el **precio óptimo de venta**.

---

## 2. Estructura de la Interfaz & Navegación

La aplicación está diseñada bajo el estándar **Mobile-First**, garantizando una experiencia idéntica y fluida tanto en computadoras de escritorio como en la pantalla de cualquier teléfono celular o tablet.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🔥 Panadería Costos | [Recetas] [Insumos] [Mano de Obra] [Simulador]  [🔒 PIN] [⚙️] │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Barra de Navegación Superior
* **Logo & Nombre:** Al tocar el logo o título regresas a la pantalla principal de Recetas.
* **Pestañas de Navegación:**
  1. **Recetas & Costos:** Catálogo de productos, tarjetas de escandallo y constructor de recetas.
  2. **Insumos & Packaging:** Lista de ingredientes, compras por bulto, mermas y precios unitarios.
  3. **Mano de Obra & Horas:** Historial de jornadas de horneado y prorrateo entre múltiples productos.
  4. **Simulador de Ganancia:** Curva de sensibilidad, puntos de equilibrio y proyector mensual.
* **Botón de Seguridad / PIN:** Indicador de estado (**🔒 Solo Lectura** / **🔓 Admin Activo**).
* **Botón de Ajustes (Engranaje ⚙️):** Configuración de valor hora, márgenes por defecto y respaldos.

---

## 3. Seguridad & PIN Maestro (Modo Lectura vs Admin)

El sistema cuenta con un control de acceso para proteger tus recetas e información comercial si compartes el enlace con clientes o empleados.

```
                    ┌─────────────────────────┐
                    │    Enlace Público Web    │
                    └────────────┬────────────┘
                                 │
                   ┌─────────────┴─────────────┐
                   ▼                           ▼
        [ Visitante / Cliente ]        [ Pastelero / Dueño ]
                   │                           │
          Modo Solo Lectura               Ingresa PIN Maestro
                   │                           │
       • Ver catálogo y precios       • Crear / Editar recetas
       • Consultar ingredientes       • Modificar precios de compra
       • Explorar simulador           • Registrar jornadas reales
       ✖ Edición bloqueada            • Cambiar ajustes del taller
```

### Estados del Candado:
* **🔒 Solo Lectura:** El usuario puede inspeccionar toda la información, pero si hace clic en *"Nueva Receta"*, *"Nuevo Insumo"*, *"Editar"* o *"Eliminar"*, se despliega el teclado numérico solicitando el PIN maestro.
* **🔓 Admin Activo:** Al ingresar el PIN (**`1234`** de fábrica), la sesión se guarda en el navegador de tu dispositivo durante 30 días. Todos los botones de edición se activan. Al hacer clic sobre este botón verde, la sesión se bloquea al instante.

### ¿Cómo cambiar el PIN Maestro?
1. Abre el modal de PIN tocando el candado o ve a **Ajustes (⚙️)** $\rightarrow$ *"Seguridad & Acceso"*.
2. Toca **"Cambiar PIN Maestro"**.
3. Ingresa tu PIN actual, tu nuevo PIN (mínimo 4 caracteres o dígitos) y confírmalo.
4. El cambio se graba de forma permanente en la nube.

---

## 4. Módulo 1: Insumos & Packaging (Materia Prima)

Aquí se gestiona tu inventario de compras. Es el cimiento de todos los cálculos: cuando cambias el precio de un insumo aquí, **todas las recetas que lo utilicen actualizan su costo al instante**.

### Campos de un Insumo:
1. **Nombre del Insumo:** Nombre descriptivo (ej. *Harina 0000 Chacabuco*, *Dulce de Leche Vacalin*, *Bolsita Cristal 15x25*).
2. **Categoría:**
   * **Ingrediente:** Materias primas comestibles que van a la masa, relleno o decoración.
   * **Packaging:** Descartables, cajas, moldes de papel, bolsas, blondas, bandejas y stickers.
3. **Unidad de Compra & Conversión Automática:**
   * **Kilo (kg):** Se convierte automáticamente a **Gramos (g)** dividiendo por 1.000.
   * **Gramo (g):** Unidad base para pesajes de precisión.
   * **Litro (l):** Se convierte automáticamente a **Mililitros (ml)** dividiendo por 1.000.
   * **Mililitro (ml):** Unidad base líquida.
   * **Pack / Paquete:** Cantidad de unidades sueltas que vienen dentro del paquete (ej. paquete de 100 bolsitas, caja de 50 moldes).
   * **Docena:** Multiplica automáticamente por 12 unidades.
   * **Unidad:** Para insumos que se compran sueltos (ej. 1 manzana, 1 caja individual).
4. **Precio Total de Compra ($):** Lo que pagaste en el ticket del supermercado o distribuidora.
5. **Merma o Desperdicio (%):** Porcentaje que se pierde en el proceso y no llega al producto final (ej. 2% de dulce de leche que se pega a la manga; 5% de cáscara o merma de limón; evaporación de líquidos).

$$\text{Costo Base por Unidad} = \frac{\text{Precio Total de Compra}}{\text{Cantidad Base}} \times \frac{1}{1 - \frac{\text{Merma \%}}{100}}$$

---

## 5. Módulo 2: Recetas & Costeo de Escandallo

Es el recetario central de tu negocio. Cada tarjeta muestra el costo unitario de elaboración y el precio de venta sugerido.

### Campos de una Receta:
* **Nombre de la Receta:** Ej. *Brownie Clásico*, *Lemon Pie*, *Pastafrola*.
* **Categoría:** Ej. *Pastelería*, *Tartas Dulces*, *Facturas*, *Panadería*.
* **Rendimiento de la Tanda (Unidades):** ¿Cuántas porciones o unidades terminadas rinde la preparación completa? (ej. 1 budín, 6 porciones de brownie, 20 alfajorcitos).
* **Tiempo de Preparación (Minutos):** Tiempo estimado total dedicado a elaborar esta tanda (pesado, batido, armado, horneado y decoración).
* **Porcentaje de Costos Indirectos (%):** Desgaste de equipos, gas y luz asignados a la tanda (estándar: **10%**).
* **Margen de Ganancia Sugerido (%):** Porcentaje de beneficio esperado sobre el costo total (estándar artesanal: **60%**).
* **Precio de Venta Fijado ($):** *(Opcional)* Si ya decidiste un precio al público en tu pizarra (ej. $3.800), lo ingresas aquí para comparar tu ganancia real contra la sugerida.
* **Lista de Ingredientes y Packaging:**
  * Selector del insumo cargado previamente.
  * Cantidad exacta requerida para **toda la tanda** (en gramos, ml o unidades).
  * Notas individuales (ej. *"Para el glasé superior"*, *"Masa hojaldrada"*).

---

## 6. Glosario de Costos y Precios: ¿Qué significa cada valor?

Para tomar decisiones comerciales correctas, debes entender qué representa cada cifra en la tarjeta de la receta:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        COMPOSICIÓN DEL COSTO                           │
├───────────────────────────────┬────────────────────────────┬───────────┤
│    Materia Prima (MP)         │    Mano de Obra (MO)       │  CIF (10%)│
│  Ingredientes + Packaging     │  (Tiempo / 60) * ValorHora │ Gas + Luz │
└───────────────────────────────┴────────────────────────────┴───────────┘
                                       │
                                       ▼
                       ┌───────────────────────────────┐
                       │   COSTO TOTAL UNITARIO (CU)   │
                       └───────────────┬───────────────┘
                                       │
                      + Margen de Ganancia (ej. +60%)
                                       │
                                       ▼
                       ┌───────────────────────────────┐
                       │   PRECIO SUGERIDO DE VENTA    │
                       └───────────────────────────────┘
```

### 1. Costo de Materia Prima (MP)
Es la suma de todos los gramos de harina, azúcar, manteca, chocolate, más el packaging individual (bolsa, caja, base dorada) utilizados en una unidad.

### 2. Costo de Mano de Obra (MO)
Representa tu sueldo por elaborar el producto:

$$\text{MO Unitaria} = \frac{\left(\frac{\text{Tiempo en Minutos}}{60}\right) \times \text{Valor Hora}}{\text{Rendimiento de Unidades}}$$

*Ejemplo:* Si hacer 4 tartitas de Lemon Pie te lleva 45 minutos y tu valor hora es $20.000:
$$\text{MO Tanda} = \frac{45}{60} \times \$20.000 = \$15.000 \implies \text{MO por Tartita} = \frac{\$15.000}{4} = \$3.750$$

### 3. Costos Indirectos de Fabricación (CIF)
El 10% aplicado sobre la suma de Materia Prima + Mano de Obra para pagar el gas del horno, la boleta de luz, el agua y reponer moldes o batidores desgastados.

### 4. Costo Total Unitario (Costo de Elaboración)
$$\text{Costo Total} = \text{Materia Prima} + \text{Mano de Obra} + \text{Costos Indirectos}$$
> [!IMPORTANT]
> **Línea Roja:** Este es tu **Punto de Equilibrio**. Si vendes por debajo de este valor, estás pagando para trabajar.

### 5. Precio Sugerido de Venta
Calculado bajo la fórmula de **Margen sobre Costo (Cost-Plus Pricing)**:
$$\text{Precio Sugerido} = \text{Costo Total} \times \left(1 + \frac{\text{Margen \%}}{100}\right)$$

### 6. Margen sobre Costo vs. Margen sobre Precio
* **Margen sobre Costo (Markup):** Cuánto le agregas a lo que te costó. Si algo cuesta $1.000 y le agregas 60%, lo vendes a $1.600.
* **Margen sobre Precio (Gross Margin):** De cada $100 que te paga el cliente en mano, cuánto queda limpio en tu bolsillo. Si cobraste $1.600 y te costó $1.000, ganaste $600 $\rightarrow$ tu margen sobre precio es:
$$\frac{\$600}{\$1.600} \times 100 = 37,5\%$$

---

## 7. Módulo 3: Mano de Obra & Ventanas Temporales de Horneado

En la pastelería real casi nunca se hornea una sola receta a la vez. Prendes el horno una mañana de sábado y en una **ventana de 3 horas** sacas al mismo tiempo varias cosas.

### El Concepto de Prorrateo Ponderado
Si trabajas **3 horas** a un valor de **$20.000/h**, el costo laboral total de esa jornada es **$60.000**.  
El sistema no divide tontamente esos $60.000 en partes iguales si hiciste productos con distinta dificultad. Permite aplicar un **Factor de Dificultad**:
* **Factor 1.0 (Normal):** Productos estándar (alfajores, bizcochitos).
* **Factor 1.5 (Complejo):** Hojaldrados, masas laminadas que requieren muchas vueltas y reposos.
* **Factor 2.0 (Alta Dificultad):** Tartas decoradas, merengues italianos flambeados o armado de pisos.

### ¿Cómo registrar o corregir una sesión?
1. Toca **"Registrar Sesión de Trabajo"** (o toca el **lápiz ✏️** en una sesión anterior para editarla si te equivocaste).
2. Ingresa el título (ej. *"Hornada del Sábado"*), las horas reales trabajadas y el valor hora.
3. Agrega cada producto que horneaste con su cantidad y factor de dificultad.
4. El sistema calcula en vivo la mano de obra asignada a cada producto y guarda un **histórico inmutable** de esa jornada.

---

## 8. Módulo 4: Simulador de Ganancia & Curvas de Sensibilidad

El simulador te permite responder la pregunta: *"¿Qué precio debería poner para ganar la mayor cantidad de dinero a fin de mes sin asustar a los clientes?"*

```
              Curva de Sensibilidad (Ganancia Total vs Precio)
  Ganancia ($)
       ▲                     [Pico Óptimo]
       │                          ★
       │                     /          \
       │         [Promo]    /            \    [Premium]
       │            •      /              \      •
       │           /      /                \    /
       │ [Costo]  /      /                  \  /
       │    •    /      /                    \/
       └────┴───┴──────┴──────────────────────┴───────► Precio ($)
```

### Los 5 Hitos Estratégicos de Precio:
1. **Punto de Equilibrio ($CU):** Venta a costo estricto. Ganancia = $0. Solo se usa para donaciones o descartes.
2. **Precio Económico / Promoción ($CU + 30%):** Ideal para ventas al por mayor, revendedores, combos de feria o eventos familiares de gran volumen.
3. **Precio Competitivo Recomendado ($CU + 60%):** El precio justo y sostenible para venta directa al público en mostrador.
4. **Precio Premium / Alta Gama ($CU + 120%):** Para clientes corporativos, empaques para regalo, materias primas importadas o temporadas festivas (Navidad, Pascua).
5. **Precio Óptimo de Ganancia:** La cima matemática de la parábola calculada por el simulador. Considera que si subes el precio ganas más por unidad, pero vendes menos cantidad. En este punto la **Ganancia Total Neta (Margen $\times$ Volumen Estimado)** alcanza su valor máximo.

---

## 9. Módulo 5: Ajustes del Taller & Copias de Seguridad

Al tocar el icono de engranaje (**⚙️ Ajustes**) puedes configurar los parámetros globales del taller:
1. **Valor Hora de Mano de Obra ($):** Tu salario por hora deseado (ej. $20.000/h).
2. **Margen por Defecto (%):** Porcentaje sugerido para nuevas recetas (ej. 60%).
3. **Porcentaje de Servicios (%):** Gas, luz y amortización (ej. 10%).
4. **Copias de Seguridad (Backups JSON):**
   * **Descargar Copia:** Guarda en tu computadora o teléfono un archivo `panaderia_backup.json` con todos tus insumos, recetas y sesiones.
   * **Restaurar Copia:** Te permite subir un archivo previo para recuperar tu base de datos si alguna vez cambias de servidor.
   * **Sincronización Permanente:** Conectado a la nube mediante PostgreSQL en Neon.tech, lo que garantiza que nunca se pierdan tus datos ante reinicios o apagados del servidor.

---

## 10. Flujos de Trabajo Prácticos del Día a Día

### 🛒 Caso A: Fuiste al supermercado y compraste insumos nuevos
1. Entra a **Insumos & Packaging**.
2. Si es un producto nuevo, toca **"+ Nuevo Insumo"**, coloca cuánto pagaste y cuántos kilos/litros/unidades contiene el paquete.
3. Si es un producto que ya tenías y aumentó (ej. la manteca pasó de $4.500 a $7.000):
   * Toca el lápiz **✏️ Editar** sobre la manteca.
   * Cambia el precio a `$7.000`.
   * Toca **Guardar**. ¡Listo! Todas las recetas que lleven manteca se actualizaron solas.

### 🎂 Caso B: Quieres cotizar un producto nuevo (ej. Tarta de Manzana)
1. Entra a **Recetas & Costos** $\rightarrow$ **"+ Nueva Receta"**.
2. Escribe el rendimiento (ej. 1 tarta grande) y cuántos minutos te lleva elaborarla (ej. 40 minutos).
3. Agrega los ingredientes: 300g harina, 150g manteca, 3 manzanas, 100g azúcar, 1 base dorada y 1 caja.
4. Mira el pie de página: el sistema te dirá el costo exacto y el precio sugerido de venta.

### 👩‍🍳 Caso C: Terminaste una jornada de horneado y quieres registrarla
1. Entra a **Mano de Obra & Horas** $\rightarrow$ **"Registrar Sesión de Trabajo"**.
2. Pon cuántas horas trabajaste en total (ej. 2.5 hs).
3. Selecciona qué productos salieron del horno y cuántas unidades obtuviste.
4. Toca **Guardar**. Verás exactamente cuánto te costó cada unidad producida en esa hornada específica.
