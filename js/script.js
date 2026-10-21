// Quiz elements and replies
const form = document.querySelector("#routine-form");
const results = document.querySelector("#results");
const title = document.querySelector("#profile-title");
const description = document.querySelector("#profile-description");
const recommendations = document.querySelector("#routine-recommendations");
const retakeButton = document.querySelector("#retake-quiz");

// Data used by the rule-based quiz
const profiles = {
    dry: { title: "The Hydration Seeker", description: "Focus on moisture and gentle skincare.", ingredients: ["Hyaluronic acid", "Collagen"] },
    oily: { title: "The Balance Seeker", description: "Explore lightweight products and gentle cleansing.", ingredients: ["Salicylic acid (BHA)"] },
    combination: { title: "The Multi-Tasker", description: "Balance different areas of your skin.", ingredients: ["Salicylic acid (BHA)"] },
    normal: { title: "The Everyday Essentialist", description: "Maintain a simple, consistent routine.", ingredients: ["Vitamin C", "Niacinamide"] },
    sensitive: { title: "The Gentle Care Seeker", description: "Prioritise comfort and tolerability.", ingredients: ["Centella asiatica"] },
    unsure: { title: "The Skin Explorer", description: "Start gently while discovering your skin type.", ingredients: [] }
};

const concernIngredients = {
    hydration: ["Hyaluronic acid"],
    blemishes: ["Glycolic acid (AHA)"],
    "uneven-tone": ["Niacinamide"],
    redness: ["Centella asiatica"],
    pores: ["Salicylic acid (BHA)"],
    glow: ["Vitamin C"],
    wrinkles: ["Retinol", "Collagen"]
};

const concernLabels = {
    hydration: "Hydration", blemishes: "Blemishes", "uneven-tone": "Uneven skin tone",
    redness: "Redness", pores: "Visible pores", glow: "Dullness and glow",
    wrinkles: "Wrinkles and fine lines"
};

function addResultList(container, heading, steps, numbered = false) {
    const section = document.createElement("div");
    section.className = "routine-group";

    const h3 = document.createElement("h3");
    h3.textContent = heading;

    const list = document.createElement(numbered ? "ol" : "ul");

    steps.forEach(function (step) {
        const li = document.createElement("li");
        li.textContent = step;
        list.appendChild(li);
    });

    section.append(h3, list);
    container.appendChild(section);
}

// RECOMMENDED PRODUCTS
// Main product for each ingredient the quiz can suggest
const ingredientProducts = {
    "Hyaluronic acid": "hyaluronic-serum",
    "Collagen": "collagen-cream",
    "Salicylic acid (BHA)": "bha-cleanser",
    "Glycolic acid (AHA)": "aha-liquid",
    "Vitamin C": "vitamin-drop",
    "Niacinamide": "niacinamide-serum",
    "Centella asiatica": "centella-ampoule",
    "Retinol": "retinol-cream"
};

// Extra products that suit each skin type (used to fill the remaining places)
const skinTypeProducts = {
    dry: ["snail-essence", "barrier-cream"],
    oily: ["heartleaf-toner", "bha-cleanser"],
    combination: ["heartleaf-toner", "snail-essence"],
    normal: ["snail-essence", "glow-serum"],
    sensitive: ["barrier-cream", "heartleaf-toner", "centella-ampoule"],
    unsure: ["snail-essence", "barrier-cream"]
};

// Gentle products suitable for most skin types
const gentleBasics = ["snail-essence", "hyaluronic-serum", "barrier-cream", "centella-ampoule", "heartleaf-toner"];

// Acid exfoliants: never suggest more than one together
const exfoliatingAcids = ["bha-cleanser", "aha-liquid"];

// Strong actives left out for sensitive skin
const strongActives = ["retinol-cream", "aha-liquid"];

// How many products to suggest for each routine level (minimal, regular, multi-step)
const productsPerLevel = [2, 3, 5];

// Maximum total for each budget answer
const budgetLimits = { under40: 40, "40-80": 80, "80-150": 150, over150: Infinity };

