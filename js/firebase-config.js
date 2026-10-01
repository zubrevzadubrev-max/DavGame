/**
 * Вставьте сюда объект firebaseConfig из Firebase Console:
 * Project settings → General → Your apps → Web app → SDK setup and configuration.
 * Не публикуйте административные ключи. Обычный Web API key Firebase допустимо
 * хранить в клиенте — безопасность обеспечивается Authentication и Database Rules.
 */
export const firebaseConfig = {
  apiKey: 'AIzaSyAeibw2IY5GtKwLBnaXioWN-FelIrrnjRg',
  authDomain: 'davgame-f6689.firebaseapp.com',
  // После создания Realtime Database сверьте URL во вкладке Data Firebase Console.
  // Для региона не по умолчанию он может оканчиваться на firebasedatabase.app.
  databaseURL: 'https://davgame-f6689-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'davgame-f6689',
  storageBucket: 'davgame-f6689.firebasestorage.app',
  messagingSenderId: '1083610721035',
  appId: '1:1083610721035:web:ec305278a341f29eafd00e'
};

export const FIREBASE_SDK_VERSION = '12.19.0';
export const firebaseReady = ['apiKey','authDomain','databaseURL','projectId','appId']
  .every(key => Boolean(firebaseConfig[key] && !firebaseConfig[key].includes('...')));
