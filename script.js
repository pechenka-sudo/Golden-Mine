import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getDatabase, ref, set, get, update } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCXfzRrHa2t-y5TBJoipN0m_mv9bXjHmL8",
  authDomain: "golden-mine-e7d50.firebaseapp.com",
  databaseURL: "https://golden-mine-e7d50-default-rtdb.firebaseio.com",
  projectId: "golden-mine-e7d50",
  storageBucket: "golden-mine-e7d50.appspot.com",
  messagingSenderId: "49056047000",
  appId: "1:49056047000:web:76e20efa45a0b8ffc415ed",
  measurementId: "G-MMD56ZP5YE"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// DOM elements
const authContainer = document.getElementById("auth-container");
const gameContainer = document.getElementById("game-container");
const nicknameInput = document.getElementById("nickname");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("login-btn");
const registerBtn = document.getElementById("register-btn");
const authError = document.getElementById("auth-error");

const playerNameEl = document.getElementById("player-name");
const coinsEl = document.getElementById("coins");
const mineBtn = document.getElementById("mine-btn");

let coins = 0;
let currentUser = null;
let nickname = "";

// Регистрация
registerBtn.onclick = async () => {
  nickname = nicknameInput.value.trim();
  const pass = passwordInput.value;
  if (!nickname || !pass) {
    authError.textContent = "Введите ник и пароль!";
    return;
  }
  try {
    const email = nickname + "@goldmine.fake"; // фиктивный email
    const userCred = await createUserWithEmailAndPassword(auth, email, pass);
    currentUser = userCred.user;
    await set(ref(db, "users/" + currentUser.uid), { nickname, coins: 0 });
    startGame();
  } catch (err) {
    authError.textContent = err.message;
  }
};

// Вход
loginBtn.onclick = async () => {
  nickname = nicknameInput.value.trim();
  const pass = passwordInput.value;
  if (!nickname || !pass) {
    authError.textContent = "Введите ник и пароль!";
    return;
  }
  try {
    const email = nickname + "@goldmine.fake";
    const userCred = await signInWithEmailAndPassword(auth, email, pass);
    currentUser = userCred.user;
    const snap = await get(ref(db, "users/" + currentUser.uid));
    if (snap.exists()) {
      coins = snap.val().coins || 0;
      nickname = snap.val().nickname;
    }
    startGame();
  } catch (err) {
    authError.textContent = err.message;
  }
};

function startGame() {
  authContainer.classList.add("hidden");
  gameContainer.classList.remove("hidden");
  playerNameEl.textContent = nickname;
  coinsEl.textContent = coins;
}

// Копка золота
mineBtn.onclick = () => {
  coins++;
  coinsEl.textContent = coins;
  if (currentUser) {
    update(ref(db, "users/" + currentUser.uid), { coins });
  }
};
