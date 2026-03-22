# 🛡️ Reglas de Oro: RutaTotal 360

Este documento contiene las leyes fundamentales de arquitectura y validación para el proyecto. Estas reglas son **innegociables** y deben seguirse en cada línea de código.

## 📜 1. Los 10 Mandamientos de la Verdad Digital

1.  **Prioridad de la Lógica Operativa**: Si el código cumple la función pero permite saltar estados operativos, se considera **FALLIDO**.
2.  **Modularidad Angular-Ready**: Todo el JavaScript debe estar separado por responsabilidades estrictas (`UI`, `Firebase`, `Logic`).
3.  **Integridad de Datos**: Cada transición de estado debe garantizar trazabilidad y auditoría de tiempos.
4.  **Prohibición de `createOrder`**: Los pedidos nacen de un pool pre-cargado de 100 IDs. No se crean IDs dinámicamente.
5.  **Inmutabilidad del Poder en Tránsito**: Un pedido en estado `Delivery` está bloqueado para el local.
6.  **Poder de Verdad**: Una vez entregado (`Cliente`), el dato es inmutable y auditable.
7.  **Sincronización en Tiempo Real**: Toda acción debe reflejarse en Firebase inmediatamente.
8.  **Manejo de Errores Silencioso pero Letal**: Los errores deben ser capturados y reportados, nunca ignorados.
9.  **Seguridad por Diseño**: Las reglas de Firestore son la última línea de defensa.
10. **Aesthetics by Design**: El rendimiento operativo manda, pero la interfaz debe sentirse premium.

## ⚖️ 2. Jerarquía de Poder y Ubicación

### A. Ubicación (Frontend)
1. **Cocina**: Nacimiento.
2. **Mostrador**: Espera.
3. **Delivery**: Viaje.
4. **Cliente**: Cierre.

### B. Poder (Backend)
1. **Poder Local**: Cocina/Mostrador (Modificable).
2. **Poder Delegado**: Delivery (Bloqueado).
3. **Poder de Verdad**: Entregado (Inmutable).

---
> "La estrategia manda sobre la sintaxis."
