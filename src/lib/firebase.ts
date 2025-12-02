// Lightweight runtime guard for Firebase usage without adding hard dependency.
// When credentials are provided (NEXT_PUBLIC_FIREBASE_*), we lazy-load Firebase modules.

export type FirebaseClients = {
  app: any;
  db: any;
  storage: any;
  auth?: any;
};

let cached: FirebaseClients | null = null;

export function isFirebaseEnabled() {
  return (
    typeof process !== "undefined" &&
    !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  );
}

export async function existsByField(collectionPath: string, field: string, value: any) {
  const fb = await getFirebase();
  if (!fb) return { ok: false, reason: "disabled" } as const;
  const { db } = fb as any;
  const { getDocs, collection, query, where, limit } = await import("firebase/firestore");
  const q = query(collection(db, collectionPath), where(field, "==", value), limit(1));
  const snap = await getDocs(q);
  return { ok: true, exists: !snap.empty } as const;
}

export async function getFirebase(): Promise<FirebaseClients | null> {
  if (!isFirebaseEnabled()) return null;
  if (cached) return cached;

  try {
    const firebaseApp = await import("firebase/app");
    const firestore = await import("firebase/firestore");
    const storageMod = await import("firebase/storage");
    let authMod: any = null;
    try {
      authMod = await import("firebase/auth");
    } catch { }

    const config = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    } as any;

    const app = firebaseApp.getApps().length
      ? firebaseApp.getApp()
      : firebaseApp.initializeApp(config);

    const db = firestore.getFirestore(app);
    const storage = storageMod.getStorage(app);
    const auth = authMod ? authMod.getAuth(app) : undefined;

    cached = { app, db, storage, auth };
    return cached;
  } catch (e) {
    console.warn("Firebase not available or failed to initialize:", e);
    return null;
  }
}

// Helpers that no-op when Firebase is disabled
export async function saveDocument(collectionPath: string, doc: any) {
  const fb = await getFirebase();
  if (!fb) return { ok: false, reason: "disabled" } as const;
  const { db } = fb as any;
  const { addDoc, collection, serverTimestamp } = await import("firebase/firestore");
  const ref = await addDoc(collection(db, collectionPath), { ...doc, createdAt: serverTimestamp() });
  return { ok: true, id: ref.id } as const;
}

export async function uploadFile(path: string, file: File) {
  const fb = await getFirebase();
  if (!fb) return { ok: false, reason: "disabled" } as const;
  const { storage } = fb as any;
  const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
  const r = ref(storage, path);
  const snap = await uploadBytes(r, file);
  const url = await getDownloadURL(snap.ref);
  return { ok: true, url } as const;
}

export async function listCollection(collectionPath: string) {
  const fb = await getFirebase();
  if (!fb) return { ok: false, reason: "disabled" } as const;
  const { db } = fb as any;
  const { getDocs, collection } = await import("firebase/firestore");
  const snap = await getDocs(collection(db, collectionPath));
  const items = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
  return { ok: true, items } as const;
}

export async function subscribeCollection(
  collectionPath: string,
  onChange: (items: any[]) => void
) {
  const fb = await getFirebase();
  if (!fb) return () => { };
  const { db } = fb as any;
  const { onSnapshot, collection } = await import("firebase/firestore");
  const ref = collection(db, collectionPath);
  const unsub = onSnapshot(ref,
    (snap: any) => {
      const items = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      onChange(items);
    },
    (err: any) => {
      // eslint-disable-next-line no-console
      console.error("[FIRESTORE subscribeCollection error]", err);
    }
  );
  return unsub;
}

export async function deleteDocument(collectionPath: string, id: string) {
  const fb = await getFirebase();
  if (!fb) return { ok: false, reason: "disabled" } as const;
  const { db } = fb as any;
  const { doc, deleteDoc } = await import("firebase/firestore");
  await deleteDoc(doc(db, collectionPath, id));
  return { ok: true } as const;
}

export async function updateDocument(collectionPath: string, id: string, data: any) {
  const fb = await getFirebase();
  if (!fb) return { ok: false, reason: "disabled" } as const;
  const { db } = fb as any;
  const { doc, updateDoc } = await import("firebase/firestore");
  await updateDoc(doc(db, collectionPath, id), data);
  return { ok: true } as const;
}

// Auth helpers
export async function signInWithGoogle() {
  const fb = await getFirebase();
  if (!fb || !fb.auth) return { ok: false, reason: "disabled" } as const;
  const { GoogleAuthProvider, signInWithPopup } = await import("firebase/auth");
  const provider = new GoogleAuthProvider();
  await signInWithPopup(fb.auth, provider);
  return { ok: true } as const;
}

export async function signOutFirebase() {
  const fb = await getFirebase();
  if (!fb || !fb.auth) return { ok: false, reason: "disabled" } as const;
  const { signOut } = await import("firebase/auth");
  await signOut(fb.auth);
  return { ok: true } as const;
}

export async function onAuthState(cb: (user: any | null) => void) {
  const fb = await getFirebase();
  if (!fb || !fb.auth) {
    cb(null);
    return () => { };
  }
  const { onAuthStateChanged } = await import("firebase/auth");
  return onAuthStateChanged(fb.auth, cb);
}

export async function signInEmailPassword(email: string, password: string) {
  const fb = await getFirebase();
  if (!fb || !fb.auth) return { ok: false, reason: "disabled" } as const;
  const { signInWithEmailAndPassword } = await import("firebase/auth");
  await signInWithEmailAndPassword(fb.auth, email, password);
  return { ok: true } as const;
}

