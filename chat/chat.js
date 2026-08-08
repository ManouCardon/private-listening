let messages = [];
let me = "";
let query = "";

const timeline = document.getElementById("timeline");
const dateNav = document.getElementById("dateNav");

function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function highlight(text, query) {
    const escaped = escapeHTML(text);

    if (!query) {
        return escaped;
    }

    const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    return escaped.replace(
        new RegExp(`(${safeQuery})`, "gi"),
        "<mark>$1</mark>"
    );
}

function formatDate(dateString) {
    const date = new Date(dateString + "T12:00:00");

    return new Intl.DateTimeFormat("nl-NL", {
        day: "numeric",
        month: "long",
        year: "numeric"
    }).format(date);
}

function formatMonth(dateString) {
    const date = new Date(dateString + "T12:00:00");

    return new Intl.DateTimeFormat("nl-NL", {
        month: "long",
        year: "numeric"
    }).format(date);
}

function mediaHTML(media) {
    if (!media) return "";

    if (media.type === "image") {
        return `
            <img
                class="media-image"
                src="${escapeHTML(media.src)}"
                alt=""
                loading="lazy"
            >
        `;
    }

    if (media.type === "audio") {
        return `
            <audio class="media-audio" controls preload="metadata">
                <source src="${escapeHTML(media.src)}">
            </audio>
        `;
    }

    if (media.type === "video") {
        return `
            <video
                class="media-video"
                controls
                preload="metadata"
                playsinline
            >
                <source src="${escapeHTML(media.src)}">
            </video>
        `;
    }

    if (media.type === "sticker") {
        return `
            <img
                class="media-sticker"
                src="${escapeHTML(media.src)}"
                alt=""
                loading="lazy"
            >
        `;
    }

    return "";
}

function render(list) {
    timeline.innerHTML = "";
    dateNav.innerHTML = "";

    const groups = new Map();

    for (const msg of list) {
        if (!groups.has(msg.date)) {
            groups.set(msg.date, []);
        }

        groups.get(msg.date).push(msg);
    }

    // De chat zelf: oud → nieuw
    const dates = [...groups.keys()]
        .sort((a, b) => a.localeCompare(b));

    // -------------------------
    // TIJDLIJN LINKS
    // Nieuwste → oudste
    // -------------------------

    let currentMonth = "";

    const navDates = [...dates].reverse();

    for (const date of navDates) {

        const month = formatMonth(date);

        if (month !== currentMonth) {

            currentMonth = month;

            const monthGroup = document.createElement("div");
            monthGroup.className = "month-group";

            const monthTitle = document.createElement("div");
            monthTitle.className = "month-title";
            monthTitle.textContent = month;

            monthGroup.appendChild(monthTitle);
            dateNav.appendChild(monthGroup);
        }

        const dayLink = document.createElement("a");

        dayLink.className = "day-link";
        dayLink.href = `#day-end-${date}`;

        dayLink.textContent =
            new Intl.DateTimeFormat("nl-NL", {
                weekday: "short",
                day: "numeric"
            }).format(new Date(date + "T12:00:00"));

        dateNav.lastElementChild.appendChild(dayLink);
    }

    // -------------------------
    // GESPREK
    // Oudste → nieuwste
    // -------------------------

    for (const date of dates) {

        const day = document.createElement("section");

        day.className = "day";
        day.id = `day-${date}`;

        day.innerHTML = `
            <div class="date-divider">
                ${escapeHTML(formatDate(date))}
            </div>

            <div class="messages"></div>
        `;

        const messagesContainer =
            day.querySelector(".messages");

        // Binnen iedere dag: oud → nieuw
        const dayMessages =
            groups.get(date).sort((a, b) => {

                const first =
                    `${a.date}T${a.time}`;

                const second =
                    `${b.date}T${b.time}`;

                return first.localeCompare(second);
            });

        for (const msg of dayMessages) {

            const row =
                document.createElement("article");

            row.className =
                `message-row ${msg.sender === me ? "mine" : ""}`;

            const bubble =
                document.createElement("div");

            bubble.className = "bubble";

            const sender =
                msg.sender === me ? "Ik" : "Jij";

            const senderHTML =
                `<div class="sender">${sender}</div>`;

            const text = msg.text
                ? `<div class="text">${highlight(msg.text, query)}</div>`
                : "";

            const media =
                (msg.media || [])
                    .map(mediaHTML)
                    .join("");

            const meta =
                `<div class="meta">${escapeHTML(msg.time)}</div>`;

            bubble.innerHTML =
                senderHTML +
                media +
                text +
                meta;

            row.appendChild(bubble);
            messagesContainer.appendChild(row);
        }

        const dayEnd = document.createElement("div");
        dayEnd.id = `day-end-${date}`;
        dayEnd.style.scrollMarginTop = "20px";

        day.appendChild(dayEnd);

        timeline.appendChild(day);
    }

    observeDates();

    // Openen zoals WhatsApp:
    // automatisch naar het meest recente bericht.
    requestAnimationFrame(() => {
        window.scrollTo(
            0,
            document.documentElement.scrollHeight
        );
    });
}

function observeDates() {

    const links =
        [...document.querySelectorAll(".day-link")];

    const sections =
        [...document.querySelectorAll(".day")];

    const observer =
        new IntersectionObserver(entries => {

            for (const entry of entries) {

                if (!entry.isIntersecting) {
                    continue;
                }

                const date =
                    entry.target.id.replace("day-", "");

                for (const link of links) {
                    link.classList.toggle(
                        "active",
                        link.getAttribute("href") === `#day-${date}`
                    );
                }
            }

        }, {
            rootMargin: "-20% 0px -70% 0px"
        });

    for (const section of sections) {
        observer.observe(section);
    }
}

async function init() {

    const response =
        await fetch("chat-data.json");

    if (!response.ok) {
        throw new Error(
            `Kon chat-data.json niet laden (${response.status})`
        );
    }

    const data =
        await response.json();

    messages = data.messages || [];

    me = data.me || "";

   messages.sort((a, b) => {

    const first =
        `${a.date}T${a.time}`;

    const second =
        `${b.date}T${b.time}`;

    return first.localeCompare(second);
    });

    render(messages);
}

init().catch(error => {

    console.error(error);

    timeline.innerHTML = `
        <p style="color:#f87171">
            De gesprekken konden niet worden geladen.
        </p>
    `;
});