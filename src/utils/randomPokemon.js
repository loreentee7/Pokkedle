function getRandomPokemon(pokemonList) {
    const randomIndex = Math.floor(Math.random() * pokemonList.length);
    return pokemonList[randomIndex];
}

export { getRandomPokemon };

export function getDailyPokemonId() {
    const totalPokemon = 1010; // Número total de Pokémon (ajusta según generaciones)
    const today = new Date();
    const dayOfYear = Math.floor(
        (Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) -
        Date.UTC(today.getFullYear(), 0, 0)) / 24 / 60 / 60 / 1000
    );
    return (dayOfYear % totalPokemon) + 1; // Asegura que el ID esté entre 1 y totalPokemon
}