export async function createUserEmailPassword(email: string, password: string, displayName?: string) {
  const fb = await getFirebase();
  if (!fb || !fb.auth) return { ok: false, reason: "disabled" } as const;
  const { createUserWithEmailAndPassword, updateProfile } = await import("firebase/auth");
  const { doc, setDoc } = await import("firebase/firestore");

  const userCredential = await createUserWithEmailAndPassword(fb.auth, email, password);

  // Set display name if provided
  if (displayName && userCredential.user) {
    await updateProfile(userCredential.user, { displayName });

    // Save user data to Firestore 'users' collection
    const userDoc = doc(fb.db, "users", userCredential.user.uid);
    await setDoc(userDoc, {
      uid: userCredential.user.uid,
      email: email,
      name: displayName,
      role: "user", // Default role
      createdAt: new Date().toISOString(),
    });
  }

  return { ok: true } as const;
}

export async function getUserData(uid: string) {
  const fb = await getFirebase();
  if (!fb) return { ok: false, reason: "disabled" } as const;
  const { doc, getDoc } = await import("firebase/firestore");

  const userDoc = doc(fb.db, "users", uid);
  const snapshot = await getDoc(userDoc);

  if (snapshot.exists()) {
    return { ok: true, data: snapshot.data() } as const;
  }

  return { ok: false, reason: "not-found" } as const;
}

export async function updateUserProfilePicture(uid: string, photoURL: string) {
  const fb = await getFirebase();
  if (!fb) return { ok: false, reason: "disabled" } as const;
  const { doc, updateDoc } = await import("firebase/firestore");

  const userDoc = doc(fb.db, "users", uid);
  await updateDoc(userDoc, { photoURL });

  return { ok: true } as const;
}

export async function createOrder(orderData: {
  userId: string;
  items: any[];
  total: number;
  shipping: { name: string; price: number; days: number };
  shippingAddress?: any;
  paymentId?: string;
  paymentStatus?: string;
  paymentMethod?: string;
}) {
  const fb = await getFirebase();
  if (!fb) return { ok: false, reason: "disabled" } as const;
  const { collection, addDoc, doc, getDoc, setDoc, runTransaction } = await import("firebase/firestore");

  // Get next order number using transaction for atomicity
  const counterRef = doc(fb.db, "counters", "orders");

  let orderNumber = 100;

  try {
    await runTransaction(fb.db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);

      if (!counterDoc.exists()) {
        // Initialize counter starting at 100
        orderNumber = 100;
        transaction.set(counterRef, { lastOrderNumber: 100 });
      } else {
        // Increment counter
        const currentNumber = counterDoc.data().lastOrderNumber || 99;
        orderNumber = currentNumber + 1;
        transaction.update(counterRef, { lastOrderNumber: orderNumber });
      }
    });
  } catch (error) {
    console.error("Error getting order number:", error);
    // Fallback to timestamp-based number if transaction fails
    orderNumber = 100 + Math.floor(Date.now() / 1000) % 900000;
  }

  const ordersCollection = collection(fb.db, "orders");
  const docRef = await addDoc(ordersCollection, {
    ...orderData,
    orderNumber,
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  return { ok: true, orderId: docRef.id, orderNumber } as const;
}

export async function getUserOrders(userId: string) {
  const fb = await getFirebase();
  if (!fb) return { ok: false, reason: "disabled" } as const;
  const { collection, query, where, getDocs, orderBy } = await import("firebase/firestore");

  const ordersCollection = collection(fb.db, "orders");
  const q = query(
    ordersCollection,
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);
  const orders = snapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data()
  }));

  return { ok: true, orders } as const;
}

export async function subscribeUserOrders(userId: string, onChange: (orders: any[]) => void) {
  const fb = await getFirebase();
  if (!fb) return () => { };
  const { collection, query, where, onSnapshot, orderBy } = await import("firebase/firestore");

  const ordersCollection = collection(fb.db, "orders");
  const q = query(
    ordersCollection,
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );

  const unsub = onSnapshot(q,
    (snapshot: any) => {
      const orders = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      }));
      onChange(orders);
    },
    (err: any) => {
      console.error("[FIRESTORE subscribeUserOrders error]", err);
    }
  );

  return unsub;
}

export async function getAllOrders() {
  const fb = await getFirebase();
  if (!fb) return { ok: false, reason: "disabled" } as const;
  const { collection, query, getDocs, orderBy } = await import("firebase/firestore");

  const ordersCollection = collection(fb.db, "orders");
  const q = query(ordersCollection, orderBy("createdAt", "desc"));

  const snapshot = await getDocs(q);
  const orders = snapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data()
  }));

  return { ok: true, orders } as const;
}

export async function subscribeAllOrders(onChange: (orders: any[]) => void) {
  const fb = await getFirebase();
  if (!fb) return () => { };
  const { collection, query, onSnapshot, orderBy } = await import("firebase/firestore");

  const ordersCollection = collection(fb.db, "orders");
  const q = query(ordersCollection, orderBy("createdAt", "desc"));

  const unsub = onSnapshot(q,
    (snapshot: any) => {
      const orders = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      }));
      onChange(orders);
    },
    (err: any) => {
      console.error("[FIRESTORE subscribeAllOrders error]", err);
    }
  );

  return unsub;
}

export async function updateOrderStatus(orderId: string, status: string) {
  const fb = await getFirebase();
  if (!fb) return { ok: false, reason: "disabled" } as const;
  const { doc, updateDoc } = await import("firebase/firestore");

  const orderRef = doc(fb.db, "orders", orderId);
  await updateDoc(orderRef, {
    status,
    updatedAt: new Date().toISOString(),
  });

  return { ok: true } as const;
}