function matchesAllergies(productId, allergies) {
    if (!allergies) return false;
    const card = document.querySelector(`.product-button[data-product="${productId}"]`).closest(".shop-card");
    const productText = (card.querySelector("h3").textContent + " " +
        card.querySelector(".product-ingredient").textContent).toLowerCase();
    const words = allergies.toLowerCase().split(/[^a-z0-9]+/).filter(word => word.length >= 4);
    return words.some(word => productText.includes(word));
}

function pickRecommendedProducts({ skin, budget, level, concerns, ingredients, allergies }) {
    // 1. Products for the suggested ingredients, 2. products for the skin type
    // 3. gentle basics, used only if there are still free places
    const candidates = ingredients.map(name => ingredientProducts[name]).filter(Boolean);
    if (concerns.includes("wrinkles") || (skin === "dry" && level === 2)) candidates.push("peptide-serum");
    candidates.push(...(skinTypeProducts[skin] || skinTypeProducts.unsure), ...gentleBasics);

    let acidChosen = false;
    const allowed = [...new Set(candidates)].filter(function (id) {
        if (!products[id]) return false;
        if (skin === "sensitive" && strongActives.includes(id)) return false;
        if (matchesAllergies(id, allergies)) return false;
        // Only one acid exfoliant per routine: they should not be layered together
        if (exfoliatingAcids.includes(id)) {
            if (acidChosen) return false;
            acidChosen = true;
        }
        return true;
    });

    // Keep the order of priority, but stay within the number of products and the budget
    const maxProducts = productsPerLevel[level] || 2;
    const limit = budgetLimits[budget] ?? Infinity;
    const chosen = [];
    let total = 0;

    allowed.forEach(function (id) {
        if (chosen.length >= maxProducts) return;
        if (total + products[id].price > limit) return;
        chosen.push(id);
        total += products[id].price;
    });

    // Always suggest at least one product (the cheapest available)
    if (!chosen.length && allowed.length) {
        chosen.push(allowed.reduce((a, b) => products[a].price <= products[b].price ? a : b));
    }
    return chosen;
}

function addRecommendedProducts(container, productIds, budget) {
    const section = document.createElement("div");
    section.className = "routine-group recommended-products";

    const heading = document.createElement("h3");
    heading.textContent = "Recommended products";

    const intro = document.createElement("p");
    intro.className = "recommended-intro";

    section.append(heading, intro);

    if (!productIds.length) {
        intro.textContent = "We couldn't find a product that matches your answers. Explore the shop below.";
        container.appendChild(section);
        return;
    }

    intro.textContent = "Selected from our shop to match your skin type, goals, routine and budget.";

    const grid = document.createElement("div");
    grid.className = "recommended-grid";

    let total = 0;
    productIds.forEach(function (id) {
        const shopCard = document.querySelector(`.product-button[data-product="${id}"]`).closest(".shop-card");
        total += products[id].price;

        const card = document.createElement("article");
        card.className = "recommended-card";

        const image = document.createElement("img");
        image.src = shopCard.querySelector("img").getAttribute("src");
        image.alt = shopCard.querySelector("img").alt;

        const info = document.createElement("div");
        info.className = "recommended-info";

        const brand = document.createElement("p");
        brand.className = "product-brand";
        brand.textContent = shopCard.querySelector(".product-brand").textContent;

        const name = document.createElement("h4");
        name.textContent = shopCard.querySelector("h3").textContent;

        const ingredient = document.createElement("p");
        ingredient.className = "product-ingredient";
        ingredient.innerHTML = shopCard.querySelector(".product-ingredient").innerHTML;

        const price = document.createElement("p");
        price.className = "recommended-price";
        price.textContent = "€" + products[id].price.toFixed(2);

        const button = document.createElement("button");
        button.type = "button";
        button.className = "recommended-button";
        button.textContent = "ADD TO BAG";
        button.addEventListener("click", () => addToCart(id));

        info.append(brand, name, ingredient, price, button);
        card.append(image, info);
        grid.appendChild(card);
    });

    const footer = document.createElement("div");
    footer.className = "recommended-footer";

    const totalText = document.createElement("p");
    totalText.innerHTML = `Routine total: <strong>€${total.toFixed(2)}</strong>`;

    const addAllButton = document.createElement("button");
    addAllButton.type = "button";
    addAllButton.className = "recommended-add-all";
    addAllButton.textContent = "ADD ALL TO BAG";
    addAllButton.addEventListener("click", function () {
        productIds.forEach(id => addToCart(id, false));
        openCart();
    });

    footer.append(totalText, addAllButton);
    section.append(grid, footer);
    container.appendChild(section);
}

