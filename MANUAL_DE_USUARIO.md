# 📘 Manual de Usuario Integral: Calculadora de Costos & Maximización de Precios

> **Panadería y Pastelería Artesanal**  
> *Versión 3.0 — Guía Oficial de Uso, Escandallo Puro (Modelo A), Ventas & Packs Multi-Packaging, Mano de Obra Prorrateada y Estrategia de Precios*

---

## 📑 Tabla de Contenidos
1. [Introducción & Filosofía del Sistema (Modelo A: Escandallo Puro)](#1-introducción--filosofía-del-sistema-modelo-a-escandallo-puro)
2. [Estructura de la Interfaz & Navegación General](#2-estructura-de-la-interfaz--navegación-general)
3. [Seguridad & PIN Maestro (Modo Lectura vs. Admin Activo)](#3-seguridad--pin-maestro-modo-lectura-vs-admin-activo)
4. [Módulo 1: Recetas & Costos (Escandallo Puro)](#4-módulo-1-recetas--costos-escandallo-puro)
5. [Módulo 2: Ventas & Packs (Armado de Bandejas, Multi-Packaging y Redondeo al Millar)](#5-módulo-2-ventas--packs-armado-de-bandejas-multi-packaging-y-redondeo-al-millar)
6. [Carta Oficial de Precios e Impresión A4](#6-carta-oficial-de-precios-e-impresión-a4)
7. [Módulo 3: Insumos & Packaging (Materia Prima y Mermas)](#7-módulo-3-insumos--packaging-materia-prima-y-mermas)
8. [Módulo 4: Mano de Obra & Horas (Prorrateo Real por Jornada de Horneado)](#8-módulo-4-mano-de-obra--horas-prorrateo-real-por-jornada-de-horneado)
9. [Módulo 5: Simulador de Ganancia & Curva de Sensibilidad](#9-módulo-5-simulador-de-ganancia--curva-de-sensibilidad)
10. [Módulo 6: Ajustes del Taller & Copias de Seguridad](#10-módulo-6-ajustes-del-taller--copias-de-seguridad)
11. [Flujos de Trabajo Prácticos del Día a Día](#11-flujos-de-trabajo-prácticos-del-día-a-día)

---

## 1. Introducción & Filosofía del Sistema (Modelo A: Escandallo Puro)

En una panadería o pastelería artesanal, uno de los errores más frecuentes al calcular costos es sumar el valor de la hora de trabajo directamente dentro de una receta individual cuando su rendimiento es pequeño (por ejemplo, una receta de *100g de Palmeritas* que lleva 30 minutos de preparación pero que en la práctica nunca se hornea sola, sino en tandas grandes o junto con otros productos). Si se cargara la hora completa a un solo paquete, el costo unitario quedaría artificialmente inflado.

Para resolver esto con precisión gastronómica profesional, el sistema implementa el **Modelo A (Escandallo Puro + Mano de Obra por Jornada)**:

1. **En Recetas & Costos (Escandallo Puro):** Cada receta calcula estrictamente el costo de sus **Ingredientes + Packaging de Receta + Costos Indirectos (Gas, Luz, Horno)**. El tiempo de preparación en minutos se registra únicamente como **dato técnico de referencia**, sin inflar el precio base del producto.
2. **En Ventas & Packs (Presentaciones Comerciales):** Tomas los productos al costo de escandallo puro, armas tus bandejas, cajas o combos surtidos, sumas **todos los elementos de packaging** que lleva la presentación (bandeja, bolsa, papel manteca, sticker, cinta) y el sistema calcula el precio final al público **redondeado automáticamente hacia arriba al múltiplo de \$1.000 más cercano** para eliminar el problema del cambio chico.
3. **En Mano de Obra & Horas (Jornadas de Producción):** Cuando terminas una mañana o tarde de horneado donde hiciste múltiples productos al mismo tiempo, registras las horas totales trabajadas y el sistema **prorratea tu sueldo real** entre todo el volumen producido en esa jornada.

---

## 2. Estructura de la Interfaz & Navegación General

La aplicación cuenta con una barra superior unificada y adaptable a computadoras de escritorio, tablets y teléfonos móviles:

![Catálogo Principal de Recetas y Barra de Navegación](docs/screenshots/01_recetas_catalogo.png)

### Elementos de la Barra Superior
* **Recetas & Costos:** Catálogo de productos elaborados, tarjetas de escandallo puro y constructor de recetas.
* **Ventas & Packs:** Armado de presentaciones comerciales (bandejas, docenas, combos degustación), asignación de múltiples packagings y generación de la **Carta Oficial de Precios**.
* **Insumos & Packaging:** Inventario de materias primas y materiales descartables con conversión automática de unidades y porcentaje de merma.
* **Mano de Obra & Horas:** Registro de sesiones de horneado para distribuir el sueldo del pastelero según el volumen real producido y publicar Informes de Producción A4.
* **Simulador de Ganancia:** Curva interactiva de elasticidad precio-demanda y simulador de costos con u omitiendo mano de obra.
* **Indicador de Seguridad (`Admin Activo` / `Solo Lectura`):** Controla el bloqueo de edición mediante PIN Maestro.
* **Ajustes (`⚙️`):** Configuración global del valor hora de referencia, márgenes por defecto y copias de seguridad JSON.

---

## 3. Seguridad & PIN Maestro (Modo Lectura vs. Admin Activo)

El sistema incorpora protección por **PIN Maestro** para que puedas compartir el enlace web o mostrar la pantalla a empleados y clientes sin riesgo de que modifiquen precios o fórmulas por accidente.

![Modal de Seguridad con Teclado Numérico para PIN Maestro](docs/screenshots/09_seguridad_pin_modal.png)

### Modos de Operación
* **🔒 Modo Solo Lectura:** Permite navegar todas las pestañas, consultar el desglose de recetas, abrir la Carta de Precios y usar el Simulador, pero bloquea cualquier intento de crear, editar o borrar registros.
* **🔓 Modo Admin Activo:** Al ingresar el PIN Maestro (`1234` por defecto), se habilitan todos los botones de creación, edición y ajuste de precios durante 30 días en tu dispositivo. Puedes volver a bloquear la sesión en cualquier momento haciendo clic sobre el botón verde **Admin Activo**.

---

## 4. Módulo 1: Recetas & Costos (Escandallo Puro)

En esta pestaña se registran las fórmulas maestras de tus productos. Bajo el **Modelo A (Escandallo Puro)**, cada tarjeta refleja el costo físico real de producir una unidad o porción estándar.

![Modal de Escandallo Puro Detallado de una Receta](docs/screenshots/01b_modal_escandallo_receta.png)

### Composición del Costo en el Escandallo Puro

| Componente | Fórmula / Descripción | Ejemplo (*Alfajorcitos de Maicena - Tanda de 15 u.*) |
| :--- | :--- | :--- |
| **1. Materia Prima (MP)** | Suma exacta de cada ingrediente y descartable incluido en la receta según su costo por gramo/ml/unidad (con merma). | \$8.978,77 por tanda (**\$598,58 / u.**) |
| **2. Costos Indirectos (CIF)** | Porcentaje (ej. `10%`) aplicado sobre la Materia Prima para cubrir gas de horno, electricidad, agua y desgaste de utensilios. | \$897,88 por tanda (**\$59,86 / u.**) |
| **3. Mano de Obra en Receta** | **\$0,00 (Escandallo Puro)**. El tiempo (`40 min`) queda guardado como ficha técnica para las sesiones de horneado. | **\$0,00 / u.** *(Prorrateado en Mano de Obra)* |
| **Costo Unitario Puro ($CU$)** | $\text{MP Unitaria} + \text{CIF Unitario}$ | **\$658,44 / u.** |
| **Precio Sugerido Base** | $\text{Costo Unitario Puro} \times \left(1 + \frac{\text{Margen \%}}{100}\right)$ | **\$1.053,51 / u.** *(con 60% de margen)* |

> [!TIP]
> **Ventaja del Escandallo Puro:** Productos como los *100g de Palmeritas de Hojaldre* muestran su costo real de ingredientes y horno (**\$1.528,77**) y un precio sugerido competitivo (**\$2.446,03**), evitando que media hora de preparación encarezca artificialmente un paquete individual.

---

## 5. Módulo 2: Ventas & Packs (Armado de Bandejas, Multi-Packaging y Redondeo al Millar)

El menú **Ventas & Packs** conecta tus recetas con el mostrador. Aquí defines cómo vendes realmente tus productos al público (por ejemplo: *Bandeja x6 Alfajores de Maicena*, *Pack 200g Palmeritas*, *Caja Degustación Dulce* o *Docena de Cañoncitos*).

![Catálogo de Ventas & Packs con Precios Redondeados al Millar](docs/screenshots/02_ventas_packs_catalogo.png)

### Armado de una Presentación con Múltiples Packagings

Al hacer clic en **"+ Nueva Presentación / Pack"** o editar un pack existente, se abre el constructor comercial dividido en tres secciones:

![Modal de Armado de Pack con Múltiples Filas de Packaging](docs/screenshots/03_modal_armado_pack_multipackaging.png)

1. **Productos que integran la presentación (`+ Agregar Producto`):**
   * Puedes combinar una o varias recetas dentro del mismo pack (ej. `6x Alfajorcitos de Maicena`, o un combo con `2x Alfajores + 1x Cañoncito + 1x Palmeritas`).
   * El sistema multiplica automáticamente la cantidad por el **Costo Unitario Puro** de cada receta.
2. **Packaging y Descartables del Pack (`+ Agregar Packaging`):**
   * Permite sumar **todos los elementos de empaque** que lleva esa presentación específica:
     * *Ejemplo:* `1 u.` de **Caja Cartulina / Bandeja** + `1 u.` de **Papel Manteca / Film** + `2 u.` de **Sticker Cierre Marca**.
   * Cada ítem descuenta y calcula su costo unitario exacto desde el catálogo de Insumos.
3. **Cálculo de Precio y Redondeo Comercial Inteligente al Millar Superior:**
   * A la suma de **Costo Productos + Costo Packagings** se le aplica el **Margen de Ganancia (%)** elegido.
   * Si el **Redondeo Comercial al Millar (`$1.000`)** está activo, cualquier precio con decimales o cientos se redondea hacia arriba al próximo múltiplo de \$1.000:
     $$\text{Precio Final Redondeado} = \lceil \text{Precio Sugerido Exacto} \div 1000 \rceil \times 1000$$
   * **Ejemplos reales:**
     * Si el cálculo exacto da **\$29.654,30**, el sistema fija **\$30.000** (*\$30 mil*).
     * Si el cálculo exacto da **\$23.654,30**, el sistema fija **\$24.000** (*\$24 mil*).
     * Si la bandeja de 6 alfajores sugiere **\$7.129,03**, redondea a **\$8.000** (*\$8 mil*).

> [!IMPORTANT]
> **Sin problemas de cambio:** El redondeo al millar superior garantiza que nunca pierdas margen por redondear hacia abajo y que puedas cobrar rápidamente en efectivo sin necesitar billetes de baja denominación ni monedas.

---

## 6. Carta Oficial de Precios e Impresión A4

Dentro de **Ventas & Packs**, el botón **"Generar Carta de Precios"** abre la vista previa oficial lista para imprimir en hoja A4, guardar como PDF o enviar por WhatsApp a tus clientes:

![Carta Oficial de Precios Lista para Imprimir o Guardar en PDF](docs/screenshots/04_carta_precios_impresion.png)

### Funciones de la Carta de Precios
* **Selector de Formato de Moneda:**
  * **Formato Miles (`$30 mil`):** Ideal para pizarras modernas y listas rápidas por WhatsApp.
  * **Formato Pesos (`$30.000`):** Formato contable tradicional con numeración completa.
* **Detalle Transparente para el Cliente:** Muestra el nombre de la presentación, el listado exacto de unidades que contiene y su precio final redondo.
* **Impresión A4 Optimizada:** Al pulsar **"Imprimir / Guardar PDF"**, el sistema oculta automáticamente toda la interfaz de administración y genera una única hoja limpia sin cortes ni páginas duplicadas.

---

## 7. Módulo 3: Insumos & Packaging (Materia Prima y Mermas)

En **Insumos & Packaging** administras los precios de tus compras en supermercados, mayoristas o papeleras. Cuando actualizas el precio de un paquete aquí, **todas las recetas y todos los packs de venta se recalculan automáticamente en cascada**.

![Catálogo de Insumos y Packaging con Conversión Automática](docs/screenshots/05_insumos_materias_primas.png)

### Conversión Automática y Factor de Merma
* **Compras por Kilo o Litro (`kg` / `l`):** El sistema divide automáticamente por `1.000` para obtener el costo exacto por **gramo (`g`)** o **mililitro (`ml`)**.
* **Compras por Pack o Docena (`pack` / `docena`):** Calcula el costo por **unidad (`u`)** según las unidades que trae el bulto (ej. paquete de 100 bolsitas o plancha de 50 stickers).
* **Porcentaje de Merma (`%`):** Compensa el desperdicio inevitable (lo que queda adherido al bowl, mangas pasteleras, cáscaras o evaporación).
  $$\text{Costo Real por Unidad Base} = \frac{\text{Precio del Paquete}}{\text{Unidades del Paquete}} \times \frac{1}{1 - \frac{\text{Merma \%}}{100}}$$

---

## 8. Módulo 4: Mano de Obra & Horas (Prorrateo Real por Jornada de Horneado)

Dado que las recetas utilizan **Escandallo Puro**, tu salario como pastelero o panadero se controla y analiza en **Mano de Obra & Horas**. Aquí registras lo que realmente ocurrió en tu cocina durante una sesión de trabajo (por ejemplo, *"Producción Sábado Mañana — 4,5 horas"*).

![Módulo de Mano de Obra y Sesiones de Producción con Prorrateo](docs/screenshots/06_mano_obra_sesiones.png)

### ¿Cómo funciona el Informe Financiero de una Jornada?
1. Indicas cuántas **Horas Totales** duró la jornada (ej. `4,5 hs`) y tu **Valor Hora** (ej. `$20.000/h`), lo que determina la **Retribución Total de Mano de Obra** de esa sesión (`$90.000`).
2. Cargas todas las unidades que salieron del horno en ese tiempo (ej. *24 Cañoncitos, 30 Alfajorcitos, 4 paquetes de Palmeritas, 6 Bizcochitos*) junto con su **Factor de Dificultad** (`1x` estándar, `1.5x` hojaldre/complejo, `2x` alta decoración).
3. El sistema distribuye proporcionalmente las horas trabajadas entre cada lote y te muestra tres indicadores clave en el **Informe de Producción Imprimible**:
   * **Venta Total Estimada:** Todo el dinero que ingresa al vender la producción del día.
   * **Tu Sueldo de Elaboración (Mano de Obra):** El pago que te corresponde a ti como trabajador por las horas de cocina dedicadas.
   * **Ganancia Neta del Negocio:** El excedente libre que queda para el emprendimiento después de reponer todos los insumos, cubrir el gas/luz y haberte pagado tu sueldo completo por hora.

---

## 9. Módulo 5: Simulador de Ganancia & Curva de Sensibilidad

El **Simulador Estratégico** permite proyectar cómo varía tu ganancia mensual según el precio al que decidas vender un producto y cuántas unidades estimes vender por mes.

![Simulador Estratégico con Curva de Maximización de Beneficios](docs/screenshots/07_simulador_curva_ganancia.png)

### Controles Interactivos del Simulador
* **Modo Escandallo Puro vs. Valor Hora Simulado:** Por defecto, el deslizador de *Valor Hora de Mano de Obra* inicia en **`$0 / hora (Escandallo Puro)`**, alineado con el Modelo A. Si deseas simular cuánto impactaría agregar un costo de mano de obra directo dentro de un producto específico, puedes deslizar el control entre `$0` y `$50.000/h` en tiempo real.
* **Hitos de Precio en la Curva:**
  * **Costo Puro (Equilibrio):** El piso debajo del cual pierdes dinero en materiales.
  * **Precio Promo (+30%):** Ideal para ventas mayoristas o revendedores.
  * **Precio Sugerido (+60%):** Punto recomendado para mostrador.
  * **Precio Óptimo (Pico de la Curva):** El precio matemático donde se maximiza la recaudación total considerando la caída natural de ventas cuando el precio sube demasiado.

---

## 10. Módulo 6: Ajustes del Taller & Copias de Seguridad

Al hacer clic en el botón **Ajustes (`⚙️`)** en la esquina superior derecha, accedes a la configuración general del sistema:

![Modal de Ajustes del Taller y Copias de Seguridad](docs/screenshots/08_ajustes_taller_config.png)

* **Parámetros Globales:** Define el Valor Hora de referencia para nuevas sesiones de producción, el Margen de Ganancia sugerido por defecto (`60%`) y el porcentaje de Costos Indirectos (`10%`).
* **Exportar e Importar Base de Datos (`JSON`):** Descarga en un clic un respaldo completo de tus insumos, recetas, presentaciones de venta y sesiones de horneado, o restaura una copia previa en cualquier momento.

---

## 11. Flujos de Trabajo Prácticos del Día a Día

### Flujo 1: Aumentó la manteca o el dulce de leche en el mayorista
1. Activa el modo administrador con tu PIN (`1234`).
2. Entra a **Insumos & Packaging**, busca el insumo y toca el botón de editar (`✏️`).
3. Ingresa el nuevo precio del paquete y guarda.
4. Ve a **Ventas & Packs**: verás que los costos de tus bandejas se actualizaron solos y, si algún producto superó el umbral de rentabilidad, su **Precio Redondeado al Millar** se habrá ajustado automáticamente para proteger tu ganancia.

### Flujo 2: Quieres armar una nueva bandeja o caja surtida para una fecha especial
1. Entra a **Ventas & Packs** y pulsa **"+ Nueva Presentación / Pack"**.
2. Escribe el nombre (ej. *"Bandeja Merienda Compartida"*).
3. En **Productos**, agrega las unidades de cada receta que irán dentro (ej. `4x Alfajorcitos`, `2x Cañoncitos`, `1x Palmeritas 100g`).
4. En **Packaging**, agrega todos los descartables que usarás (`1x Bandeja Cartón`, `1x Bolsita Celofán`, `1x Sticker Marca`).
5. Revisa el **Precio Final Redondeado** (múltiplo de \$1.000), guarda el pack y abre **"Generar Carta de Precios"** para imprimir tu lista actualizada.
