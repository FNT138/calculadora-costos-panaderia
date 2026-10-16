BEGIN TRANSACTION;
CREATE TABLE configuraciones (
	clave VARCHAR(80) NOT NULL, 
	valor VARCHAR(255) NOT NULL, 
	descripcion VARCHAR(255), 
	PRIMARY KEY (clave)
);
INSERT INTO "configuraciones" VALUES('costo_hora_defecto','20000.0','Valor hora de trabajo deseado en ARS');
INSERT INTO "configuraciones" VALUES('margen_defecto','60.0','Margen de ganancia objetivo por defecto (%)');
INSERT INTO "configuraciones" VALUES('porcentaje_servicios_defecto','10.0','Porcentaje para gas, luz y desgaste (%)');
CREATE TABLE insumos (
	id INTEGER NOT NULL, 
	nombre VARCHAR(150) NOT NULL, 
	categoria VARCHAR(50) NOT NULL, 
	unidad_compra VARCHAR(30) NOT NULL, 
	cantidad_compra FLOAT NOT NULL, 
	precio_compra FLOAT NOT NULL, 
	merma_porcentaje FLOAT NOT NULL, 
	unidad_base VARCHAR(20) NOT NULL, 
	costo_por_unidad_base FLOAT NOT NULL, 
	notas TEXT, 
	fecha_actualizacion DATETIME, 
	PRIMARY KEY (id)
);
INSERT INTO "insumos" VALUES(1,'Harina 0000','ingrediente','kg',1.0,1800.0,1.0,'g',1.8182,NULL,'2026-10-15 23:48:53.257736');
INSERT INTO "insumos" VALUES(2,'Harina 000','ingrediente','kg',1.0,1500.0,1.0,'g',1.5152,NULL,'2026-10-15 23:48:53.260781');
INSERT INTO "insumos" VALUES(3,'Azúcar Común','ingrediente','kg',1.0,1200.0,0.0,'g',1.2,NULL,'2026-10-15 23:48:53.261381');
INSERT INTO "insumos" VALUES(4,'Manteca','ingrediente','g',500.0,4500.0,0.0,'g',9.0,NULL,'2026-10-15 23:48:53.262182');
INSERT INTO "insumos" VALUES(5,'Dulce de Leche Repostero','ingrediente','kg',5.0,19500.0,2.0,'g',3.9796,NULL,'2026-10-15 23:48:53.262717');
INSERT INTO "insumos" VALUES(6,'Huevos (Maple 30u)','ingrediente','pack',30.0,6000.0,0.0,'unidad',200.0,NULL,'2026-10-15 23:48:53.263216');
INSERT INTO "insumos" VALUES(7,'Levadura Fresca','ingrediente','g',500.0,2500.0,3.0,'g',5.1546,NULL,'2026-10-15 23:48:53.264424');
INSERT INTO "insumos" VALUES(8,'Leche Entera','ingrediente','litro',1.0,1400.0,0.0,'ml',1.4,NULL,'2026-10-15 23:48:53.264955');
INSERT INTO "insumos" VALUES(10,'Coco Rallado','ingrediente','g',500.0,4000.0,2.0,'g',8.1633,NULL,'2026-10-15 23:48:53.265963');
INSERT INTO "insumos" VALUES(11,'Esencia de Vainilla','ingrediente','ml',100.0,1500.0,0.0,'ml',15.0,NULL,'2026-10-15 23:48:53.266531');
INSERT INTO "insumos" VALUES(12,'Sal Fina','ingrediente','g',500.0,600.0,0.0,'g',1.2,NULL,'2026-10-15 23:48:53.267001');
INSERT INTO "insumos" VALUES(13,'Azúcar Impalpable','ingrediente','kg',1.0,2200.0,1.0,'g',2.2222,NULL,'2026-10-15 23:48:53.267473');
INSERT INTO "insumos" VALUES(14,'Chocolate Cobertura Semiamargo','ingrediente','kg',1.0,9500.0,2.0,'g',9.6939,NULL,'2026-10-15 23:48:53.267942');
INSERT INTO "insumos" VALUES(15,'Bolsitas Polipropileno Cristal (15x25)','packaging','pack',100.0,2800.0,0.0,'unidad',28.0,NULL,'2026-10-15 23:48:53.268386');
INSERT INTO "insumos" VALUES(16,'Bandejitas de Cartón Pasteleras N°3','packaging','pack',50.0,6500.0,0.0,'unidad',130.0,NULL,'2026-10-15 23:48:53.268852');
INSERT INTO "insumos" VALUES(17,'Cajas para Docena de Facturas','packaging','pack',25.0,11250.0,0.0,'unidad',450.0,NULL,'2026-10-15 23:48:53.269326');
INSERT INTO "insumos" VALUES(18,'Stickers / Etiquetas con Logo','packaging','pack',100.0,3500.0,0.0,'unidad',35.0,NULL,'2026-10-15 23:48:53.269796');
INSERT INTO "insumos" VALUES(19,'Papel Manteca Separador','packaging','pack',100.0,2000.0,0.0,'unidad',20.0,NULL,'2026-10-15 23:48:53.270262');
CREATE TABLE receta_ingredientes (
	id INTEGER NOT NULL, 
	receta_id INTEGER NOT NULL, 
	insumo_id INTEGER NOT NULL, 
	cantidad FLOAT NOT NULL, 
	notas VARCHAR(150), 
	PRIMARY KEY (id), 
	FOREIGN KEY(receta_id) REFERENCES recetas (id) ON DELETE CASCADE, 
	FOREIGN KEY(insumo_id) REFERENCES insumos (id) ON DELETE RESTRICT
);
CREATE TABLE recetas (
	id INTEGER NOT NULL, 
	nombre VARCHAR(150) NOT NULL, 
	categoria VARCHAR(50), 
	descripcion TEXT, 
	rendimiento_unidades FLOAT NOT NULL, 
	tiempo_preparacion_minutos FLOAT NOT NULL, 
	porcentaje_costos_indirectos FLOAT NOT NULL, 
	margen_ganancia_sugerido FLOAT NOT NULL, 
	precio_venta_fijado FLOAT, 
	fecha_creacion DATETIME, 
	fecha_actualizacion DATETIME, 
	PRIMARY KEY (id)
);
CREATE TABLE sesion_produccion_items (
	id INTEGER NOT NULL, 
	sesion_id INTEGER NOT NULL, 
	receta_id INTEGER NOT NULL, 
	unidades_producidas FLOAT NOT NULL, 
	factor_dificultad FLOAT NOT NULL, 
	costo_mano_obra_unitario FLOAT NOT NULL, 
	costo_ingredientes_unitario FLOAT NOT NULL, 
	costo_packaging_unitario FLOAT NOT NULL, 
	costo_indirectos_unitario FLOAT NOT NULL, 
	costo_total_unitario FLOAT NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(sesion_id) REFERENCES sesiones_produccion (id) ON DELETE CASCADE, 
	FOREIGN KEY(receta_id) REFERENCES recetas (id) ON DELETE RESTRICT
);
CREATE TABLE sesiones_produccion (
	id INTEGER NOT NULL, 
	fecha DATETIME, 
	titulo VARCHAR(150) NOT NULL, 
	horas_trabajadas FLOAT NOT NULL, 
	costo_hora_mano_obra FLOAT NOT NULL, 
	costo_total_mano_obra FLOAT NOT NULL, 
	notas TEXT, 
	PRIMARY KEY (id)
);
INSERT INTO "sesiones_produccion" VALUES(1,'2026-10-15 23:48:53.297524','Producción de fin de semana para ferias',3.0,20000.0,60000.0,'Hornada completa de cañoncitos y alfajorcitos. Excelente rendimiento.');
CREATE INDEX ix_insumos_nombre ON insumos (nombre);
CREATE INDEX ix_insumos_id ON insumos (id);
CREATE INDEX ix_recetas_id ON recetas (id);
CREATE INDEX ix_recetas_nombre ON recetas (nombre);
CREATE INDEX ix_sesiones_produccion_fecha ON sesiones_produccion (fecha);
CREATE INDEX ix_sesiones_produccion_id ON sesiones_produccion (id);
CREATE INDEX ix_receta_ingredientes_id ON receta_ingredientes (id);
CREATE INDEX ix_sesion_produccion_items_id ON sesion_produccion_items (id);
COMMIT;
