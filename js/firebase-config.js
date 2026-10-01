/**
 * Вставьте сюда объект firebaseConfig из Firebase Console:
 * Project settings → General → Your apps → Web app → SDK setup and configuration.
 * Не публикуйте административные ключи. Обычный Web API key Firebase допустимо
 * хранить в клиенте — безопасность обеспечивается Authentication и Database Rules.
 */
export const firebaseConfig = {
  apiKey: '',
  authDomain: '',
  databaseURL: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: ''
};

export const FIREBASE_SDK_VERSION = '10.14.1';
export const firebaseReady = ['apiKey','authDomain','databaseURL','projectId','appId']
  .every(key => Boolean(firebaseConfig[key] && !firebaseConfig[key].includes('...')));
