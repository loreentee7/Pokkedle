// script.js

import { fetchPokemonById } from './src/api/pokemonApi.js';
import { getDailyPokemonId } from './src/utils/randomPokemon.js';

const MAX_ATTEMPTS = 6;
let attempts = [];
let dailyPokemonName = '';
let dailyPokemonSprite = '';
let isGameOver = false;

document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('login-btn');
    const userInfo = document.getElementById('user-info');
    const usernameSpan = document.getElementById('username');
    const logoutBtn = document.getElementById('logout-btn');

    const currentUser = localStorage.getItem('pokkedle-current-user');
    if (currentUser) {
        loginBtn.style.display = 'none';
        userInfo.classList.remove('hidden');
        usernameSpan.textContent = `¡Hola, ${currentUser}!`;
    } else {
        loginBtn.style.display = 'inline-block';
        userInfo.classList.add('hidden');
    }

    loginBtn.onclick = () => window.location.href = 'login.html';
    if (logoutBtn) {
        logoutBtn.onclick = () => {
            localStorage.removeItem('pokkedle-current-user');
            window.location.reload();
        };
    }
});

// Asigna el evento para cerrar el modal SIEMPRE, fuera de DOMContentLoaded
const modal = document.getElementById('modal');
const modalSprite = document.getElementById('pokemon-sprite');
const closeModal = document.getElementById('close-modal');
if (closeModal) {
    closeModal.onclick = () => {
        modal.classList.add('hidden');
        if (modalSprite) modalSprite.style.filter = '';
    };
}

