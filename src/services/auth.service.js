import { auth, db, getDeliveryApp } from '../config/firebase.config.js';
import {
    getAuth,
    signInAnonymously,
    onAuthStateChanged,
    signOut,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import {
    getFirestore,
    doc,
    getDoc,
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const googleProvider = new GoogleAuthProvider();
// Mejora: Requerir que el popup pida selección de cuenta siempre (limpia caché de COOP a veces)
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const authService = {
    // Helpers para obtener las instancias correctas
    getAuthInstance(useDelivery = false) {
        if (!useDelivery) return auth;
        return getAuth(getDeliveryApp());
    },

    getDbInstance(useDelivery = false) {
        if (!useDelivery) return db;
        return getFirestore(getDeliveryApp());
    },

    async loginWithGoogle() {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            return result.user;
        } catch (error) {
            console.error("Google Login Error (Popup):", error);
            // Si el popup es bloqueado o por COOP, intentamos Redirect
            if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request') {
                console.log("Intentando Redirect debido a bloqueo de popup...");
                return await this.loginWithGoogleRedirect();
            }
            throw error;
        }
    },

    async loginWithGoogleRedirect() {
        try {
            await signInWithRedirect(auth, googleProvider);
        } catch (error) {
            console.error("Google Login Error (Redirect):", error);
            throw error;
        }
    },

    async handleRedirectResult() {
        try {
            const result = await getRedirectResult(auth);
            return result ? result.user : null;
        } catch (error) {
            console.error("Redirect Result Error:", error);
            throw error;
        }
    },

    async loginWithPIN(pin, useDelivery = false) {
        if (!pin) throw new Error("PIN requerido");

        // Limpiamos el PIN de espacios accidentales (común en teclados móviles)
        const cleanPIN = pin.toString().trim();

        const targetAuth = this.getAuthInstance(useDelivery);
        const targetDb = this.getDbInstance(useDelivery);

        try {
            // 1. Autenticación anónima
            const userCredential = await signInAnonymously(targetAuth);
            console.log(`[AUTH] Sesión anónima activa (UID: ${userCredential.user.uid}) en ${useDelivery ? 'instancia aislada' : 'instancia default'}`);

            // 2. BUSQUEDA
            const staffRef = collection(targetDb, 'staff_access');
            
            // Intento 1: String
            let q = query(staffRef, where("pin", "==", cleanPIN));
            let querySnapshot = await getDocs(q);

            // Intento 2: Como Number (si el primero falló y el PIN es numérico)
            if (querySnapshot.empty && !isNaN(cleanPIN)) {
                q = query(staffRef, where("pin", "==", Number(cleanPIN)));
                querySnapshot = await getDocs(q);
            }

            if (!querySnapshot.empty) {
                const docSnap = querySnapshot.docs[0];
                const staffData = docSnap.data();
                const result = {
                    ...staffData,
                    id: docSnap.id,
                    role: staffData.role || 'operativo',
                    name: (staffData.name || staffData.id || docSnap.id).trim()
                };
                console.log(`PIN Login exitoso: ${result.name} (${result.role})`);
                return result;
            } else {
                // Si el PIN no es válido, cerramos la sesión anónima
                await signOut(targetAuth);
                throw new Error("PIN incorrecto");
            }
        } catch (error) {
            console.error("PIN Login Error:", error);
            throw error;
        }
    },

    async checkAuthorization(email) {
        if (!email) return false;
        try {
            const userDoc = await getDoc(doc(db, 'authorized_users', email));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                return userData.role === 'admin';
            }
            return false;
        } catch (error) {
            console.error("Authorization Check Error:", error);
            return false;
        }
    },

    onAuthChange(callback, useDelivery = false) {
        const targetAuth = this.getAuthInstance(useDelivery);
        return onAuthStateChanged(targetAuth, callback);
    },

    async logout(useDelivery = false) {
        const targetAuth = this.getAuthInstance(useDelivery);
        return await signOut(targetAuth);
    },

    getCurrentUser(useDelivery = false) {
        const targetAuth = this.getAuthInstance(useDelivery);
        return targetAuth.currentUser;
    }
};
