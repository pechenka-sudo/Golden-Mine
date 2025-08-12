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

// Инициализация аудио контекста и звуков
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(freq, duration = 0.1, type = "sine", volume = 0.05) {
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  oscillator.type = type;
  oscillator.frequency.value = freq;
  gainNode.gain.value = volume;
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  oscillator.start();

  oscillator.stop(audioCtx.currentTime + duration);
  oscillator.onended = () => {
    gainNode.disconnect();
    oscillator.disconnect();
  };
}

// Звук добычи (кира) — несколько частот в быстрой последовательности
function playMineSound() {
  playTone(350, 0.05, "square", 0.07);
  setTimeout(() => playTone(450 + Math.random() * 40, 0.07, "triangle", 0.05), 60);
}

// Звук апгрейда — мелодичный переход вверх
function playUpgradeSound() {
  playTone(600, 0.12, "sine", 0.1);
  setTimeout(() => playTone(720, 0.12, "sine", 0.08), 140);
  setTimeout(() => playTone(840, 0.12, "sine", 0.06), 280);
}

// Звук ошибки — низкий мягкий бип
function playErrorSound() {
  playTone(220, 0.2, "sine", 0.1);
}

// Звук клика кнопки
function playClickSound() {
  playTone(500, 0.08, "triangle", 0.04);
}

// Мьют/анмьют звуков (для UX)
let isMuted = false;
function toggleMute() {
  isMuted = !isMuted;
  muteBtn.textContent = isMuted ? "Включить звук 🔈" : "Выключить звук 🔇";
}

// Добавим кнопку звука в UI
const muteBtn = document.createElement("button");
muteBtn.textContent = "Выключить звук 🔇";
muteBtn.style.marginTop = "12px";
muteBtn.style.width = "100%";
muteBtn.style.borderRadius = "14px";
muteBtn.style.padding = "12px 0";
muteBtn.style.fontWeight = "700";
muteBtn.style.cursor = "pointer";
muteBtn.style.background = "#b8860b";
muteBtn.style.color = "#fff";
muteBtn.style.border = "none";
muteBtn.addEventListener("click", toggleMute);
document.getElementById("game").appendChild(muteBtn);

// Используем звуки в логике:

mineBtn.addEventListener("click", () => {
  if (isMuted === false) playMineSound();
  coins += miningPower;
  updateCoinsUI();
  saveGame();
});

upgradeBtn.addEventListener("click", () => {
  if (coins >= upgradeCost) {
    coins -= upgradeCost;
    miningPower += 1;
    upgradeCost = Math.floor(upgradeCost * 2.2);
    updateCoinsUI();
    updateUpgradeButton();
    if (!isMuted) playUpgradeSound();
    saveGame();
    errorGame.textContent = "";
  } else {
    errorGame.textContent = "Недостаточно золота для улучшения!";
    if (!isMuted) playErrorSound();
  }
});

logoutBtn.addEventListener("click", () => {
  signOut(auth);
  if (!isMuted) playClickSound();
  showAuth();
});

// И не забудь обновить функции updateCoinsUI и updateUpgradeButton для обновления интерфейса:

function updateCoinsUI() {
  coinsDiv.textContent = `Золото: ${coins}`;
}
function updateUpgradeButton() {
  upgradeBtn.textContent = `Улучшить добычу (стоимость: ${upgradeCost})`;
  upgradeBtn.disabled = coins < upgradeCost;
}

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
