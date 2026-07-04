// Get user data from localStorage
function getUserFromLocalStorage() {
  const userData = localStorage.getItem("loggedInUser");
  return userData ? JSON.parse(userData) : null;
}

// Promo codes database
let promoCodes = {};

// Load cart from localStorage
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let appliedPromo = localStorage.getItem("appliedPromo") || null;

// Display user name in navbar
function displayUserName() {
  const user = getUserFromLocalStorage();
  const userInfo = document.querySelector(".user-info span");

  if (user && userInfo) {
    userInfo.textContent = user.fullname;
  }
}

// Load cart from backend// Check if promo code is expired
function isPromoExpired(expiryDateString) {
  const [day, month, year] = expiryDateString.split("/").map(Number);
  const expiryDate = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return expiryDate < today;
}

// Load promo codes from backend
async function loadPromoCodesFromBackend() {
  try {
    const response = await fetch("http://localhost:3000/promoCodes");
    const codes = await response.json();

    // Convert array to object with code as key
    codes.forEach((promo) => {
      promoCodes[promo.code] = {
        discount: promo.discount,
        description: promo.description,
        type: promo.type,
        minOrder: promo.minOrder,
        expiryDate: promo.expiryDate,
      };
    });

    displayPromoCodesInModal(codes);
  } catch (error) {
    console.error("Error loading promo codes from backend:", error);
  }
}

// Display promo codes in modal
function displayPromoCodesInModal(codes) {
  const promoCodesList = document.getElementById("promoCodesList");
  promoCodesList.innerHTML = "";

  if (codes.length === 0) {
    promoCodesList.innerHTML =
      '<div class="no-promos-message"><i class="fas fa-tag"></i><p>No promo codes available</p></div>';
    return;
  }

  codes.forEach((promo) => {
    const isExpired = isPromoExpired(promo.expiryDate);
    const card = document.createElement("div");
    card.className = isExpired ? "promo-code-card expired" : "promo-code-card";

    const discountText =
      promo.type === "percentage"
        ? `${promo.discount}% OFF`
        : `₹${promo.discount} OFF`;

    card.innerHTML = `
      <div class="promo-card-header">
        <div class="promo-card-code">${promo.code}</div>
        <div class="promo-card-discount">${discountText}</div>
        ${isExpired ? '<span class="promo-card-expired-badge">EXPIRED</span>' : ""}
      </div>
      <p class="promo-card-description">${promo.description}</p>
      <div class="promo-card-details">
        <span class="promo-card-min-order">Min Order: ₹${promo.minOrder}</span>
        <span class="promo-card-expiry ${isExpired ? "expired-date" : ""}">Expires: ${promo.expiryDate}</span>
      </div>
      <button class="promo-card-apply-btn ${isExpired ? "disabled" : ""}" 
              onclick="selectPromoCode('${promo.code}')" 
              ${isExpired ? "disabled" : ""}>
        ${isExpired ? "Expired" : "Select Code"}
      </button>
    `;

    promoCodesList.appendChild(card);
  });
}

// Fill promo code input from modal selection
function selectPromoCode(code) {
  const promoInput = document.getElementById("promoCode");
  promoInput.value = code;
  closePromoModal();
  // Focus on the input field so user can see it's been filled
  promoInput.focus();
}

// Open promo modal
function openPromoModal() {
  const promoModal = document.getElementById("promoModal");
  promoModal.classList.add("active");
}

// Close promo modal
function closePromoModal() {
  const promoModal = document.getElementById("promoModal");
  promoModal.classList.remove("active");
}

async function loadCartFromBackend() {
  const user = getUserFromLocalStorage();
  if (!user) return;

  try {
    const response = await fetch("http://localhost:3000/carts");
    const carts = await response.json();
    const userCart = carts.find((c) => c.userId === user.id);

    if (userCart) {
      cart = userCart.items;
      localStorage.setItem("cart", JSON.stringify(cart));
      displayCart();
    } else {
      displayCart();
    }
  } catch (error) {
    console.error("Error loading cart from backend:", error);
    displayCart();
  }
}