form.addEventListener("submit", function (event) {
    event.preventDefault();

    const skinInput = form.querySelector('input[name="skinType"]:checked');
    const budgetInput = form.querySelector('input[name="budget"]:checked');
    const timeInput = form.querySelector('input[name="time"]:checked');
    const routineInput = form.querySelector('input[name="routine"]:checked');
    if (!skinInput || !budgetInput || !timeInput || !routineInput) return;

    const skin = skinInput.value;
    const budget = budgetInput.value;
    const time = timeInput.value;
    const routinePreference = routineInput.value;
    const concerns = [...form.querySelectorAll('input[name="concerns"]:checked')]
        .map(input => input.value);
    const allergies = form.querySelector("#allergies").value.trim();

    const profile = profiles[skin] || profiles.unsure;
    title.textContent = profile.title;
    description.textContent = profile.description;
    recommendations.replaceChildren();

    const ingredients = [...new Set([
        ...profile.ingredients,
        ...concerns.flatMap(concern => concernIngredients[concern] || [])
    ])];

    addResultList(recommendations, "Ingredients to explore",
        ingredients.length ? ingredients : ["Begin with gentle, basic products while you learn about your skin."]);

    // Time limits the number of steps; routine preference sets the preferred complexity.
    const levels = { minimal: 0, beginner: 0, regular: 1, advanced: 2 };
    const timeLimits = { quick: 0, medium: 1, long: 2 };
    const level = Math.min(levels[routinePreference] ?? 0, timeLimits[time] ?? 0);
    const routineName = ["Minimal", "Regular", "Multi-step"][level];

    // Use one gentle serum suggestion; leave strong active ingredients as optional treatments.
    const gentleOptions = ingredients.filter(name =>
        !name.includes("Salicylic") && !name.includes("Glycolic") && name !== "Retinol"
    );
    const serum = gentleOptions[0] || (skin === "unsure" ? "a simple hydrating serum" : "a gentle hydrating serum");
    const exfoliationSuggested = skin === "oily" || skin === "combination" ||
        concerns.includes("blemishes") || concerns.includes("pores");

    let morning = [];
    let evening = [];
    if (level === 0) {
        morning = ["Gentle cleanser", "Moisturiser with broad-spectrum SPF 30+ (or moisturiser followed by SPF 30+)"];
        evening = ["Gentle cleanser", "Hydrating moisturiser"];
    } else if (level === 1) {
        morning = ["Gentle cleanser", `Serum to explore: ${serum}`, "Hydrating moisturiser", "Broad-spectrum SPF 30+"];
        evening = ["Gentle cleanser", "Hydrating moisturiser"];
    } else {
        morning = [skin === "dry" || skin === "sensitive" ? "Gentle cleanser" : "Gentle gel or mousse cleanser", `Serum to explore: ${serum}`, "Optional eye cream", "Hydrating moisturiser", "Broad-spectrum SPF 30+"];
        evening = ["Gentle cleanser (double cleansing only when useful and tolerated)", "Serum to explore according to your skin goals", "Optional eye cream", "Hydrating moisturiser"];
        if (skin === "dry") {
            morning.splice(2, 0, "Optional Vitamin C serum, if your skin tolerates it");
            evening.splice(2, 0, "Optional peptide serum for dry skin");
        }
        if (exfoliationSuggested) evening.splice(1, 0, "Optional acid exfoliation on selected evenings, not every day");
    }
   addResultList(recommendations, `Your ${routineName.toLowerCase()} morning routine`, morning,
    true
);

addResultList(recommendations, `Your ${routineName.toLowerCase()} evening routine`, evening,
    true
);
    if (concerns.length) {
        addResultList(recommendations, "Your selected concerns",
            concerns.map(concern => `${concernLabels[concern]}: ${(concernIngredients[concern] || []).join(", ")}`));
    }

    const notes = [];
    if (level === 0 && exfoliationSuggested) notes.push("If you have oily skin or blemishes, optional exfoliation can be considered occasionally, not as an essential daily step.");
    if (budget === "under40") notes.push("Budget: focus on affordable essentials before adding extra treatments.");
    if (time === "quick" && level === 0) notes.push("Your routine has been kept short to fit 5 minutes or less.");
    if (skin === "sensitive") notes.push("For sensitive skin, introduce new ingredients cautiously and prioritise gentle formulas.");
    if (ingredients.includes("Retinol")) notes.push("Retinol is an optional night-time treatment, not a required step. Avoid retinoids during pregnancy; seek professional guidance when appropriate.");
    if (ingredients.some(name => name.includes("Salicylic") || name.includes("Glycolic"))) notes.push("Acid exfoliants are optional, should be introduced gradually, and should not all be layered together. Daily sunscreen is important.");
    if (allergies) notes.push(`You listed ingredients to avoid: ${allergies}. Products whose name or key ingredient matches have been left out, but full formulas have NOT been checked; verify ingredient labels before use.`);
    if (notes.length) addResultList(recommendations, "Important notes", notes);

    // Recommended products from the shop, based on the same answers
    const recommendedIds = pickRecommendedProducts({ skin, budget, level, concerns, ingredients, allergies });
    addRecommendedProducts(recommendations, recommendedIds, budget);

    results.hidden = false;
    results.scrollIntoView({ behavior: "smooth", block: "start" });
});

