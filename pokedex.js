const TOTAL_POKEMON = 1010; // Puedes ajustar este número según la generación

window.addEventListener('DOMContentLoaded', async () => {
    const pokedexList = document.getElementById('pokedex-list');
    const currentUser = localStorage.getItem('pokkedle-current-user');
    if (!currentUser) {
        pokedexList.innerHTML = '<p>Debes iniciar sesión para ver tu Pokédex.</p>';
        return;
    }

    let users = JSON.parse(localStorage.getItem('pokkedle-users') || '{}');
    const pokedex = users[currentUser]?.pokedex || [];

    pokedexList.innerHTML = '<div id="pokedex-grid"></div>';
    const container = document.getElementById('pokedex-grid');

    for (let id = 1; id <= TOTAL_POKEMON; id++) {
        // Obtener nombre y sprite
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
        if (!res.ok) continue;
        const poke = await res.json();
        const unlocked = pokedex.includes(poke.name.toLowerCase());

        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.flexDirection = 'column';
        div.style.alignItems = 'center';
        div.style.width = '90px';
        div.style.fontSize = '0.95rem';

        // Si no está desbloqueado, mostrar silueta negra
        let imgSrc = poke.sprites.front_default;
        let imgStyle = unlocked
            ? ''
            : 'filter: brightness(0) saturate(100%) invert(0) sepia(0) saturate(0) hue-rotate(0deg) brightness(0.2);';

        div.innerHTML = `
            <span style="font-size:0.9em;color:#444;">#${poke.id}</span>
            <img src="${imgSrc}" alt="${poke.name}" style="width:60px;${imgStyle}">
            <span style="margin-top:4px;font-weight:600;text-transform:capitalize;color:${unlocked ? '#222' : '#888'}">
                ${unlocked ? poke.name : '???'}
            </span>
        `;
        container.appendChild(div);
    }
});