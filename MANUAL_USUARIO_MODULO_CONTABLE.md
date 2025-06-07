# Manual de Usuario - Módulo Contable ERP MisCausas

## Introducción

El Módulo Contable de ERP MisCausas está diseñado específicamente para estudios jurídicos chilenos, cumpliendo con los requerimientos contables y tributarios del país. Este manual te guiará paso a paso para utilizar todas las funcionalidades del sistema.

## ¿Para qué sirve el Módulo Contable?

El módulo contable permite:
- **Llevar la contabilidad completa del estudio jurídico**
- **Generar Cuentas Provisorias** para causas judiciales (requerimiento de tribunales)
- **Controlar gastos e ingresos** por causa legal
- **Generar reportes financieros** para la administración
- **Cumplir con obligaciones tributarias** automáticamente

---

## Roles de Usuario

### Para Abogados
- Consultar gastos de sus causas
- Ver resúmenes financieros de casos
- Descargar Cuentas Provisorias generadas

### Para Administradores Contables
- Gestionar el Plan de Cuentas
- Ingresar todos los movimientos contables
- Generar reportes financieros
- Crear y descargar Cuentas Provisorias masivamente

---

## Guía Paso a Paso

### 1. Gestión del Plan de Cuentas

#### ¿Qué es el Plan de Cuentas?
Es la estructura organizacional de todas las cuentas contables del estudio. Está preconfigurado según el marco contable chileno.

#### Crear una Nueva Cuenta

1. **Acceder al módulo**:
   - Hacer clic en "Contabilidad" en el menú principal
   - Seleccionar pestaña "Plan de Cuentas"

2. **Agregar cuenta**:
   - Clic en botón "Agregar Cuenta"
   - Completar información requerida:
     - **Código**: Número único (ej: 1101, 2201)
     - **Nombre**: Descripción clara (ej: "Caja Chica", "Honorarios por Cobrar")
     - **Tipo**: Seleccionar categoría apropiada
     - **Cuenta Padre**: Si es subcuenta, elegir cuenta superior

3. **Tipos de cuenta disponibles**:
   - **Activo**: Bienes y derechos (caja, banco, equipos)
   - **Pasivo**: Obligaciones y deudas (préstamos, cuentas por pagar)
   - **Patrimonio**: Capital del estudio
   - **Ingresos**: Honorarios, otros ingresos
   - **Gastos**: Todos los gastos operacionales

#### Modificar Cuentas Existentes
- Hacer clic en el ícono de edición junto a la cuenta
- Modificar solo los campos permitidos
- **Importante**: No cambiar códigos de cuentas que ya tienen movimientos

### 2. Ingreso de Vouchers (Comprobantes Contables)

#### ¿Qué son los Vouchers?
Son los comprobantes que registran cada operación contable del estudio (ingresos, gastos, transferencias).

#### Crear un Nuevo Voucher

1. **Acceder a vouchers**:
   - En "Contabilidad" → pestaña "Vouchers"
   - Clic en "Nuevo Voucher"

2. **Información del voucher**:
   - **Fecha**: Fecha de la operación
   - **Descripción**: Detalle claro de la operación
   - **Referencia**: Número de factura, boleta, etc.
   - **Causa Legal**: Seleccionar si corresponde a un caso específico

3. **Agregar líneas contables**:
   - Cada voucher debe tener al menos 2 líneas
   - **Debe balancear**: Total Débitos = Total Créditos
   
   Para cada línea:
   - **Cuenta**: Seleccionar del Plan de Cuentas
   - **Descripción**: Detalle específico
   - **Débito** o **Crédito**: Ingresar monto
   - **Centro de Costo**: Causa legal si aplica

#### Ejemplos de Vouchers Comunes

**Ejemplo 1: Pago de honorarios a abogado externo**
```
Línea 1: Gastos Honorarios Externos    $500.000 (Débito)
Línea 2: Banco Estado                   $500.000 (Crédito)
```

**Ejemplo 2: Cobro de honorarios a cliente**
```
Línea 1: Banco Estado                   $1.200.000 (Débito)
Línea 2: Ingresos por Honorarios       $1.200.000 (Crédito)
```

