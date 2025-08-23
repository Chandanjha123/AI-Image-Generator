const themeToggle = document.querySelector(".theme-toggle");
const promptBtn = document.querySelector(".prompt-btn");
const promptInput = document.querySelector(".prompt-input");
const promptForm = document.querySelector(".prompt-form");
const gridGallery = document.querySelector(".img-container");

const modelSelect = document.getElementById("model-select");
const countSelect = document.getElementById("count-select");
const ratioSelect = document.getElementById("ratio-select");


const API_KEY = "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";

// Calculate width/height based on chosen ratio
const getImageDimensions = (aspectRatio, baseSize = 512) => {
    const [width, height] = aspectRatio.split("/").map(Number);
    const scaleFactor = baseSize / Math.sqrt(width * height);
    let calculatedWidth = Math.round(width * scaleFactor);
    let calculatedHeight = Math.round(height * scaleFactor);
    // Ensure dimensions are multiples of 16 (AI model requirements)
    calculatedWidth = Math.floor(calculatedWidth / 16) * 16;
    calculatedHeight = Math.floor(calculatedHeight / 16) * 16;
    return { width: calculatedWidth, height: calculatedHeight };
};

// Replace loading spinner with actual image
const updateImageCard = (imgIndex, imgUrl) => {
    const imgCard = document.getElementById(`img-card-${imgIndex}`);
    if (!imgCard) return;
    imgCard.classList.remove("loading");
    imgCard.innerHTML = `
        <img src="${imgUrl}" class="result-img" />
        <div class="img-overlay">
            <a href="${imgUrl}" class="img-download-btn" download="${Date.now()}.png">
                <i class="fa-solid fa-download"></i>
            </a>
        </div>`;
};





// Send request to Hugging Face API to create images
const generateImages = async (selectedModel, imageCount, aspectRatio, promptText) => {
    const MODEL_URL = `https://api-inference.huggingface.co/models/${selectedModel}`;
    const { width, height } = getImageDimensions(aspectRatio);

    const imagePromises = Array.from({ length: imageCount }, async (_, i) => {
        try {
            const response = await fetch(MODEL_URL, {
                headers: {
                    Authorization: `Bearer ${API_KEY}`,
                    "Content-Type": "application/json",
                    "x-use-cache": "false",
                },
                method: "POST",
                body: JSON.stringify({
                    inputs: promptText,
                    parameters: { width, height },
                }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || "Failed to generate");
            }

            // ✅ Convert to blob (image data)
            const blob = await response.blob();
            const imgUrl = URL.createObjectURL(blob);
            updateImageCard(i, imgUrl);
        } catch (error) {
            console.error("Image generation error:", error);
        }
    });

    await Promise.allSettled(imagePromises);
};

// Apply saved theme on load

//example prompts
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


const savedTheme = localStorage.getItem("theme");
if (savedTheme) {
    document.body.classList.add(savedTheme);
    updateIcon(savedTheme === "dark-theme");
}

// Function to update icon
function updateIcon(isDark) {
    themeToggle.querySelector("i").className = isDark
        ? "fa-solid fa-sun"
        : "fa-solid fa-moon";
}

// Toggle theme
const toggleTheme = () => {
    const isDark = document.body.classList.toggle("dark-theme");

    // Save current theme in localStorage
    localStorage.setItem("theme", isDark ? "dark-theme" : "");

    // Update icon
    updateIcon(isDark);
};

// Attach event listener
themeToggle.addEventListener("click", toggleTheme);



const createImageCards = (selectedModel, imageCount, aspectRatio, promptText) => {
    gridGallery.innerHTML = "";


    for (let i = 0; i < imageCount; i++) {
        gridGallery.innerHTML += `<div class="img-card loading"  id="img-card-${i}" style="aspect-ratio:${aspectRatio}">
                            <div class="status-container">



                                <div class="spinner"> </div>
                                <i class="fa-solid fa-triangle-exclamation"></i>
                                <p class="status-text">Generating...</p>
                                
                            </div>
                            <img src="https://upload.wikimedia.org/wikipedia/en/thumb/2/21/Web_of_Spider-Man_Vol_1_129-1.png/250px-Web_of_Spider-Man_Vol_1_129-1.png"
                               class="result-img" alt="">
                        </div>`

    }


    generateImages(selectedModel, imageCount, aspectRatio, promptText);
};


//handle form submission
const handleFormSubmit = (e) => {
    e.preventDefault();//preventing form from submitting


    //Get form values
    const selectedModel = modelSelect.value;
    const imageCount = parseInt(countSelect.value) || 1;
    const aspectRatio = ratioSelect.value || "1/1";
    const promptText = promptInput.value.trim();


    createImageCards(selectedModel, imageCount, aspectRatio, promptText);
};


promptForm.addEventListener("submit", handleFormSubmit);

promptBtn.addEventListener("click", () => {
    const prompt = examplePrompts[Math.floor(Math.random() * examplePrompts.length)]
    promptInput.value = prompt;
    promptInput.focus();
});
