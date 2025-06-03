// script.js

import { fetchPokemonById } from './src/api/pokemonApi.js';
import { getDailyPokemonId } from './src/utils/randomPokemon.js';

let attempts = [];
let isGameOver = false;
let hint1Used = false;
let hint2Used = false;
const MAX_ATTEMPTS = 6;
let dailyPokemonName = '';
let dailyPokemonSprite = '';

// Elementos del DOM
const guessInput = document.getElementById('guess-input');
const submitButton = document.getElementById('submit-guess');
const guessGrid = document.getElementById('guess-grid');
const remainingAttempts = document.getElementById('remaining-attempts');
const hint1Btn = document.getElementById('hint1-btn');
const hint2Btn = document.getElementById('hint2-btn');
const errorMessage = document.getElementById('error-message');

// Función para obtener el estado del usuario en Supabase
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

// Función para guardar el estado tras cada intento
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

// Renderiza los intentos
function renderAttempts(attemptsArr) {
    guessGrid.innerHTML = '';
    attemptsArr.forEach(guess => {
        const row = document.createElement('div');
        row.textContent = guess;
        guessGrid.appendChild(row);
    });
    remainingAttempts.textContent = MAX_ATTEMPTS - attemptsArr.length;
}

// Modal simple (ajusta según tu modal real)
function showModal(message, spriteUrl) {
    alert(message); // O usa tu modal real
}

// Actualiza los botones de pista
function updateHintButtons() {
    if (attempts.length >= 3 && !hint1Used && !isGameOver) {
        hint1Btn.disabled = false;
    } else {
        hint1Btn.disabled = true;
    }
    if (attempts.length >= 5 && !hint2Used && !isGameOver) {
        hint2Btn.disabled = false;
    } else {
        hint2Btn.disabled = true;
    }
}

// Lógica principal al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
    // Obtén el Pokémon del día
    const pokemonId = getDailyPokemonId();
    const pokemon = await fetchPokemonById(pokemonId);
    dailyPokemonName = pokemon.name.toLowerCase();
    dailyPokemonSprite = pokemon.sprites.front_default;

    // Restaura el estado desde Supabase
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

    // Evento para adivinar
    submitButton.onclick = async function () {
        if (isGameOver) return;
        const guess = guessInput.value.trim().toLowerCase();
        if (!guess || attempts.includes(guess)) return;
        // Opcional: valida si existe el Pokémon antes de continuar
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

    // Pistas
    hint1Btn.onclick = async () => {
        if (hint1Btn.disabled || hint1Used || isGameOver) return;
        hint1Used = true;
        updateHintButtons();
        await saveTodayPokemonState(isGameOver, attempts, hint1Used, hint2Used);
        let randomIndex = Math.floor(Math.random() * (dailyPokemonName.length - 2)) + 1;
        showModal(
            `Pista: El nombre empieza por "${dailyPokemonName[0].toUpperCase()}" y contiene la letra "${dailyPokemonName[randomIndex].toUpperCase()}"`,
            ''
        );
    };

    hint2Btn.onclick = async () => {
        if (hint2Btn.disabled || hint2Used || isGameOver) return;
        hint2Used = true;
        updateHintButtons();
        await saveTodayPokemonState(isGameOver, attempts, hint1Used, hint2Used);
        // Aquí pon tu lógica para mostrar la silueta
        showModal('Pista: Aquí tienes la silueta del Pokémon.', dailyPokemonSprite);
    };
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