**Ejemplo 3: Gasto en fotocopias para causa**
```
Línea 1: Gastos Operacionales Causa    $15.000 (Débito)
Línea 2: Caja Chica                     $15.000 (Crédito)
```

#### Validaciones Automáticas
- El sistema verifica que débitos = créditos
- No permite vouchers sin líneas
- Valida que las cuentas existan
- Genera numeración automática

### 3. Generación de Cuenta Provisoria

#### ¿Qué es la Cuenta Provisoria?
Es un reporte oficial requerido por los tribunales chilenos que muestra todos los ingresos y gastos de una causa judicial específica.

#### Generar Cuenta Provisoria Individual

1. **Seleccionar causa**:
   - En "Contabilidad" → pestaña "Cuenta Provisoria"
   - Seleccionar la causa legal del listado

2. **Configurar período**:
   - **Año**: Año de la cuenta
   - **Mes**: Mes específico o "Todos" para el año completo
   - **Estado**: Borrador/Aprobado/Presentado

3. **Generar PDF**:
   - Clic en "Generar Cuenta Provisoria"
   - El sistema creará automáticamente el PDF
   - **Nombre del archivo**: `ROL_NombreDeudor_Mes_Año.pdf`

4. **Contenido del PDF**:
   - Información del tribunal y causa
   - Detalle de todos los ingresos
   - Detalle de todos los gastos
   - Saldo final de la cuenta
   - Fecha de generación y firma digital

#### Validar Cuenta Provisoria
- Revisar que todos los montos sean correctos
- Verificar que la información del deudor sea exacta
- Confirmar que el período sea el solicitado
- Cambiar estado a "Aprobado" cuando esté lista

### 4. Descarga Masiva de Cuentas Provisorias

#### ¿Cuándo usar esta función?
- Al final de cada mes para envío masivo a tribunales
- Para backup de todas las cuentas del período
- Para auditorías o revisiones internas

#### Proceso de Descarga Masiva

1. **Seleccionar período**:
   - Ir a "Cuenta Provisoria" → "Descarga Masiva"
   - Elegir año y mes específico
   - Filtrar por estado si es necesario

2. **Seleccionar causas**:
   - El sistema mostrará todas las causas con movimientos
   - Marcar las causas a incluir (o "Seleccionar Todas")
   - Verificar que no falten causas importantes

3. **Generar archivo ZIP**:
   - Clic en "Generar ZIP"
   - El sistema creará un archivo comprimido
   - **Nombre del ZIP**: `CuentasProvisoria_Mes_Año.zip`

4. **Contenido del ZIP**:
   - Un PDF por cada causa seleccionada
   - Nombres estandarizados para fácil identificación
   - Archivo de resumen con lista de contenidos

#### Tiempo de Procesamiento
- **1-5 causas**: 30 segundos
- **6-20 causas**: 1-3 minutos
- **20+ causas**: 3-10 minutos

### 5. Interpretación de Reportes

#### Libro Mayor
**¿Qué muestra?**
- Todos los movimientos de una cuenta específica
- Saldos acumulados por período
- Detalle de débitos y créditos

**Cómo interpretarlo:**
- **Saldo Inicial**: Lo que tenía la cuenta al inicio
- **Movimientos**: Todas las operaciones del período
- **Saldo Final**: Resultado después de todos los movimientos

#### Estado de Resultados
**¿Qué muestra?**
- Ingresos del período (honorarios, otros ingresos)
- Gastos del período (operacionales, administrativos)
- Resultado neto (ganancia o pérdida)

**Cómo interpretarlo:**
- **Ingresos > Gastos**: El estudio tuvo ganancia
- **Gastos > Ingresos**: El estudio tuvo pérdida
- **Margen**: Porcentaje de ganancia sobre ingresos

#### Cuenta Provisoria
**¿Qué muestra?**
- Ingresos específicos de la causa (honorarios recibidos)
- Gastos específicos de la causa (todos los costos)
- Saldo disponible para el cliente
- Movimientos ordenados cronológicamente

**Elementos importantes:**
- **Saldo positivo**: Hay fondos disponibles para gastos
- **Saldo negativo**: Se han gastado más fondos de los disponibles
- **Fecha límite**: Cuándo debe presentarse al tribunal

