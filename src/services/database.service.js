import { auth as adminAuth, db as adminDb, APP_ID, getDeliveryApp } from '../config/firebase.config.js';
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, updateDoc, deleteDoc, collection, onSnapshot, serverTimestamp, writeBatch, getDocs, query, where } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Helper interno para obtener las instancias activas (Admin o Delivery)
const getContext = () => {
    if (adminAuth.currentUser) {
        return { auth: adminAuth, db: adminDb };
    }
    const deliveryApp = getDeliveryApp();
    const deliveryAuth = getAuth(deliveryApp);
    if (deliveryAuth.currentUser) {
        return { auth: deliveryAuth, db: getFirestore(deliveryApp) };
    }
    return { auth: adminAuth, db: adminDb };
};

export const databaseService = {
    subscribeToOrders(callback) {
        const { auth, db } = getContext();
        if (!auth.currentUser) {
            console.warn("Attempted to subscribe to orders without authentication.");
            return () => {};
        }
        const ordersRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'orders');
        return onSnapshot(ordersRef, (snapshot) => {
            const orders = {};
            snapshot.forEach(doc => {
                orders[doc.id] = doc.data();
            });
            callback(orders);
        }, (error) => console.error("Orders Listener Error:", error));
    },

    subscribeToStaff(callback) {
        const { auth, db } = getContext();
        if (!auth.currentUser) {
            console.warn("Attempted to subscribe to staff without authentication.");
            return () => {};
        }
        const configRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'config', 'staff');
        return onSnapshot(configRef, (snapshot) => {
            if (snapshot.exists()) {
                callback(snapshot.data().list || []);
            } else {
                const defaultStaff = ['Carlos M.', 'Ana R.', 'Mateo G.'];
                setDoc(configRef, { list: defaultStaff });
                callback(defaultStaff);
            }
        }, (error) => console.error("Staff Listener Error:", error));
    },

    async createOrder(id, repartidor = null) {
        const { db } = getContext();
        const orderRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'orders', id.toString());
        const newOrder = {
            id: parseInt(id),
            repartidor: repartidor || null,
            status: repartidor ? 'en ruta' : 'nuevo',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: Date.now(),
            serverTime: serverTimestamp()
        };
        await setDoc(orderRef, newOrder);
    },

    async assignOrder(id, repartidor) {
        const { db } = getContext();
        const orderRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'orders', id.toString());
        await updateDoc(orderRef, {
            repartidor: repartidor || null,
            status: repartidor ? 'en ruta' : 'nuevo',
            timestamp: Date.now()
        });
    },

    async reportIncident(id, text) {
        const { db } = getContext();
        const orderRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'orders', id.toString());
        await updateDoc(orderRef, {
            incident: text,
            incidentTime: Date.now(),
            response: null
        });
    },

    async respondToIncident(id, text) {
        const { db } = getContext();
        const orderRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'orders', id.toString());
        await updateDoc(orderRef, {
            response: text,
            responseTime: Date.now()
        });
    },

    async finalizeOrder(id) {
        const { db } = getContext();
        const orderRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'orders', id.toString());
        await updateDoc(orderRef, {
            status: 'entregado',
            timestamp: Date.now(),
            deliveredAt: serverTimestamp()
        });
    },

    async deleteOrder(id, orderData) {
        const { db } = getContext();
        const now = new Date();
        const monthId = `${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}`;
        const timeStr = `${String(now.getHours()).padStart(2, '0')}_${String(now.getMinutes()).padStart(2, '0')}_${String(now.getSeconds()).padStart(2, '0')}`;
        const sessionId = `Individual_${timeStr}`;

        // Archivar antes de borrar si tenemos los datos (Borrado individual)
        if (orderData) {
            const archiveRef = doc(db, 'artifacts', APP_ID, 'archive', monthId, 'TIME', sessionId, 'orders', id.toString());
            await setDoc(archiveRef, {
                ...orderData,
                archivedAt: serverTimestamp(),
                archiveMonth: monthId,
                sessionId: sessionId,
                isManualDelete: true
            });
            
            // Documento de cabecera para la sesión individual
            const sessionRef = doc(db, 'artifacts', APP_ID, 'archive', monthId, 'TIME', sessionId);
            await setDoc(sessionRef, {
                id: sessionId,
                timestamp: serverTimestamp(),
                count: 1,
                label: `Borrado: ${timeStr}`
            });
        }

        const orderRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'orders', id.toString());
        await deleteDoc(orderRef);
    },

    async updateStaff(newList) {
        const { db } = getContext();
        const configRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'config', 'staff');
        await setDoc(configRef, { list: newList });
    },

    async createStaffAccess(name) {
        const { db } = getContext();
        
        // 1. Obtener cantidad de repartidores actuales para determinar el PIN
        const staffCol = collection(db, 'staff_access');
        const q = query(staffCol, where('role', '==', 'repartidor'));
        const snap = await getDocs(q);
        const count = snap.size;
        
        // 2. Calcular PIN: 1111, 2222, etc.
        const nextNumber = count + 1;
        const pinString = (nextNumber % 10).toString().repeat(4);
        const pin = pinString === "0000" ? "0000" : pinString; 

        // 3. Crear el documento
        const staffRef = doc(db, 'staff_access', name.toLowerCase().trim());
        await setDoc(staffRef, {
            pin: pin,
            role: 'repartidor'
        });
        console.log(`Creado staff_access para ${name} con pin ${pin}`);
    },

    async archiveAndClearAllOrders(orders) {
        const { db } = getContext();
        if (!orders || Object.keys(orders).length === 0) return;

        const batch = writeBatch(db);
        const now = new Date();
        const monthId = `${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}`;
        const timeStr = `${String(now.getHours()).padStart(2, '0')}_${String(now.getMinutes()).padStart(2, '0')}_${String(now.getSeconds()).padStart(2, '0')}`;
        const sessionId = `Cierre_${timeStr}`;
        
        // Documento de cabecera de la sesión (Limpieza de turno)
        const sessionRef = doc(db, 'artifacts', APP_ID, 'archive', monthId, 'TIME', sessionId);
        batch.set(sessionRef, {
            id: sessionId,
            timestamp: serverTimestamp(),
            count: Object.keys(orders).length,
            label: `Cierre: ${timeStr}`
        });

        Object.entries(orders).forEach(([id, data]) => {
            const archiveRef = doc(db, 'artifacts', APP_ID, 'archive', monthId, 'TIME', sessionId, 'orders', id.toString());
            batch.set(archiveRef, {
                ...data,
                archivedAt: serverTimestamp(),
                archiveMonth: monthId,
                sessionId: sessionId
            });

            const activeRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'orders', id.toString());
            batch.delete(activeRef);
        });

        await batch.commit();
        console.log(`Modo Fantasma: ${Object.keys(orders).length} pedidos archivados bajo TIME/${sessionId}`);
    },

    async getArchivedMonths() {
        const now = new Date();
        const months = [];
        for (let i = 0; i < 6; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthId = `${d.getFullYear()}_${String(d.getMonth() + 1).padStart(2, '0')}`;
            months.push(monthId);
        }
        return months;
    },

    async getArchivedSessions(monthId) {
        const { db } = getContext();
        const sessionsRef = collection(db, 'artifacts', APP_ID, 'archive', monthId, 'TIME');
        return new Promise((resolve, reject) => {
            onSnapshot(sessionsRef, (snapshot) => {
                const sessions = [];
                snapshot.forEach(doc => {
                    sessions.push(doc.data());
                });
                resolve(sessions.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)));
            }, (error) => reject(error));
        });
    },

    async getArchivedOrders(monthId, sessionId) {
        const { db } = getContext();
        const archiveRef = collection(db, 'artifacts', APP_ID, 'archive', monthId, 'TIME', sessionId, 'orders');
        return new Promise((resolve, reject) => {
            onSnapshot(archiveRef, (snapshot) => {
                const orders = {};
                snapshot.forEach(doc => {
                    orders[doc.id] = doc.data();
                });
                resolve(orders);
            }, (error) => reject(error));
        });
    }
};