retakeButton.addEventListener("click", function () {
    form.reset();
    results.hidden = true;
    recommendations.replaceChildren();
    form.scrollIntoView({ behavior: "smooth", block: "start" });
});

// Ingredients carousel arrows
const ingredientCarousel = document.querySelector("#ingredients-carousel");
const previousButton = document.querySelector("#ingredients-prev");
const nextButton = document.querySelector("#ingredients-next");

function moveToIngredient(direction) {
    const cards = [...ingredientCarousel.querySelectorAll(".ingredient-card")];
    if (!cards.length) return;

    const maxScroll = ingredientCarousel.scrollWidth - ingredientCarousel.clientWidth;
    const currentScroll = ingredientCarousel.scrollLeft;
    const tolerance = 5;

    if (direction === "next" && currentScroll >= maxScroll - tolerance) return;
    if (direction === "prev" && currentScroll <= tolerance) return;

    const carouselRect = ingredientCarousel.getBoundingClientRect();
    let targetCard;

    if (direction === "next") {
        targetCard = cards.find(card =>
            card.getBoundingClientRect().left > carouselRect.left + tolerance
        );
    } else {
        targetCard = cards.filter(card =>
            card.getBoundingClientRect().left < carouselRect.left - tolerance
        ).pop();
    }

    let targetPosition;

    if (targetCard) {
        const cardRect = targetCard.getBoundingClientRect();
        targetPosition = currentScroll + cardRect.left - carouselRect.left;
    } else {
        targetPosition = direction === "next" ? maxScroll : 0;
    }

    targetPosition = Math.max(0, Math.min(targetPosition, maxScroll));

    ingredientCarousel.scrollTo({
        left: targetPosition,
        behavior: "smooth"
    });
}

previousButton.addEventListener("click", () => moveToIngredient("prev"));
nextButton.addEventListener("click", () => moveToIngredient("next"));

// Category product filter
const shopFilters = document.querySelectorAll(".shop-filter");
const shopProducts = document.querySelectorAll(".shop-card");

shopFilters.forEach(function (button) {
    button.addEventListener("click", function () {
        const selectedCategory = button.dataset.filter;

        shopFilters.forEach(function (filter) {
            filter.classList.remove("active");
        });
        button.classList.add("active");

        shopProducts.forEach(function (product) {
            // A product can belong to more than one category (e.g. "must-have hydration")
            const productCategories = product.dataset.category.split(" ");
            const matchesCategory = selectedCategory === "all" ||
                productCategories.includes(selectedCategory);
            product.hidden = !matchesCategory;
        });
    });
});

// Newsletter
const newsletterForm = document.querySelector("#newsletter-form");
const newsletterEmail = document.querySelector("#newsletter-email");
const newsletterMessage = document.querySelector("#newsletter-message");

newsletterForm.addEventListener("submit", function (event) {
    event.preventDefault();

    if (!newsletterEmail.checkValidity()) {
        newsletterEmail.reportValidity();
        return;
    }

    newsletterMessage.textContent = "Thank you for joining the SkinMatch community!";
    newsletterForm.reset();
});

