// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCgD6u1ynK5BK5KlesHBcGfrwmlAR5_BqY",
  authDomain: "flippy-bird-d5e72.firebaseapp.com",
  projectId: "flippy-bird-d5e72",
  storageBucket: "flippy-bird-d5e72.firebasestorage.app",
  messagingSenderId: "485763166501",
  appId: "1:485763166501:web:8e3888ff051e0f82002acc",
  measurementId: "G-VL970D5167"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);