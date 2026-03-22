---
description: Protocolo de Pre-Vuelo para el Agente en cada tarea.
---

# 🔄 Protocolo de Tarea (Pre-Vuelo)

Este flujo de trabajo garantiza que cada cambio en RutaTotal 360 sea consistente con la arquitectura y los objetivos a largo plazo.

## Pasos Obligatorios

1.  **Análisis Técnico**: 
    - ¿Cómo afecta este cambio a la arquitectura general? 
    - ¿Es compatible con una futura migración a Angular?
2.  **Validación de Lógica**: 
    - ¿Respeta el ciclo de **Poder y Ubicación**? 
    - ¿Consulta las [Reglas de Oro](file:///c:/Users/Noxie/Documents/026_CR10/MDP%20-%20AG%20-%20DEMO%204-%20Vista%20Delivery/.agent/rules/RULES.md)?
3.  **Planificación**:
    - Crear un `implementation_plan.md` si la tarea es compleja.
    - Definir los archivos a modificar y crear.
4.  **Implementación**: 
    - Escribir código limpio y modular.
    - Asegurar que no existan efectos secundarios no deseados.
5.  **Verificación**: 
    - Validar en consola/terminal.
    - Documentar en un `walkthrough.md`.

---
> "El éxito es un sistema ordenado y auditable."
