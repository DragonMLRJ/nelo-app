import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDmYTnta16iHpo81e-R65hUsPjT2ShUlc8",
  authDomain: "nelo-897d4.firebaseapp.com",
  projectId: "nelo-897d4",
  storageBucket: "nelo-897d4.firebasestorage.app",
  messagingSenderId: "706747458766",
  appId: "1:706747458766:web:62b32e20b1ad538d125c9f"
};

let app, auth, provider;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  provider = new GoogleAuthProvider();
} catch(error) {
  console.warn("⚠️ Attention: Firebase n'est pas configuré. Veuillez renseigner vos clés dans src/firebase.js");
}

export { auth, provider };
