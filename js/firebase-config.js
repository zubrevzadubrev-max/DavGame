const firebaseConfig = {
  apiKey: "AIzaSyAeibw2IY5GtKwLBnaXioWN-FelIrrnjRg",
  authDomain: "davgame-f6689.firebaseapp.com",
  projectId: "davgame-f6689",
  storageBucket: "davgame-f6689.firebasestorage.app",
  messagingSenderId: "1083610721035",
  appId: "1:1083610721035:web:ec305278a341f29eafd00e"
};

export const FIREBASE_SDK_VERSION = '12.19.0';
export const firebaseReady = ['apiKey','authDomain','databaseURL','projectId','appId']
  .every(key => Boolean(firebaseConfig[key] && !firebaseConfig[key].includes('...')));