// Display cart items
function displayCart() {
  const emptyMessage = document.getElementById("emptyCartMessage");
  const cartContent = document.getElementById("cartContent");
  const cartTableBody = document.getElementById("cartTableBody");

  if (cart.length === 0) {
    emptyMessage.style.display = "flex";
    cartContent.style.display = "none";
    document.querySelector(".cart-count").textContent = "0";
    return;
  }

  emptyMessage.style.display = "none";
  cartContent.style.display = "grid";

  cartTableBody.innerHTML = "";

  cart.forEach((item, index) => {
    const row = document.createElement("tr");
    const itemTotal = parseFloat(item.price.replace("₹", "")) * item.quantity;

    row.innerHTML = `
      <td>
        <div class="product-info-cell">
          <div class="product-image-thumb">
            <img src="${item.image}" alt="${item.name}" />
          </div>
          <div class="product-details">
            <h4>${item.name}</h4>
            <p>${item.price}</p>
          </div>
        </div>
      </td>
      <td>${item.price}</td>
      <td>
        <div class="quantity-control">
          <button class="quantity-btn" onclick="updateQuantity(${index}, -1)">-</button>
          <input type="number" class="quantity-input" value="${item.quantity}" min="1" onchange="updateQuantityDirect(${index}, this.value)" />
          <button class="quantity-btn" onclick="updateQuantity(${index}, 1)">+</button>
        </div>
      </td>
      <td>₹${itemTotal.toFixed(2)}</td>
      <td>
        <button class="remove-btn" onclick="removeItem(${index})">Remove</button>
      </td>
    `;

    cartTableBody.appendChild(row);
  });

  updateCartSummary();
  updateCartCount();
}

// Update quantity
function updateQuantity(index, change) {
  cart[index].quantity += change;

  if (cart[index].quantity < 1) {
    cart.splice(index, 1);
  }

  saveCartToBackend();
  displayCart();
}

// Update quantity directly
function updateQuantityDirect(index, newQuantity) {
  const quantity = parseInt(newQuantity);
  if (quantity < 1) {
    cart.splice(index, 1);
  } else {
    cart[index].quantity = quantity;
  }

  saveCartToBackend();
  displayCart();
}

// Remove item from cart
function removeItem(index) {
  cart.splice(index, 1);
  saveCartToBackend();
  displayCart();
}

// Update cart count
function updateCartCount() {
  const cartCount = document.querySelector(".cart-count");
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  cartCount.textContent = totalItems;
}

// Update cart summary
function updateCartSummary() {
  const subtotal = cart.reduce(
    (acc, item) =>
      acc + parseFloat(item.price.replace("₹", "")) * item.quantity,
    0,
  );

  const shipping = subtotal > 500 ? 0 : 50;
  const discount = Math.floor((subtotal * 10) / 100);

  let promoDiscount = 0;
  if (appliedPromo && promoCodes[appliedPromo]) {
    const promoData = promoCodes[appliedPromo];
    if (promoData.description.includes("%")) {
      // Percentage discount
      promoDiscount = Math.floor((subtotal * promoData.discount) / 100);
    } else {
      // Fixed amount discount
      promoDiscount = promoData.discount;
    }
  }

  const total = subtotal + shipping - discount - promoDiscount;

  document.getElementById("subtotal").textContent = `₹${subtotal.toFixed(2)}`;
  document.getElementById("shipping").textContent =
    shipping === 0 ? "FREE" : `₹${shipping}`;
  document.getElementById("discount").textContent = `₹${discount.toFixed(2)}`;

  // Show/hide promo discount row
  const promoDiscountRow = document.getElementById("promoDiscountRow");
  if (promoDiscount > 0) {
    promoDiscountRow.style.display = "flex";
    document.getElementById("promoDiscount").textContent =
      `₹${promoDiscount.toFixed(2)}`;
  } else {
    promoDiscountRow.style.display = "none";
  }

  document.getElementById("total").textContent =
    `₹${Math.max(0, total).toFixed(2)}`;
}

