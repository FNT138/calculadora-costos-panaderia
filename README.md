# 🥖 Panadería Costos - Sistema de Costeo, Stock y Maximización de Precios

Aplicación web integral y adaptable a escritorio, tablet y celular, diseñada para que pasteleros y panaderos artesanales calculen con exactitud sus costos de producción (**Modelo A: Escandallo Puro + Mano de Obra Prorrateada desde Stock**), armen sus presentaciones comerciales con múltiples elementos de packaging y generen su Carta Oficial de Precios con redondeo comercial al millar (`$1.000`).

![Vista Principal de Recetas y Escandallo Puro](./docs/screenshots/01_recetas_catalogo.png)

---

## 💡 Cómo funciona el Circuito Completo (Modelo A + Opción 1)

### 1. Recetas & Costos (Escandallo Puro)
- Calcula el costo unitario puro de **Ingredientes + Packaging en receta + Gas/Luz/Horno**, sin inflar el precio base de porciones chicas.
- Muestra además cuánto representa la **Mano de Obra Prorrateada desde tu Stock** para cada unidad.

![Modal de Escandallo Detallado](./docs/screenshots/01b_modal_escandallo_receta.png)

### 2. Mano de Obra & Horas (Carga de Stock y Prorrateo Real)
- Cuando terminas tu jornada de cocina, registras las horas totales trabajadas y todas las unidades horneadas.
- El sistema distribuye tu sueldo por hora entre todo el stock producido y emite un **Informe Financiero A4 Imprimible**.

![Mano de Obra y Sesiones de Producción](./docs/screenshots/06_mano_obra_sesiones.png)

### 3. Ventas & Packs (Multi-Packaging y Redondeo al Millar)
- Armas tus bandejas, cajas y combos sumando **múltiples insumos de packaging** (bandeja, bolsa, papel manteca, sticker).
- Cada producto incorpora automáticamente su **Costo Puro + Tu Mano de Obra Prorrateada del Stock**.
- El precio final se **redondea hacia arriba al múltiplo de \$1.000 más cercano** (ej. \$29.654,30 $\rightarrow$ **\$30.000 / \$30 mil**) para cobrar redondo y sin problemas de cambio chico.

![Catálogo de Ventas y Packs](./docs/screenshots/02_ventas_packs_catalogo.png)

![Modal de Armado de Pack con Múltiple Packaging](./docs/screenshots/03_modal_armado_pack_multipackaging.png)

![Carta Oficial de Precios Imprimible](./docs/screenshots/04_carta_precios_impresion.png)

### 4. Insumos & Packaging (Efecto Cascada)
- Conversión automática de **Kilos a Gramos**, **Litros a Mililitros** y **Packs a Unidades** con porcentaje de merma.
- Al actualizar el precio de un insumo, se recalculan en cascada todas las recetas y todas las presentaciones de venta.

![Catálogo de Insumos y Materias Primas](./docs/screenshots/05_insumos_materias_primas.png)

### 5. Simulador Estratégico de Ganancias
- Curva interactiva de sensibilidad precio-demanda con deslizador de margen objetivo y simulación de valor hora.

![Simulador de Ganancia y Curva de Sensibilidad](./docs/screenshots/07_simulador_curva_ganancia.png)

---

## 📚 Documentación Completa

- **[Manual de Usuario Integral (con capturas paso a paso)](./docs/MANUAL_DE_USUARIO.md)**
- [Guía de Despliegue en Render](./docs/GUIA_DEPLOY_RENDER.md)
- [Guía de Hosting Local y Red Wi-Fi](./docs/GUIA_HOSTING_LOCAL.md)