document.addEventListener('DOMContentLoaded', async () => {
    const pokemonId = getDailyPokemonId();
    const pokemon = await fetchPokemonById(pokemonId);
    dailyPokemonName = pokemon.name.toLowerCase();
    dailyPokemonSprite = pokemon.sprites.front_default;

    const guessInput = document.getElementById('guess-input');
    const submitButton = document.getElementById('submit-guess');
    const guessGrid = document.getElementById('guess-grid');
    const resultContainer = document.getElementById('result-container');
    const resultMessage = document.getElementById('result-message');
    const countdownTimer = document.getElementById('countdown-timer');
    const remainingAttempts = document.getElementById('remaining-attempts');
    const errorMessage = document.getElementById('error-message');
    const modalMessage = document.getElementById('modal-message');
    let hint1Used = false;
    let hint2Used = false;

    const savedState = JSON.parse(localStorage.getItem('pokkedle-state'));
    if (savedState && savedState.date !== new Date().toDateString()) {
        localStorage.removeItem('pokkedle-state');
    }

    const savedState2 = JSON.parse(localStorage.getItem('pokkedle-state'));
    if (savedState2 && savedState2.date === new Date().toDateString() && savedState2.isGameOver) {
        isGameOver = true;
        guessInput.disabled = true;
        submitButton.disabled = true;

        // Restaura los intentos en la interfaz
        if (Array.isArray(savedState2.attempts)) {
            attempts = savedState2.attempts;
            renderAttempts(attempts);
        }

        // Si la partida terminó, muestra el modal
        if (savedState2.message && savedState2.sprite) {
            showModal(savedState2.message, savedState2.sprite);
        }
        return;
    } else {
        // Si no está terminado, deja el input habilitado y restaura intentos si existen
        if (savedState2 && savedState2.date === new Date().toDateString()) {
            if (Array.isArray(savedState2.attempts)) {
                attempts = savedState2.attempts;
                renderAttempts(attempts);
            }
        }
        guessInput.disabled = false;
        submitButton.disabled = false;
        isGameOver = false;
    }

    // Temporizador en tiempo real (esto debe ir SIEMPRE, no solo si el juego no ha terminado)
    startCountdown();

    submitButton.addEventListener('click', handleGuess);
    guessInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            handleGuess();
        }
    });

    function updateHintButtons() {
        // Pista 1: letras, activa a los 3 intentos
        if (attempts.length >= 3 && !hint1Used && !isGameOver) {
            hint1Btn.disabled = false;
            hint1Btn.classList.add('enabled');
        } else {
            hint1Btn.disabled = true;
            hint1Btn.classList.remove('enabled');
        }
        // Pista 2: silueta, activa a los 5 intentos
        if (attempts.length >= 5 && !hint2Used && !isGameOver) {
            hint2Btn.disabled = false;
            hint2Btn.classList.add('enabled');
        } else {
            hint2Btn.disabled = true;
            hint2Btn.classList.remove('enabled');
        }
    }

    // Llama a updateHintButtons en los lugares necesarios:
    updateHintButtons();

    // Después de cada intento:
    function handleGuess() {
        if (isGameOver) return;

        const guess = guessInput.value.toLowerCase().trim();
        if (!guess) return;

        validatePokemon(guess).then((isValid) => {
            if (!isValid) {
                errorMessage.classList.remove('hidden');
                setTimeout(() => errorMessage.classList.add('hidden'), 2000);
                return;
            }

            errorMessage.classList.add('hidden');
            if (attempts.length < MAX_ATTEMPTS) {
                attempts.push(guess);
                remainingAttempts.textContent = MAX_ATTEMPTS - attempts.length;
                addGuessToGrid(guess, dailyPokemonName);
                guessInput.value = '';

                // Guarda el progreso tras cada intento en Supabase
                supabase.auth.getUser().then(({ data: { user } }) => {
                    if (user) {
                        addPokemonToPokedex(dailyPokemonName, false, attempts);
                    }
                });

                updateHintButtons();

                if (guess === dailyPokemonName) {
                    endGame(true);
                } else if (attempts.length === MAX_ATTEMPTS) {
                    endGame(false);
                }
            }
        });
    }

    async function validatePokemon(name) {
        try {
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
            return response.ok;
        } catch {
            return false;
        }
    }

    function addGuessToGrid(guess, target) {
        const row = document.createElement('div');
        row.classList.add('guess-row');

        for (let i = 0; i < target.length; i++) {
            const box = document.createElement('div');
            box.classList.add('letter-box');

            const letter = guess[i] || '';
            box.textContent = letter;

            if (letter === target[i]) {
                box.classList.add('correct');
            } else if (target.includes(letter)) {
                box.classList.add('partial');
            } else {
                box.classList.add('wrong');
            }

            row.appendChild(box);
        }

        guessGrid.appendChild(row);
    }

    function renderAttempts(attempts) {
        guessGrid.innerHTML = '';
        attempts.forEach(guess => {
            addGuessToGrid(guess, dailyPokemonName);
        });
    }

    function endGame(isWin) {
        isGameOver = true;
        guessInput.disabled = true;
        submitButton.disabled = true;
        hint1Btn.disabled = true;
        hint1Btn.classList.remove('enabled');
        hint2Btn.disabled = true;
        hint2Btn.classList.remove('enabled');

        if (isWin) {
            // Guarda el progreso en Supabase SOLO si el usuario está logueado
            supabase.auth.getUser().then(({ data: { user } }) => {
                if (user) {
                    addPokemonToPokedex(dailyPokemonName, true, attempts.length);
                }
            });
            showModal('¡Felicidades! Adivinaste el Pokémon del día.', dailyPokemonSprite);
        } else {
            showModal(`¡Has perdido! El Pokémon era ${dailyPokemonName}.`, dailyPokemonSprite);
        }
    }

    function showModal(message, spriteUrl, isSilhouette = false) {
        modalMessage.textContent = message;
        if (spriteUrl) {
            modalSprite.src = spriteUrl;
            modalSprite.style.display = 'block';

            // Limpia SIEMPRE el filtro antes de mostrar
            modalSprite.style.filter = '';

            // Si es silueta, aplica filtro (usa setTimeout para asegurar que se aplica después de mostrar la imagen)
            if (isSilhouette) {
                setTimeout(() => {
                    modalSprite.style.filter = 'brightness(0) saturate(100%) invert(0) sepia(0) saturate(0) hue-rotate(0deg) brightness(0.2)';
                }, 10);
            }
        } else {
            modalSprite.src = '';
            modalSprite.style.display = 'none';
        }
        modal.classList.remove('hidden');
    }

    function startCountdown() {
        function updateTimer() {
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setHours(24, 0, 0, 0); // Medianoche próxima

            let timeLeft = tomorrow - now;
            if (timeLeft <= 0) {
                location.reload();
                return;
            }

            const hours = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((timeLeft / (1000 * 60)) % 60);
            const seconds = Math.floor((timeLeft / 1000) % 60);

            const timerElem = document.getElementById('countdown-timer');
            if (timerElem) {
                timerElem.textContent =
                    `${hours.toString().padStart(2, '0')}:` +
                    `${minutes.toString().padStart(2, '0')}:` +
                    `${seconds.toString().padStart(2, '0')}`;
            }
        }
        updateTimer();
        setInterval(updateTimer, 1000);
    }

    // Llama a updateHintButton al cargar y tras restaurar estado
    updateHintButtons();

    // Pista 1: letras
    hint1Btn.addEventListener('click', () => {
        if (hint1Btn.disabled || hint1Used || isGameOver) return;
        hint1Used = true;
        hint1Btn.disabled = true;
        hint1Btn.classList.remove('enabled');
        let randomIndex = Math.floor(Math.random() * (dailyPokemonName.length - 2)) + 1;
        showModal(
            `Pista: El nombre empieza por "${dailyPokemonName[0].toUpperCase()}" y contiene la letra "${dailyPokemonName[randomIndex].toUpperCase()}"`,
            ''
        );
        modalSprite.style.filter = '';
    });

    // Pista 2: silueta
    hint2Btn.addEventListener('click', async () => {
        if (hint2Btn.disabled || hint2Used || isGameOver) return;
        hint2Used = true;
        hint2Btn.disabled = true;
        hint2Btn.classList.remove('enabled');
        // Genera la silueta real y muéstrala
        const silhouetteUrl = await getSilhouetteDataUrl(dailyPokemonSprite);
        showModal('Pista: Aquí tienes la silueta del Pokémon.', silhouetteUrl);
    });
});

