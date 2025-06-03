// script.js

import { fetchPokemonById } from './src/api/pokemonApi.js';
import { getDailyPokemonId } from './src/utils/randomPokemon.js';

let attempts = [];
let isGameOver = false;
let hint1Used = false;
let hint2Used = false;
const MAX_ATTEMPTS = 6; // Cambia si tu juego usa otro número
// dailyPokemonName y dailyPokemonSprite deben estar definidos en tu código

// 1. Estado desde Supabase
async function getTodayPokemonState() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase
        .from('pokedex')
        .select('guessed, intentos, hint1Used, hint2Used')
        .eq('user_id', user.id)
        .eq('pokemon_name', dailyPokemonName)
        .single();
    return data || null;
}

// 2. Guardar estado en Supabase
async function saveTodayPokemonState(guessed, attempts, hint1Used, hint2Used) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('pokedex').upsert([
        {
            user_id: user.id,
            pokemon_name: dailyPokemonName,
            guessed,
            intentos: attempts,
            hint1Used,
            hint2Used
        }
    ], { onConflict: ['user_id', 'pokemon_name'] });
}

// 3. Actualizar botones de pista
function updateHintButtons() {
    // Pista 1: activa a los 3 intentos fallidos
    if (attempts.length >= 3 && !hint1Used && !isGameOver) {
        hint1Btn.disabled = false;
        hint1Btn.classList.add('enabled');
    } else {
        hint1Btn.disabled = true;
        hint1Btn.classList.remove('enabled');
    }
    // Pista 2: activa a los 5 intentos fallidos
    if (attempts.length >= 5 && !hint2Used && !isGameOver) {
        hint2Btn.disabled = false;
        hint2Btn.classList.add('enabled');
    } else {
        hint2Btn.disabled = true;
        hint2Btn.classList.remove('enabled');
    }
}

// 4. Renderizar intentos (ajusta según tu HTML)
function renderAttempts(attemptsArr) {
    const attemptsDiv = document.getElementById('attempts');
    if (!attemptsDiv) return;
    attemptsDiv.innerHTML = '';
    attemptsArr.forEach((guess, idx) => {
        const el = document.createElement('div');
        el.textContent = `Intento ${idx + 1}: ${guess}`;
        attemptsDiv.appendChild(el);
    });
}

// 5. Mostrar modal de ganar/perder
function showModal(message, spriteUrl) {
    // Ajusta según tu modal real
    alert(message); // O usa tu modal real
    // Si tienes un modal personalizado, pon aquí el código para mostrarlo
}

// 6. Lógica principal al cargar la página
window.addEventListener('DOMContentLoaded', async () => {
    const state = await getTodayPokemonState();
    attempts = [];
    isGameOver = false;
    hint1Used = false;
    hint2Used = false;

    if (state) {
        attempts = Array.isArray(state.intentos) ? state.intentos : [];
        hint1Used = !!state.hint1Used;
        hint2Used = !!state.hint2Used;
        renderAttempts(attempts);

        if (state.guessed) {
            isGameOver = true;
            guessInput.disabled = true;
            submitButton.disabled = true;
            showModal('¡Felicidades! Ya adivinaste el Pokémon de hoy.', dailyPokemonSprite);
        } else if (attempts.length >= MAX_ATTEMPTS) {
            isGameOver = true;
            guessInput.disabled = true;
            submitButton.disabled = true;
            showModal(`¡Has perdido! El Pokémon era ${dailyPokemonName}.`, dailyPokemonSprite);
        }
    } else {
        renderAttempts([]);
    }
    updateHintButtons();
});

// 7. Lógica del botón de enviar intento
submitButton.onclick = async function () {
    if (isGameOver) return;
    const guess = guessInput.value.trim().toLowerCase();
    if (!guess || attempts.includes(guess)) return; // No permite repetir
    attempts.push(guess);
    renderAttempts(attempts);
    updateHintButtons();

    if (guess === dailyPokemonName) {
        isGameOver = true;
        guessInput.disabled = true;
        submitButton.disabled = true;
        await saveTodayPokemonState(true, attempts, hint1Used, hint2Used);
        showModal('¡Felicidades! Adivinaste el Pokémon del día.', dailyPokemonSprite);
    } else if (attempts.length >= MAX_ATTEMPTS) {
        isGameOver = true;
        guessInput.disabled = true;
        submitButton.disabled = true;
        await saveTodayPokemonState(false, attempts, hint1Used, hint2Used);
        showModal(`¡Has perdido! El Pokémon era ${dailyPokemonName}.`, dailyPokemonSprite);
    } else {
        await saveTodayPokemonState(false, attempts, hint1Used, hint2Used);
    }
    guessInput.value = '';
};

// 8. Lógica de las pistas
hint1Btn.addEventListener('click', async () => {
    if (hint1Btn.disabled || hint1Used || isGameOver) return;
    hint1Used = true;
    updateHintButtons();
    await saveTodayPokemonState(isGameOver, attempts, hint1Used, hint2Used);
    let randomIndex = Math.floor(Math.random() * (dailyPokemonName.length - 2)) + 1;
    showModal(
        `Pista: El nombre empieza por "${dailyPokemonName[0].toUpperCase()}" y contiene la letra "${dailyPokemonName[randomIndex].toUpperCase()}"`,
        ''
    );
});

hint2Btn.addEventListener('click', async () => {
    if (hint2Btn.disabled || hint2Used || isGameOver) return;
    hint2Used = true;
    updateHintButtons();
    await saveTodayPokemonState(isGameOver, attempts, hint1Used, hint2Used);
    const silhouetteUrl = await getSilhouetteDataUrl(dailyPokemonSprite);
    showModal('Pista: Aquí tienes la silueta del Pokémon.', silhouetteUrl);
});

// Al cargar la página, consulta el estado del usuario en Supabase
window.addEventListener('DOMContentLoaded', async () => {
    const state = await getTodayPokemonState();
    attempts = [];
    isGameOver = false;
    hint1Used = false;
    hint2Used = false;

    if (state) {
        attempts = Array.isArray(state.intentos) ? state.intentos : [];
        hint1Used = !!state.hint1Used;
        hint2Used = !!state.hint2Used;
        renderAttempts(attempts);

        if (state.guessed) {
            isGameOver = true;
            guessInput.disabled = true;
            submitButton.disabled = true;
            showModal('¡Felicidades! Ya adivinaste el Pokémon de hoy.', dailyPokemonSprite);
        } else if (attempts.length >= MAX_ATTEMPTS) {
            isGameOver = true;
            guessInput.disabled = true;
            submitButton.disabled = true;
            showModal(`¡Has perdido! El Pokémon era ${dailyPokemonName}.`, dailyPokemonSprite);
        }
    }
    updateHintButtons();
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
        .select('guessed, intentos, hint1Used, hint2Used')
        .eq('user_id', user.id)
        .eq('pokemon_name', dailyPokemonName)
        .single();
    if (error || !data) return null;
    return data;
}

async function saveTodayPokemonState(guessed, attempts, hint1Used, hint2Used) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('pokedex').upsert([
        {
            user_id: user.id,
            pokemon_name: dailyPokemonName,
            guessed,
            intentos: attempts,
            hint1Used,
            hint2Used
        }
    ], { onConflict: ['user_id', 'pokemon_name'] });
}

// Llama a esta función desde la consola del navegador para probar:
resetTodayPokemonForUser();