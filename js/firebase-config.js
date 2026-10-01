// Необязательная конфигурация онлайн-комнат.
// 1. Создайте бесплатный проект на https://console.firebase.google.com
// 2. Включите Realtime Database и вставьте параметры веб-приложения ниже.
// Локальные игры работают и без Firebase.
export const firebaseConfig={apiKey:'',authDomain:'',databaseURL:'',projectId:'',appId:''};
export const firebaseReady=Boolean(firebaseConfig.apiKey&&firebaseConfig.databaseURL);
