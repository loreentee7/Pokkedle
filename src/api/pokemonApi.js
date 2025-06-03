const API_URL = 'https://pokeapi.co/api/v2/pokemon';

export const fetchRandomPokemon = async () => {
    const response = await fetch(API_URL + '/' + Math.floor(Math.random() * 898));
    if (!response.ok) {
        throw new Error('Failed to fetch Pokémon');
    }
    return await response.json();
};

export async function fetchPokemonById(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        if (!response.ok) {
            throw new Error('Failed to fetch Pokémon');
        }
        return await response.json();
    } catch (error) {
        console.error(error);
    }
}

export const fetchAllGenerations = async () => {
    const response = await fetch('https://pokeapi.co/api/v2/generation');
    if (!response.ok) {
        throw new Error('Failed to fetch generations');
    }
    return await response.json();
};