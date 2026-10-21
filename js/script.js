
 // Quiz elements and replies
const form = document.querySelector("#routine-form");
const results = document.querySelector("#results");
const title = document.querySelector("#profile-title");
const description = document.querySelector("#profile-description");
const recommendations = document.querySelector("#routine-recommendations");
const retakeButton = document.querySelector("#retake-quiz");

// Profile shown after the submit
form.addEventListener("submit", function (event) {
    event.preventDefault();

    const skinInput = document.querySelector('input[name="skinType"]:checked');
    const budgetInput = document.querySelector('input[name="budget"]:checked');
    const timeInput = document.querySelector('input[name="time"]:checked');

    if (!skinInput || !budgetInput || !timeInput) return;

    const skin = skinInput.value;
    const budget = budgetInput.value;
    const time = timeInput.value;

    const profiles = {
        dry: {
            title: "The Hydration Seeker",
            description: "Focus on hydration and gentle skincare."
        },
        oily: {
            title: "The Balance Seeker",
            description: "Explore lightweight products and gentle cleansing."
        },
        sensitive: {
            title: "The Gentle Care Seeker",
            description: "Keep your routine simple and focus on tolerability."
        },
        combination: {
            title: "The Multi-Tasker",
            description: "Look for a balanced routine suited to your skin."
        },
        normal: {
            title: "The Everyday Essentialist",
            description: "Focus on cleansing, moisturising and sun protection."
        },
        unsure: {
            title: "The Skin Explorer",
            description: "Start with the basics while discovering your skin."
        }
    };

    const profile = profiles[skin] || profiles.unsure;
    title.textContent = profile.title;
    description.textContent = profile.description;

    let routine = `
        <h3>Your skincare routine</h3>
        <p>Morning: gentle cleanser, moisturiser and SPF 30+.</p>
        <p>Evening: cleanser and moisturiser.</p>
    `;

    if (skin === "dry") {
        routine += "<p>Explore hydrating products.</p>";
    }
    if (skin === "oily") {
        routine += "<p>Explore lightweight moisturisers.</p>";
    }
    if (skin === "sensitive") {
        routine += "<p>Consider fragrance-free products.</p>";
    }
    if (time === "quick") {
        routine += "<p>Keep your routine simple and practical.</p>";
    }
    if (budget === "under40") {
        routine += "<p>Look for affordable skincare essentials.</p>";
    }

    recommendations.innerHTML = routine;
    results.hidden = false;
    results.scrollIntoView({ behavior: "smooth", block: "start" });
});

// Retake the quiz
retakeButton.addEventListener("click", function () {
    form.reset();
    results.hidden = true;
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
            const matchesCategory = selectedCategory === "all" ||
                product.dataset.category === selectedCategory;
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
    "snail-essence": { name: "Snail Essence", price: 25 },
    "heartleaf-toner": { name: "Heartleaf Toner", price: 23 },
    "glow-serum": { name: "Glow Serum", price: 17 },
    "barrier-cream": { name: "SoonJung Intensive Barrier Cream", price: 22 }
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

// Add product to bag
document.querySelectorAll(".product-button").forEach(function (button) {
    button.addEventListener("click", function () {
        const productId = button.dataset.product;
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
        openCart();
    });
});

// Demo checkout
checkoutButton.addEventListener("click", function () {
    alert("Thank you! Your checkout is a demo, but stay tuned in the future!");
});

updateCart();
