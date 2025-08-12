import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  getDatabase,
  ref,
  set,
  get,
  update,
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCXfzRrHa2t-y5TBJoipN0m_mv9bXjHmL8",
  authDomain: "golden-mine-e7d50.firebaseapp.com",
  databaseURL: "https://golden-mine-e7d50-default-rtdb.firebaseio.com",
  projectId: "golden-mine-e7d50",
  storageBucket: "golden-mine-e7d50.appspot.com",
  messagingSenderId: "49056047000",
  appId: "1:49056047000:web:76e20efa45a0b8ffc415ed",
  measurementId: "G-MMD56ZP5YE",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

const tabSignIn = document.getElementById("tab-signin");
const tabSignUp = document.getElementById("tab-signup");
const formSignIn = document.getElementById("signin-form");
const formSignUp = document.getElementById("signup-form");

const signinNick = document.getElementById("signin-nick");
const signinPass = document.getElementById("signin-pass");
const signupNick = document.getElementById("signup-nick");
const signupPass = document.getElementById("signup-pass");
const signupPass2 = document.getElementById("signup-pass2");

const signinError = document.getElementById("signin-error");
const signupError = document.getElementById("signup-error");

const game = document.getElementById("game");
const playerNick = document.getElementById("player-nick");
const coinsEl = document.getElementById("coins");
const mineBtn = document.getElementById("mine-btn");
const logoutBtn = document.getElementById("logout-btn");

let coins = 0;
let nickname = "";
let currentUser = null;

tabSignIn.onclick = () => {
  tabSignIn.classList.add("active");
  tabSignUp.classList.remove("active");
  formSignIn.classList.add("active");
  formSignUp.classList.remove("active");
  signinError.textContent = "";
  signupError.textContent = "";
};

tabSignUp.onclick = () => {
  tabSignUp.classList.add("active");
  tabSignIn.classList.remove("active");
  formSignUp.classList.add("active");
  formSignIn.classList.remove("active");
  signinError.textContent = "";
  signupError.textContent = "";
};

function isValidNick(nick) {
  return /^[a-zA-Z0-9_-]{3,15}$/.test(nick);
}

document.getElementById("btn-signup").onclick = async () => {
  signupError.textContent = "";
  const nick = signupNick.value.trim();
  const pass = signupPass.value;
  const pass2 = signupPass2.value;

  if (!nick || !pass || !pass2) {
    signupError.textContent = "Все поля обязательны";
    return;
  }
  if (!isValidNick(nick)) {
    signupError.textContent = "Ник должен содержать 3-15 латинских букв, цифр, _ или -";
    return;
  }
  if (pass !== pass2) {
    signupError.textContent = "Пароли не совпадают";
    return;
  }
  if (pass.length < 6) {
    signupError.textContent = "Пароль должен быть минимум 6 символов";
    return;
  }

  try {
    const nickRef = ref(db, "nicknames/" + nick.toLowerCase());
    const snap = await get(nickRef);
    if (snap.exists()) {
      signupError.textContent = "Ник занят, выберите другой";
      return;
    }
    const email = nick.toLowerCase() + "@goldmine.local";
    const userCred = await createUserWithEmailAndPassword(auth, email, pass);
    currentUser = userCred.user;
    nickname = nick;

    await set(ref(db, "users/" + currentUser.uid), {
      nickname,
      coins: 0,
    });
    await set(nickRef, currentUser.uid);
    startGame();
  } catch (e) {
    signupError.textContent = e.message;
  }
};

document.getElementById("btn-signin").onclick = async () => {
  signinError.textContent = "";
  const nick = signinNick.value.trim();
  const pass = signinPass.value;
  if (!nick || !pass) {
    signinError.textContent = "Введите ник и пароль";
    return;
  }
  if (!isValidNick(nick)) {
    signinError.textContent = "Неверный формат ника";
    return;
  }

  try {
    const email = nick.toLowerCase() + "@goldmine.local";
    const userCred = await signInWithEmailAndPassword(auth, email, pass);
    currentUser = userCred.user;
    const snap = await get(ref(db, "users/" + currentUser.uid));
    if (snap.exists()) {
      const val = snap.val();
      coins = val.coins || 0;
      nickname = val.nickname || nick;
    } else {
      coins = 0;
      nickname = nick;
    }
    startGame();
  } catch {
    signinError.textContent = "Неверный ник или пароль";
  }
};

function startGame() {
  document.querySelector(".auth-container").classList.add("hidden");
  game.classList.remove("hidden");
  playerNick.textContent = nickname;
  coinsEl.textContent = coins;
}

mineBtn.onclick = () => {
  coins++;
  coinsEl.textContent = coins;
  if (currentUser) {
    update(ref(db, "users/" + currentUser.uid), { coins });
  }
};

logoutBtn.onclick = async () => {
  await signOut(auth);
  currentUser = null;
  coins = 0;
  nickname = "";
  game.classList.add("hidden");
  document.querySelector(".auth-container").classList.remove("hidden");
  signinNick.value = "";
  signinPass.value = "";
  signupNick.value = "";
  signupPass.value = "";
  signupPass2.value = "";
  signinError.textContent = "";
  signupError.textContent = "";
  tabSignIn.click();
};
