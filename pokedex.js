const TOTAL_POKEMON = 1010;
const PAGE_SIZE = 20;

// Obtén el usuario actual y su pokedex
const currentUser = localStorage.getItem('pokkedle-current-user');
let users = JSON.parse(localStorage.getItem('pokkedle-users') || '{}');
let pokedex = [];

if (currentUser && users[currentUser] && Array.isArray(users[currentUser].pokedex)) {
    pokedex = users[currentUser].pokedex;
}

document.getElementById('completed-count').textContent = pokedex.length;
document.getElementById('total-count').textContent = TOTAL_POKEMON;

// Función para generar silueta real
async function getSilhouetteDataUrl(spriteUrl) {
    return new Promise((resolve) => {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.onload = function () {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < imageData.data.length; i += 4) {
                if (imageData.data[i + 3] > 0) {
                    imageData.data[i] = 30;
                    imageData.data[i + 1] = 30;
                    imageData.data[i + 2] = 30;
                    imageData.data[i + 3] = 255;
                }
            }
            ctx.putImageData(imageData, 0, 0);
            resolve(canvas.toDataURL());
        };
        img.src = spriteUrl;
    });
}

// Crea elementos de UI
function createUI() {
    const pokedexList = document.getElementById('pokedex-list');
    pokedexList.innerHTML = `
        <div style="margin-bottom:10px;">
            <input id="search-pokemon" type="text" placeholder="Buscar por nombre o número..." style="padding:4px 8px; width:180px;">
            <select id="filter-pokemon" style="padding:4px 8px;">
                <option value="all">Todos</option>
                <option value="caught">Capturados</option>
                <option value="uncaught">No capturados</option>
            </select>
        </div>
        <div id="pokedex-grid" style="display:flex;flex-wrap:wrap;gap:10px;"></div>
        <div id="pagination" style="margin-top:10px;text-align:center;"></div>
        <div id="stats" style="margin-top:10px;font-size:0.95em;color:#555;"></div>
        <div id="modal-detail" style="display:none;position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.5);align-items:center;justify-content:center;z-index:1000;">
            <div style="background:#fff;padding:24px 32px;border-radius:12px;min-width:220px;max-width:90vw;position:relative;">
                <span id="close-modal-detail" style="position:absolute;top:8px;right:16px;cursor:pointer;font-size:1.5em;">&times;</span>
                <div id="modal-content-detail"></div>
            </div>
        </div>
    `;
}
createUI();

const pokedexGrid = document.getElementById('pokedex-grid');
const searchInput = document.getElementById('search-pokemon');
const filterSelect = document.getElementById('filter-pokemon');
const paginationDiv = document.getElementById('pagination');
const statsDiv = document.getElementById('stats');
const modalDetail = document.getElementById('modal-detail');
const modalContentDetail = document.getElementById('modal-content-detail');
const closeModalDetail = document.getElementById('close-modal-detail');

if (closeModalDetail) {
    closeModalDetail.onclick = () => {
        modalDetail.style.display = 'none';
    };
}

let allPokemon = [];
let filteredPokemon = [];
let currentPage = 1;

async function fetchAllPokemon() {
    allPokemon = [];
    for (let id = 1; id <= TOTAL_POKEMON; id++) {
        try {
            const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
            if (!res.ok) continue;
            const poke = await res.json();
            allPokemon.push({
                id: poke.id,
                name: poke.name,
                sprite: poke.sprites.front_default,
                types: poke.types.map(t => t.type.name),
                height: poke.height,
                weight: poke.weight,
                base_experience: poke.base_experience,
                unlocked: pokedex.includes(poke.name.toLowerCase())
            });
        } catch {
            // Si falla, ignora ese Pokémon
        }
    }
}

function filterAndSearch() {
    const search = searchInput.value.trim().toLowerCase();
    const filter = filterSelect.value;
    filteredPokemon = allPokemon.filter(poke => {
        let matches = true;
        if (search) {
            matches = poke.name.toLowerCase().includes(search) || poke.id.toString() === search;
        }
        if (filter === 'caught') matches = matches && poke.unlocked;
        if (filter === 'uncaught') matches = matches && !poke.unlocked;
        return matches;
    });
    currentPage = 1;
    renderGrid();
}

function renderGrid() {
    pokedexGrid.innerHTML = '';
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const pagePokemon = filteredPokemon.slice(start, end);

    pagePokemon.forEach(async poke => {
        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.flexDirection = 'column';
        div.style.alignItems = 'center';
        div.style.width = '90px';
        div.style.fontSize = '0.95rem';
        div.style.cursor = poke.unlocked ? 'pointer' : 'default';
        div.style.transition = 'transform 0.2s';
        div.className = poke.unlocked ? 'poke-unlocked' : 'poke-locked';

        let imgTag = '';
        if (poke.unlocked) {
            imgTag = `<img src="${poke.sprite}" alt="${poke.name}" style="width:60px;">`;
        } else {
            const silhouetteUrl = poke.sprite ? await getSilhouetteDataUrl(poke.sprite) : '';
            imgTag = `<img src="${silhouetteUrl}" alt="???" style="width:60px;">`;
        }

        div.innerHTML = `
            <span style="font-size:0.9em;color:#444;">#${poke.id}</span>
            ${imgTag}
            <span style="margin-top:4px;font-weight:600;text-transform:capitalize;color:${poke.unlocked ? '#222' : '#888'}">
                ${poke.unlocked ? poke.name : '???'}
            </span>
        `;

        if (poke.unlocked) {
            div.onclick = () => showDetailModal(poke);
            // Animación simple al desbloquear
            div.onmouseenter = () => { div.style.transform = 'scale(1.08)'; };
            div.onmouseleave = () => { div.style.transform = 'scale(1)'; };
        }

        pokedexGrid.appendChild(div);
    });

    renderPagination();
    renderStats();
}

