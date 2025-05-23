// script.js

import { fetchPokemonById } from './src/api/pokemonApi.js';
import { getDailyPokemonId } from './src/utils/randomPokemon.js';

const MAX_ATTEMPTS = 6;
let attempts = 0;
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
    const modal = document.getElementById('modal');
    const modalMessage = document.getElementById('modal-message');
    const modalSprite = document.getElementById('pokemon-sprite');
    const closeModal = document.getElementById('close-modal');

    const savedState = JSON.parse(localStorage.getItem('pokkedle-state'));
    if (savedState && savedState.date === new Date().toDateString()) {
        isGameOver = true;
        guessInput.disabled = true;
        submitButton.disabled = true;
        resultContainer.classList.remove('hidden');
        resultMessage.textContent = savedState.message;
        startCountdown();
        return;
    }

    // Temporizador en tiempo real
    startCountdown();

    submitButton.addEventListener('click', handleGuess);
    guessInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            handleGuess();
        }
    });

    if (closeModal) {
        closeModal.onclick = () => {
            modal.classList.add('hidden');
        };
    }

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
            if (attempts < MAX_ATTEMPTS) {
                attempts++;
                remainingAttempts.textContent = MAX_ATTEMPTS - attempts;
                addGuessToGrid(guess, dailyPokemonName);
                guessInput.value = '';

                if (guess === dailyPokemonName) {
                    endGame(true);
                } else if (attempts === MAX_ATTEMPTS) {
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

    function endGame(isWin) {
        isGameOver = true;
        guessInput.disabled = true;
        submitButton.disabled = true;

        // Guarda el estado de la partida
        localStorage.setItem('pokkedle-state', JSON.stringify({
            date: new Date().toDateString(),
            isGameOver: true,
            isWin,
            message: isWin
                ? '¡Felicidades! Adivinaste el Pokémon del día.'
                : `¡Has perdido! El Pokémon era ${dailyPokemonName}.`
        }));

        if (isWin) {
            // --- NUEVO: Guardar en la pokedex personal si está logueado ---
            const currentUser = localStorage.getItem('pokkedle-current-user');
            if (currentUser) {
                let users = JSON.parse(localStorage.getItem('pokkedle-users') || '{}');
                if (users[currentUser]) {
                    if (!users[currentUser].pokedex) users[currentUser].pokedex = [];
                    // Evita duplicados
                    if (!users[currentUser].pokedex.includes(dailyPokemonName)) {
                        users[currentUser].pokedex.push(dailyPokemonName);
                        localStorage.setItem('pokkedle-users', JSON.stringify(users));
                    }
                }
            }
            showModal('¡Felicidades! Adivinaste el Pokémon del día.', dailyPokemonSprite);
        } else {
            showModal(`¡Has perdido! El Pokémon era ${dailyPokemonName}.`, dailyPokemonSprite);
        }
    }

    function showModal(message, spriteUrl) {
        modalMessage.textContent = message;
        modalSprite.src = spriteUrl;
        modal.classList.remove('hidden');
    }

    function startCountdown() {
        function updateTimer() {
            const now = new Date();
            const tomorrow = new Date();
            tomorrow.setHours(24, 0, 0, 0);

            const timeLeft = tomorrow - now;
            if (timeLeft <= 0) {
                location.reload();
                return;
            }

            const hours = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((timeLeft / (1000 * 60)) % 60);
            const seconds = Math.floor((timeLeft / 1000) % 60);

            countdownTimer.textContent = `${hours.toString().padStart(2, '0')}:${minutes
                .toString()
                .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        updateTimer();
        setInterval(updateTimer, 1000);
    }
});
