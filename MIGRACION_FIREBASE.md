# 🚀 Protocolo de Migración RutaTotal 360 v3.0

Esta guía contiene los pasos críticos para clonar este proyecto y conectarlo a una **nueva base de datos de Firebase** de forma exitosa.

## 🔑 1. Configuración de Código (firebase.config.js)
Actualiza el objeto `firebaseConfig` con las nuevas credenciales de tu proyecto de Firebase:
```javascript
export const firebaseConfig = {
    apiKey: "NUEVA_API_KEY",
    authDomain: "NUEVO_PROYECTO.firebaseapp.com",
    projectId: "NUEVO_PROYECTO",
    storageBucket: "NUEVO_PROYECTO.firebasestorage.app",
    messagingSenderId: "NUMERO_SENDER",
    appId: "ID_APP_FIREBASE"
};
```
> [!TIP]
> Cambia también la constante `APP_ID` para diferenciar los datos de cada cliente en Firestore.

## 🛠️ 2. Reglas de Firestore (Consola de Firebase)
Copia y pega estas reglas en **Rules** de tu base de datos Firestore:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /authorized_users/{email} {
      allow read: if request.auth != null && request.auth.token.email == email;
    }
    match /artifacts/logistica-pro-360/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
    match /staff_access/{docId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 🔐 3. Configuración de Autenticación
Debes activar estos métodos en la sección **Authentication** de Firebase:
1.  **Google**: Para Administradores.
2.  **Anonymous**: Para el acceso inicial por PIN.
3.  **Authorized Domains**: Añade `localhost`, `127.0.0.1` y la URL final de producción.

## 👥 4. Datos Iniciales obligatorios
Para que puedas entrar por primera vez, crea manualmente este documento en Firestore:
*   **Colección**: `authorized_users`
*   **ID del documento**: `tu_email_real@gmail.com` (todo en minúsculas)
*   **Campo**: `role` (tipo string)
*   **Valor**: `admin`

## 🛡️ 5. Notas sobre Sesiones e Importaciones
*   **Rutas HTML**: Asegúrate de que los archivos `.html` llamen a los scripts con `./src/...` (ej: `<script type="module" src="./src/main.js"></script>`).
*   **Aislamiento**: No uses `onAuthChange` con redirecciones automáticas en `index.html` para evitar que las sesiones de Admin y repartidores se crucen.