// Al cargar la página, consulta el estado del usuario en Supabase
window.addEventListener('DOMContentLoaded', async () => {
    // Carga el estado del usuario desde Supabase
    const state = await getTodayPokemonState();
    let attempts = [];
    let isGameOver = false;

    if (state) {
        attempts = Array.isArray(state.intentos) ? state.intentos : [];
        renderAttempts(attempts);
        if (state.guessed) {
            isGameOver = true;
            guessInput.disabled = true;
            submitButton.disabled = true;
            showModal('¡Ya adivinaste el Pokémon de hoy!', dailyPokemonSprite);
        }
    } else {
        // No hay progreso previo
        attempts = [];
        renderAttempts(attempts);
        guessInput.disabled = false;
        submitButton.disabled = false;
        isGameOver = false;
    }

    // Maneja el intento del usuario
    submitButton.onclick = async function () {
        if (isGameOver) return;
        const guess = guessInput.value.trim().toLowerCase();
        if (!guess) return;
        attempts.push(guess);
        renderAttempts(attempts);
        updateHintButtons();

        if (guess === dailyPokemonName) {
            isGameOver = true;
            guessInput.disabled = true;
            submitButton.disabled = true;
            await saveTodayPokemonState(true, attempts);
            showModal('¡Felicidades! Adivinaste el Pokémon del día.', dailyPokemonSprite);
        } else if (attempts.length >= MAX_ATTEMPTS) {
            isGameOver = true;
            guessInput.disabled = true;
            submitButton.disabled = true;
            await saveTodayPokemonState(false, attempts);
            showModal(`¡Has perdido! El Pokémon era ${dailyPokemonName}.`, dailyPokemonSprite);
        } else {
            await saveTodayPokemonState(false, attempts);
        }
    };
});

function getSilhouetteDataUrl(spriteUrl) {
    return new Promise((resolve) => {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.onload = function () {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            // Convierte todos los píxeles no transparentes a negro
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < imageData.data.length; i += 4) {
                if (imageData.data[i + 3] > 0) { // Si no es transparente
                    imageData.data[i] = 30;   // R
                    imageData.data[i + 1] = 30; // G
                    imageData.data[i + 2] = 30; // B
                    imageData.data[i + 3] = 255; // A
                }
            }
            ctx.putImageData(imageData, 0, 0);
            resolve(canvas.toDataURL());
        };
        img.src = spriteUrl;
    });
}

async function addPokemonToPokedex(pokemonName, guessed, attemptArray) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('pokedex').upsert([
        { user_id: user.id, pokemon_name: pokemonName, guessed, intentos: attemptArray }
    ], { onConflict: ['user_id', 'pokemon_name'] });
}

async function getTodayPokemonState() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase
        .from('pokedex')
        .select('guessed, intentos')
        .eq('user_id', user.id)
        .eq('pokemon_name', dailyPokemonName)
        .single();
    if (error || !data) return null;
    return data; // { guessed: true/false, intentos: [...] }
}

async function saveTodayPokemonState(guessed, attempts) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('pokedex').upsert([
        {
            user_id: user.id, // <-- ¡Esto es CLAVE!
            pokemon_name: dailyPokemonName,
            guessed,
            intentos: attempts
        }
    ], { onConflict: ['user_id', 'pokemon_name'] });
}

async function resetTodayPokemonForUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
        .from('pokedex')
        .delete()
        .eq('user_id', user.id)
        .eq('pokemon_name', dailyPokemonName);
}

// Llama a esta función desde la consola del navegador para probar:
resetTodayPokemonForUser();