// Save cart to localStorage and backend
async function saveCartToBackend() {
  localStorage.setItem("cart", JSON.stringify(cart));

  const user = getUserFromLocalStorage();
  if (!user) return;

  try {
    const cartsResponse = await fetch("http://localhost:3000/carts");
    const carts = await cartsResponse.json();
    const userCart = carts.find((c) => c.userId === user.id);

    if (userCart) {
      await fetch(`http://localhost:3000/carts/${userCart.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          items: cart,
          updatedAt: new Date().toLocaleString(),
        }),
      });
    } else {
      await fetch("http://localhost:3000/carts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          items: cart,
          createdAt: new Date().toLocaleString(),
          updatedAt: new Date().toLocaleString(),
        }),
      });
    }
  } catch (error) {
    console.error("Error saving cart to backend:", error);
  }
}

// Apply promo code
function applyPromoCode() {
  const promoInput = document.getElementById("promoCode");
  const code = promoInput.value.trim().toUpperCase();
  const promoMessage = document.getElementById("promoMessage");

  if (!code) {
    promoMessage.textContent = "Please enter a promo code";
    promoMessage.className = "promo-message error";
    return;
  }

  if (!promoCodes[code]) {
    promoMessage.textContent = "Invalid promo code!";
    promoMessage.className = "promo-message error";
    promoInput.value = "";
    return;
  }

  // Check if promo code is expired
  if (isPromoExpired(promoCodes[code].expiryDate)) {
    promoMessage.textContent = "This promo code has expired!";
    promoMessage.className = "promo-message error";
    promoInput.value = "";
    return;
  }

  appliedPromo = code;
  localStorage.setItem("appliedPromo", code);

  const promoData = promoCodes[code];
  promoMessage.textContent = `✓ Promo code applied successfully! ${promoData.description}`;
  promoMessage.className = "promo-message success";

  const appliedPromoDiv = document.getElementById("appliedPromo");
  document.getElementById("appliedPromoName").textContent =
    `${code} - ${promoData.description}`;
  appliedPromoDiv.style.display = "flex";

  promoInput.value = "";
  promoInput.disabled = true;
  document.getElementById("applyPromoBtn").disabled = true;

  updateCartSummary();
}

// Remove promo code
function removePromoCode() {
  appliedPromo = null;
  localStorage.removeItem("appliedPromo");

  const promoInput = document.getElementById("promoCode");
  const promoMessage = document.getElementById("promoMessage");
  const appliedPromoDiv = document.getElementById("appliedPromo");

  promoInput.value = "";
  promoInput.disabled = false;
  promoMessage.textContent = "";
  appliedPromoDiv.style.display = "none";
  document.getElementById("applyPromoBtn").disabled = false;

  updateCartSummary();
}

// Checkout functionality
const checkoutBtn = document.getElementById("checkoutBtn");
if (checkoutBtn) {
  checkoutBtn.addEventListener("click", function () {
    if (cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    const totalAmount = document.getElementById("total").textContent;
    alert(`Order placed successfully! Total: ${totalAmount}`);

    // Clear cart and promo code
    cart = [];
    appliedPromo = null;
    localStorage.setItem("cart", JSON.stringify(cart));
    localStorage.removeItem("appliedPromo");

    // Delete from backend
    const user = getUserFromLocalStorage();
    if (user) {
      fetch("http://localhost:3000/carts")
        .then((res) => res.json())
        .then((carts) => {
          const userCart = carts.find((c) => c.userId === user.id);
          if (userCart) {
            fetch(`http://localhost:3000/carts/${userCart.id}`, {
              method: "DELETE",
            });
          }
        });
    }

    displayCart();
  });
}

// Event listeners for promo code
const applyPromoBtn = document.getElementById("applyPromoBtn");
const removePromoBtn = document.getElementById("removePromoBtn");
const promoInput = document.getElementById("promoCode");

if (applyPromoBtn) {
  applyPromoBtn.addEventListener("click", applyPromoCode);
}

if (promoInput) {
  promoInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      applyPromoCode();
    }
  });
}

if (removePromoBtn) {
  removePromoBtn.addEventListener("click", removePromoCode);
}

// Modal event listeners
const viewPromosBtn = document.getElementById("viewPromosBtn");
const closePromoModalBtn = document.getElementById("closePromoModal");
const promoModalEl = document.getElementById("promoModal");

if (viewPromosBtn) {
  viewPromosBtn.addEventListener("click", openPromoModal);
}

if (closePromoModalBtn) {
  closePromoModalBtn.addEventListener("click", closePromoModal);
}

// Close modal when clicking outside
if (promoModalEl) {
  promoModalEl.addEventListener("click", function (e) {
    if (e.target === promoModalEl) {
      closePromoModal();
    }
  });
}

// Restore applied promo on page load
function restoreAppliedPromo() {
  if (appliedPromo && promoCodes[appliedPromo]) {
    // Check if the applied promo is expired
    if (isPromoExpired(promoCodes[appliedPromo].expiryDate)) {
      // Remove expired promo from localStorage
      appliedPromo = null;
      localStorage.removeItem("appliedPromo");
      return;
    }

    const promoData = promoCodes[appliedPromo];
    const appliedPromoDiv = document.getElementById("appliedPromo");
    const promoInput = document.getElementById("promoCode");
    const applyPromoBtn = document.getElementById("applyPromoBtn");

    document.getElementById("appliedPromoName").textContent =
      `${appliedPromo} - ${promoData.description}`;
    appliedPromoDiv.style.display = "flex";
    promoInput.disabled = true;
    applyPromoBtn.disabled = true;
  }
}

// Logout functionality
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", function (e) {
    e.stopImmediatePropagation();
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("cart");
    alert("Logged out successfully!");
    setTimeout(() => {
      window.location.href = "../../index.html";
    }, 500);
  });
}

// Go back to home
document.querySelector(".logo").addEventListener("click", function () {
  window.location.href = "../Home/home.html";
});

// Initialize page
window.addEventListener("DOMContentLoaded", () => {
  displayUserName();
  loadCartFromBackend();
  loadPromoCodesFromBackend();
  restoreAppliedPromo();
});

console.log("Cart page loaded successfully!");
