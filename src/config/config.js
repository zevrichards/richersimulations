import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth'
import 'firebase/compat/storage'

// import { useAuthState } from 'react-firebase-hooks/auth'
// import { useCollectionData } from 'react-firebase-hooks/firestore'

// import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";



const firebaseConfig = {
    apiKey: "AIzaSyAceVO206QlknQzQ3JnFuj2sWHGpstPYO4",
    // authDomain: "richersimulations-b57cb.firebaseapp.com",
    authDomain: "richersimulations.com",
    projectId: "richersimulations-b57cb",
    storageBucket: "richersimulations-b57cb.appspot.com",
    messagingSenderId: "631080129843",
    appId: "1:631080129843:web:7f74ac5225cfca14955a46",
    measurementId: "G-Z58M40ZCC3"
  };

const app = firebase.initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

const auth = firebase.auth();
const auth2 = firebase.auth;
const firestore = firebase.firestore();
const storage = firebase.storage();
const Timestamp = firebase.firestore.Timestamp;

export {firebase, auth, auth2, firestore, storage, app, Timestamp}//analytics