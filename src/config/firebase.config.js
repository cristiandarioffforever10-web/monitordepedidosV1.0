import { initializeApp, getApp, getApps } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

export const firebaseConfig = {
    apiKey: "AIzaSyCIuCNW_3tkmBEdMEw447p9WYFFPoH2yLw",
    authDomain: "mdp2-186fe.firebaseapp.com",
    projectId: "mdp2-186fe",
    storageBucket: "mdp2-186fe.firebasestorage.app",
    messagingSenderId: "535639560802",
    appId: "1:535639560802:web:4f019bdeee3a01f6b4373b"
};

// Instancia por defecto (Admin / Panel Maestro)
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Instancia aislada para Delivery (Evita cerrar sesión admin en el mismo navegador)
export const getDeliveryApp = () => {
    const apps = getApps();
    const deliveryApp = apps.find(a => a.name === "DeliveryApp");
    return deliveryApp || initializeApp(firebaseConfig, "DeliveryApp");
};

export { auth, db };
export const APP_ID = 'logistica-pro-360';