function renderPagination() {
    const totalPages = Math.ceil(filteredPokemon.length / PAGE_SIZE);
    if (totalPages <= 1) {
        paginationDiv.innerHTML = '';
        return;
    }

    let html = `<div class="pokedex-pagination">`;

    // Flecha izquierda
    html += `<button class="pokedex-pagination-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="window.goToPage(${currentPage - 1})">&lt;</button>`;

    // Páginas (máx 5 visibles: primero, ..., actual-1, actual, actual+1, ..., último)
    let start = Math.max(1, currentPage - 1);
    let end = Math.min(totalPages, currentPage + 1);

    if (currentPage > 2) {
        html += `<button class="pokedex-pagination-btn" onclick="window.goToPage(1)">1</button>`;
        if (currentPage > 3) html += `<span class="pokedex-pagination-ellipsis">…</span>`;
    }
    for (let i = start; i <= end; i++) {
        html += `<button class="pokedex-pagination-btn${i === currentPage ? ' active' : ''}" onclick="window.goToPage(${i})">${i}</button>`;
    }
    if (currentPage < totalPages - 1) {
        if (currentPage < totalPages - 2) html += `<span class="pokedex-pagination-ellipsis">…</span>`;
        html += `<button class="pokedex-pagination-btn" onclick="window.goToPage(${totalPages})">${totalPages}</button>`;
    }

    // Flecha derecha
    html += `<button class="pokedex-pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="window.goToPage(${currentPage + 1})">&gt;</button>`;

    html += `</div>`;
    paginationDiv.innerHTML = html;

    // Exponer función global para los botones
    window.goToPage = (page) => {
        if (page < 1 || page > totalPages) return;
        currentPage = page;
        renderGrid();
    };
}

function renderStats() {
    const total = allPokemon.length;
    const caught = allPokemon.filter(p => p.unlocked).length;
    const percent = total ? Math.round((caught / total) * 100) : 0;
    statsDiv.innerHTML = `Pokémon capturados: <b>${caught}</b> de <b>${total}</b> (${percent}%)`;
}

function showDetailModal(poke) {
    modalContentDetail.innerHTML = `
        <div style="text-align:center;">
            <img src="${poke.sprite}" alt="${poke.name}" style="width:90px;">
            <h2 style="margin:8px 0 4px 0;text-transform:capitalize;">${poke.name}</h2>
            <div style="margin-bottom:6px;">
                <span style="background:#eee;padding:2px 8px;border-radius:8px;margin-right:4px;">#${poke.id}</span>
                ${poke.types.map(t => `<span style="background:#${typeColor(t)};color:#fff;padding:2px 8px;border-radius:8px;margin-right:4px;">${t}</span>`).join('')}
            </div>
            <div style="font-size:0.95em;">
                <b>Altura:</b> ${poke.height / 10} m<br>
                <b>Peso:</b> ${poke.weight / 10} kg<br>
                <b>Experiencia base:</b> ${poke.base_experience}
            </div>
        </div>
    `;
    modalDetail.style.display = 'flex';
}

// Colores para tipos de Pokémon
function typeColor(type) {
    const colors = {
        normal: 'A8A77A', fire: 'EE8130', water: '6390F0', electric: 'F7D02C', grass: '7AC74C',
        ice: '96D9D6', fighting: 'C22E28', poison: 'A33EA1', ground: 'E2BF65', flying: 'A98FF3',
        psychic: 'F95587', bug: 'A6B91A', rock: 'B6A136', ghost: '735797', dragon: '6F35FC',
        dark: '705746', steel: 'B7B7CE', fairy: 'D685AD'
    };
    return colors[type] || '888';
}

// Eventos de búsqueda y filtro
searchInput.addEventListener('input', filterAndSearch);
filterSelect.addEventListener('change', filterAndSearch);

// Inicializa la Pokédex
window.addEventListener('DOMContentLoaded', async () => {
    if (!currentUser) {
        document.getElementById('pokedex-list').innerHTML = '<p>Debes iniciar sesión para ver tu Pokédex.</p>';
        return;
    }
    await fetchAllPokemon();
    filterAndSearch();
});

async function getUserPokedex() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        // Si no hay usuario, devuelve vacío
        return [];
    }
    const { data, error } = await supabase
        .from('pokedex')
        .select('pokemon_name, guessed, intentos')
        .eq('user_id', user.id);
    if (error) return [];
    return data;
}

// Ejemplo de uso:
window.addEventListener('DOMContentLoaded', async () => {
    const pokedex = await getUserPokedex();
    // Renderiza la pokédex SOLO con estos datos
    // Si pokedex.length === 0, muestra vacía
});

