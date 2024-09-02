// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore"; // Add this line to import getFirestore

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCXZQDiFeAcgSg5PwK9bdH8QiZ7bnGKFQc",
  authDomain: "calendar-63406.firebaseapp.com",
  projectId: "calendar-63406",
  storageBucket: "calendar-63406.appspot.com",
  messagingSenderId: "321031742837",
  appId: "1:321031742837:web:f922dda95bc66289a91f3c",
  measurementId: "G-8SEHJQ7EH8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const db = getFirestore(app);

export { db };