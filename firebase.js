const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
    apiKey: process.env.apiKey,
    authDomain: process.env.authDomain,
    projectId: process.env.projectId,
    storageBucket: process.env.storageBucket,
    messagingSenderId: process.env.messagingSenderId,
    appId: process.env.appId,
    measurementId: process.env.measurementId
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function getSummonerID(db) {
    const summoners = collection(db, 'summoners');
    const summonerSnapshot = await getDocs(summoners);
    const summonerList = summonerSnapshot.docs.map(doc => doc.data());
    return summonerList;
}