---
description: [Este workflow automatiza la actualización de Firebase y las correcciones de rutas para un nuevo proyecto de RutaTotal 360.]
---

1.  Asegurarse de que el usuario ha proporcionado las nuevas credenciales de Firebase.
2.  Actualizar `src/config/firebase.config.js` con el objeto `firebaseConfig` y un nuevo `APP_ID`.
3.  Corregir las rutas de importación en `index.html` y `app.html` asegurando que apunten a `./src/`.
4.  En `index.html`, verificar que NO haya escuchadores `onAuthChange` que fuercen redirecciones automáticas.
5.  Actualizar `auth.service.js` para usar `signInWithRedirect` como fallback por defecto.
6.  Proveer al usuario el código de las Reglas de Firestore necesarias para el nuevo proyecto.
7.  Informar al usuario sobre los métodos de Auth necesarios (Google y Anónimo).
