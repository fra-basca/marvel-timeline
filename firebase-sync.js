// Salvataggio online dei progressi con Firebase (accesso Google + database Firestore).
//
// - Senza accesso: tutto come prima, le spunte restano nel browser.
// - Con accesso: ogni utente ha il proprio documento users/<id utente> nel database,
//   che si aggiorna in tempo reale su tutti i dispositivi.
// - Al primo accesso da un browser, le spunte già salvate lì vengono unite a quelle online
//   e poi tolte dal browser (così non "ritornano" dopo averle tolte da un altro dispositivo).
import { firebaseConfig } from "./firebase-config.js";

const SDK = "https://www.gstatic.com/firebasejs/10.12.2";
const authBox = document.getElementById("auth");

if (firebaseConfig && window.MarvelTimeline) {
  start().catch((err) => {
    console.error("Firebase non disponibile:", err);
    authBox.innerHTML = `<span class="auth-error">Salvataggio online non disponibile</span>`;
  });
}

async function start() {
  const { initializeApp } = await import(`${SDK}/firebase-app.js`);
  const { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } =
    await import(`${SDK}/firebase-auth.js`);
  const { getFirestore, doc, getDoc, setDoc, onSnapshot, serverTimestamp } =
    await import(`${SDK}/firebase-firestore.js`);

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const site = window.MarvelTimeline;
  let unsubscribe = null;

  // ---------- Pulsanti accesso / uscita ----------
  function showLoggedOut() {
    authBox.innerHTML = `
      <button type="button" class="auth-login" data-auth="login">
        <span class="auth-g" aria-hidden="true">G</span> Accedi con Google
      </button>`;
  }

  function showLoggedIn(user, status) {
    const name = (user.displayName || user.email || "").split(" ")[0];
    const photo = user.photoURL
      ? `<img src="${user.photoURL}" alt="" referrerpolicy="no-referrer">`
      : `<span class="auth-initial">${name.charAt(0).toUpperCase()}</span>`;
    authBox.innerHTML = `
      <span class="auth-user">${photo}<span>Ciao ${escapeHtml(name)}</span></span>
      <span class="auth-status">${status}</span>
      <button type="button" class="auth-logout" data-auth="logout">Esci</button>`;
  }

  authBox.addEventListener("click", async (e) => {
    const action = e.target.closest("[data-auth]")?.dataset.auth;
    if (action === "login") {
      try {
        await signInWithPopup(auth, new GoogleAuthProvider());
      } catch (err) {
        if (err.code !== "auth/popup-closed-by-user" && err.code !== "auth/cancelled-popup-request") {
          console.error(err);
          alert("Accesso non riuscito: " + (err.code || err.message));
        }
      }
    }
    if (action === "logout") await signOut(auth);
  });

  // ---------- Cambio di stato: accesso / uscita ----------
  onAuthStateChanged(auth, async (user) => {
    if (unsubscribe) { unsubscribe(); unsubscribe = null; }

    if (!user) {
      site.useLocal();
      showLoggedOut();
      return;
    }

    showLoggedIn(user, "Sincronizzazione…");
    const ref = doc(db, "users", user.uid);

    try {
      // Unisce le spunte di questo browser a quelle online (solo la prima volta che ce ne sono)
      const snap = await getDoc(ref);
      const remote = snap.exists() ? snap.data() : { seen: [], skipped: [], episodes: {} };
      const local = site.localProgress();
      const hasLocal = local.seen.length || local.skipped.length || Object.keys(local.episodes).length;
      if (!snap.exists() || hasLocal) {
        await setDoc(ref, { ...merge(remote, local), updatedAt: serverTimestamp() });
        site.clearLocal();
      }

      // Da qui in poi ogni spunta viene salvata online
      site.useCloud((data) => {
        setDoc(ref, { ...data, updatedAt: serverTimestamp() }).catch((err) => {
          console.error(err);
          showLoggedIn(user, `<span class="auth-error">Errore di salvataggio</span>`);
        });
      });

      // E ogni modifica (anche da altri dispositivi) arriva qui in tempo reale
      unsubscribe = onSnapshot(ref, (s) => {
        if (s.exists()) site.showRemote(s.data());
        showLoggedIn(user, "Salvato online ✓");
      });
    } catch (err) {
      console.error(err);
      const code = escapeHtml(err.code || err.message || "errore sconosciuto");
      showLoggedIn(user, `<span class="auth-error">Database non raggiungibile (${code})</span>`);
    }
  });
}

// Unione di due liste di progressi (nessuna spunta va persa)
function merge(a, b) {
  const seen = [...new Set([...(a.seen || []), ...(b.seen || [])])].sort();
  const skipped = [...new Set([...(a.skipped || []), ...(b.skipped || [])])].sort();
  const episodes = {};
  for (const src of [a.episodes || {}, b.episodes || {}]) {
    for (const [id, list] of Object.entries(src)) {
      episodes[id] = [...new Set([...(episodes[id] || []), ...list])].sort((x, y) => x - y);
    }
  }
  return { seen, skipped, episodes };
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}
