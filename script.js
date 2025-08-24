const themeToggle = document.querySelector(".theme-toggle");
const promptBtn = document.querySelector(".prompt-btn");
const promptInput = document.querySelector(".prompt-input");
const promptForm = document.querySelector(".prompt-form");
const gridGallery = document.querySelector(".img-container");

const modelSelect = document.getElementById("model-select"); // Exists but ignored
const countSelect = document.getElementById("count-select");
const ratioSelect = document.getElementById("ratio-select");

// -------------------- HELPER FUNCTIONS --------------------

// Calculate width/height based on chosen aspect ratio
const getImageDimensions = (aspectRatio, baseSize = 512) => {
    const [width, height] = aspectRatio.split("/").map(Number);
    const scaleFactor = baseSize / Math.sqrt(width * height);
    let calculatedWidth = Math.round(width * scaleFactor);
    let calculatedHeight = Math.round(height * scaleFactor);
    // Ensure multiples of 16 for AI model requirements
    calculatedWidth = Math.floor(calculatedWidth / 16) * 16;
    calculatedHeight = Math.floor(calculatedHeight / 16) * 16;
    return { width: calculatedWidth, height: calculatedHeight };
};

// Update individual image card after image is generated
const updateImageCard = (imgIndex, imgUrl) => {
    const imgCard = document.getElementById(`img-card-${imgIndex}`);
    if (!imgCard) return;
    imgCard.classList.remove("loading");
    imgCard.innerHTML = `<img src="${imgUrl}" class="result-img" />
        <div class="img-overlay">
            <a href="${imgUrl}" class="img-download-btn" download="${Date.now()}.png">
                <i class="fa-solid fa-download"></i>
            </a>
        </div>`;
};

// -------------------- IMAGE GENERATION --------------------

// Hardcoded Gemini model (ignores user selection)
const GEMINI_MODEL = "gemini-2.0-flash-preview-image-generation";

// Send request to backend to generate images
const generateImages = async (imageCount, aspectRatio, promptText) => {
    const { width, height } = getImageDimensions(aspectRatio);

    try {
        // Send request to backend
        const response = await fetch("http://localhost:5000/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                prompt: promptText,
                model: GEMINI_MODEL, // Always use Gemini model
                width,
                height,
                count: imageCount
            }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to generate images");

        data.images.forEach((imgUrl, i) => updateImageCard(i, imgUrl));

    } catch (error) {
        console.error("Generation error:", error);
        for (let i = 0; i < imageCount; i++) {
            const imgCard = document.getElementById(`img-card-${i}`);
            if (imgCard) {
                imgCard.classList.remove("loading");
                imgCard.classList.add("error");
                imgCard.innerHTML = `
                <div class="status-container">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <p class="status-text">Failed to generate</p>
                </div>
            `;
            }
        }
    }
};

// -------------------- THEME TOGGLE --------------------
const savedTheme = localStorage.getItem("theme");
if (savedTheme) {
    document.body.classList.add(savedTheme);
    updateIcon(savedTheme === "dark-theme");
}

function updateIcon(isDark) {
    themeToggle.querySelector("i").className = isDark
        ? "fa-solid fa-sun"
        : "fa-solid fa-moon";
}

const toggleTheme = () => {
    const isDark = document.body.classList.toggle("dark-theme");
    localStorage.setItem("theme", isDark ? "dark-theme" : "");
    updateIcon(isDark);
};

themeToggle.addEventListener("click", toggleTheme);

// -------------------- EXAMPLE PROMPTS --------------------
const examplePrompts = [
    "A magic forest with glowing plants and fairy homes among giant mushrooms",
    "An old steampunk airship floating through golden clouds at sunset",
    "A future Mars colony with glass domes and gardens against red mountains",
    "A dragon sleeping on gold coins in a crystal cave",
    "An underwater kingdom with merpeople and glowing coral buildings",
    "A floating island with waterfalls pouring into clouds below",
    "A witch's cottage in fall with magic herbs in the garden",
    "A robot painting in a sunny studio with art supplies around it",
    "A magical library with floating glowing books and spiral staircases",
    "A Japanese shrine during cherry blossom season with lanterns and misty mountains"
];

promptBtn.addEventListener("click", () => {
    const prompt = examplePrompts[Math.floor(Math.random() * examplePrompts.length)];
    promptInput.value = prompt;
    promptInput.focus();
});

// -------------------- CREATE IMAGE CARDS --------------------
const createImageCards = (imageCount, aspectRatio, promptText) => {
    gridGallery.innerHTML = "";

    for (let i = 0; i < imageCount; i++) {
        gridGallery.innerHTML += `<div class="img-card loading" id="img-card-${i}" style="aspect-ratio:${aspectRatio}">
            <div class="status-container">
                <div class="spinner"></div>
                <i class="fa-solid fa-triangle-exclamation"></i>
                <p class="status-text">Generating...</p>
            </div>
        </div>`;
    }

    // Call backend to generate images
    generateImages(imageCount, aspectRatio, promptText);
};

// -------------------- FORM SUBMISSION --------------------
const handleFormSubmit = (e) => {
    e.preventDefault();

    const imageCount = parseInt(countSelect.value) || 1;
    const aspectRatio = ratioSelect.value || "1/1";
    const promptText = promptInput.value.trim();

    createImageCards(imageCount, aspectRatio, promptText);
};

promptForm.addEventListener("submit", handleFormSubmit);


promptBtn.addEventListener("click", () => {
    const prompt = examplePrompts[Math.floor(Math.random() * examplePrompts.length)]
    promptInput.value = prompt;
    promptInput.focus();
});