---

## Mejores Prácticas y Consejos

### Para el Plan de Cuentas
- **No eliminar cuentas** que ya tienen movimientos
- **Usar códigos numéricos** consistentes y ordenados
- **Crear subcuentas** para mayor detalle cuando sea necesario
- **Revisar mensualmente** si se necesitan nuevas cuentas

### Para Vouchers
- **Descripción clara**: Siempre explicar qué representa el movimiento
- **Documentación**: Guardar respaldos físicos o digitales
- **Revisión diaria**: Ingresar movimientos el mismo día que ocurren
- **Verificar balances**: Confirmar que débitos = créditos antes de guardar

### Para Cuentas Provisorias
- **Generar mensualmente**: No esperar al final del año
- **Validar información**: Revisar datos del deudor y tribunal
- **Respaldar archivos**: Guardar copias de todos los PDFs generados
- **Fechas límite**: Conocer cuándo deben presentarse al tribunal

### Controles de Calidad
- **Revisión semanal** de todos los vouchers ingresados
- **Conciliación mensual** de cuentas bancarias
- **Validación trimestral** de saldos con documentación externa
- **Backup diario** de la información contable

### Errores Comunes a Evitar
- **No balancear vouchers** (débitos ≠ créditos)
- **Usar cuentas incorrectas** para el tipo de operación
- **Olvidar asignar causa** cuando corresponde
- **No verificar información** antes de generar Cuentas Provisorias
- **Perder documentación** de respaldo

---

## Funciones Avanzadas

### Filtros y Búsquedas
- Filtrar vouchers por fecha, causa, o monto
- Buscar movimientos por descripción
- Exportar reportes a Excel para análisis adicional

### Auditoría y Trazabilidad
- El sistema registra quién hizo cada movimiento
- Historial completo de modificaciones
- No permite eliminar vouchers, solo anularlos

### Integración con Causas
- Cada movimiento puede asociarse a una causa específica
- Reportes automáticos por causa
- Control de costos por caso legal

---

## Soporte y Ayuda

### Contactos de Soporte
- **Soporte Técnico**: Para problemas del sistema
- **Soporte Contable**: Para dudas sobre el uso contable
- **Administrador**: Para permisos y configuraciones

### Documentación Adicional
- Manual técnico para administradores
- Guía de configuración inicial
- Preguntas frecuentes (FAQ)

### Horarios de Atención
- **Soporte en línea**: Lunes a Viernes, 9:00 - 18:00
- **Soporte telefónico**: Lunes a Viernes, 9:00 - 17:00
- **Emergencias**: 24/7 para problemas críticos

---

## Anexos

### Códigos de Cuenta Recomendados
```
1000 - ACTIVOS
  1100 - Activo Corriente
    1101 - Caja
    1102 - Banco Estado
    1103 - Banco Chile
    1150 - Cuentas por Cobrar Clientes
  1200 - Activo Fijo
    1201 - Equipos de Oficina
    1202 - Muebles y Enseres

2000 - PASIVOS
  2100 - Pasivo Corriente
    2101 - Cuentas por Pagar Proveedores
    2102 - IVA por Pagar
  2200 - Pasivo No Corriente
    2201 - Préstamos Bancarios

3000 - PATRIMONIO
  3101 - Capital
  3102 - Utilidades Retenidas

4000 - INGRESOS
  4101 - Honorarios Profesionales
  4102 - Otros Ingresos

5000 - GASTOS
  5101 - Sueldos y Salarios
  5102 - Arriendos
  5103 - Servicios Básicos
  5104 - Gastos Operacionales Causas
```

### Glosario de Términos
- **Débito**: Lado izquierdo de la contabilidad, aumenta activos y gastos
- **Crédito**: Lado derecho de la contabilidad, aumenta pasivos, patrimonio e ingresos
- **Voucher**: Comprobante contable que registra una operación
- **Centro de Costo**: Causa legal asociada a un gasto o ingreso
- **Cuenta Provisoria**: Reporte oficial para tribunales con movimientos de una causa

---

**Última actualización**: Enero 2025  
**Versión del sistema**: 1.0  
**Documento elaborado por**: Equipo de Desarrollo ERP MisCausas