function getRandomPokemon(pokemonList) {
    const randomIndex = Math.floor(Math.random() * pokemonList.length);
    return pokemonList[randomIndex];
}

export { getRandomPokemon };

export function getDailyPokemonId() {
    const totalPokemon = 1010;
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

    // Simple hash function para la fecha
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
        hash = dateStr.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash; // Convierte a 32 bits
    }
    const random = Math.abs(hash) % totalPokemon;
    return random + 1;
}