// Cart elements
const cartButton = document.querySelector("#cart-button");
const cartPanel = document.querySelector("#cart-panel");
const cartOverlay = document.querySelector("#cart-overlay");
const cartClose = document.querySelector("#cart-close");
const cartCount = document.querySelector("#cart-count");
const cartItems = document.querySelector("#cart-items");
const cartTotal = document.querySelector("#cart-total");
const checkoutButton = document.querySelector("#checkout-button");

// Available products
const products = {
    "snail-essence": { name: "COSRX Advanced Snail 96 Mucin Essence", price: 25.0 },
    "heartleaf-toner": { name: "Anua Heartleaf 77% Soothing Toner", price: 23.0 },
    "hyaluronic-serum": { name: "Torriden DIVE-IN Low Molecular Hyaluronic Acid Serum", price: 23.0 },
    "centella-ampoule": { name: "SKIN1004 Madagascar Centella Ampoule", price: 29.5 },
    "glow-serum": { name: "Beauty of Joseon Glow Serum", price: 17.0 },
    "barrier-cream": { name: "Etude SoonJung 2x Barrier Intensive Cream", price: 22.0 },
    "collagen-cream": { name: "Medicube Collagen Jelly Cream", price: 18.0 },
    "bha-cleanser": { name: "COSRX Salicylic Acid Daily Gentle Cleanser", price: 9.0 },
    "aha-liquid": { name: "COSRX AHA 7 Whitehead Power Liquid", price: 25.0 },
    "vitamin-drop": { name: "Klairs Freshly Juiced Vitamin Drop", price: 27.0 },
    "niacinamide-serum": { name: "Anua Niacinamide 10% + TXA 4% Serum", price: 25.0 },
    "retinol-cream": { name: "COSRX The Retinol 0.1 Cream", price: 34.5 },
    "peptide-serum": { name: "Medicube PDRN Pink Peptide Serum", price: 23.0 }
};

const cart = [];

// Open and close cart
function openCart() {
    cartPanel.classList.add("is-open");
    cartOverlay.hidden = false;
    cartPanel.setAttribute("aria-hidden", "false");
}

function closeCart() {
    cartPanel.classList.remove("is-open");
    cartOverlay.hidden = true;
    cartPanel.setAttribute("aria-hidden", "true");
}

cartButton.addEventListener("click", openCart);
cartClose.addEventListener("click", closeCart);
cartOverlay.addEventListener("click", closeCart);

// Update cart and totals
function updateCart() {
    cartItems.innerHTML = "";

    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="cart-empty">Your bag is empty.</p>';
    }

    let total = 0;
    let itemCount = 0;

    cart.forEach(function (item, index) {
        total += item.price * item.quantity;
        itemCount += item.quantity;

        const row = document.createElement("div");
        row.className = "cart-item";

        const details = document.createElement("div");

        const name = document.createElement("strong");
        name.textContent = item.name;

        const quantity = document.createElement("p");
        quantity.textContent = "Qty: " + item.quantity;

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.textContent = "Remove";
        removeButton.addEventListener("click", function () {
            cart.splice(index, 1);
            updateCart();
        });

        details.append(name, quantity, removeButton);

        const price = document.createElement("span");
        price.textContent = "€" + (item.price * item.quantity).toFixed(2);

        row.append(details, price);
        cartItems.appendChild(row);
    });

    cartCount.textContent = itemCount;
    cartTotal.textContent = "€" + total.toFixed(2);
}

// Add product to bag (used by the shop and by the quiz recommendations)
function addToCart(productId, showCart = true) {
    const product = products[productId];
    if (!product) return;

    const existingItem = cart.find(function (item) {
        return item.id === productId;
    });

    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            id: productId,
            name: product.name,
            price: product.price,
            quantity: 1
        });
    }

    updateCart();
    if (showCart) openCart();
}

document.querySelectorAll(".product-button").forEach(function (button) {
    button.addEventListener("click", function () {
        addToCart(button.dataset.product);
    });
});

// Demo checkout
checkoutButton.addEventListener("click", function () {
    alert("Thank you! Your checkout is a demo, but stay tuned in the future!");
});

updateCart();
