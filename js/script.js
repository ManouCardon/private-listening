async function loadEpisodes() {
    const response = await fetch("data/episodes.json");
    const episodes = await response.json();

    const container = document.querySelector(".episodes");
    container.innerHTML = "";

    episodes.forEach(episode => {

        const div = document.createElement("div");
        div.className = "episode";

        div.innerHTML = `
            <h2>${episode.title}</h2>

            <audio controls>
                <source src="audio/${episode.file}" type="audio/mpeg">
            </audio>
        `;

        container.appendChild(div);
    });
}

loadEpisodes();