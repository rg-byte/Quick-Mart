// Cart functionality
let cart = [];

// Get user data from localStorage
function getUserFromLocalStorage() {
  const userData = localStorage.getItem("loggedInUser");
  return userData ? JSON.parse(userData) : null;
}

// Display user name in navbar
function displayUserName() {
  const user = getUserFromLocalStorage();
  const userInfo = document.querySelector(".user-info span");

  if (user && userInfo) {
    userInfo.textContent = user.fullname;
  }
}

// Load user data when page loads
window.addEventListener("DOMContentLoaded", () => {
  displayUserName();
});

// Add to cart button functionality
document.querySelectorAll(".add-btn").forEach((button) => {
  button.addEventListener("click", function (e) {
    e.preventDefault();

    const productCard = this.closest(".product-card");
    const productName =
      productCard.querySelector(".product-info h3").textContent;
    const productPrice = productCard.querySelector(".sale-price").textContent;
    const productImage = productCard.querySelector(".product-image img").src;

    const product = {
      id: Date.now(),
      name: productName,
      price: productPrice,
      image: productImage,
      quantity: 1,
    };

    // Check if product already in cart
    const existingProduct = cart.find((item) => item.name === productName);
    if (existingProduct) {
      existingProduct.quantity += 1;
    } else {
      cart.push(product);
    }

    updateCartCount();
    showNotification(`${productName} added to cart!`);
    saveCartToBackend();
  });
});

// Update cart count
function updateCartCount() {
  const cartCount = document.querySelector(".cart-count");
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  cartCount.textContent = totalItems;
}

// Save cart to localStorage and backend
async function saveCartToBackend() {
  const user = getUserFromLocalStorage();
  if (!user) return;

  try {
    // First, delete old cart for this user if exists
    const cartsResponse = await fetch("http://localhost:3000/carts");
    const carts = await cartsResponse.json();
    const userCart = carts.find((c) => c.userId === user.id);

    if (userCart) {
      // Update existing cart
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
      // Create new cart
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

// Show notification
function showNotification(message) {
  const notification = document.createElement("div");
  notification.className = "notification";
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    background: #00a699;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    z-index: 1000;
    animation: slideIn 0.3s ease;
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease";
    setTimeout(() => notification.remove(), 300);
  }, 2000);
}

// Add animation styles
const style = document.createElement("style");
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Category click functionality
document.querySelectorAll(".category-card").forEach((card) => {
  card.addEventListener("click", function () {
    const categoryName = this.querySelector("span").textContent;
    showNotification(`Showing ${categoryName} products...`);
  });
});

// Search functionality
const searchInput = document.querySelector(".search-bar input");
if (searchInput) {
  searchInput.addEventListener("input", function (e) {
    const searchTerm = e.target.value.toLowerCase();
    const productCards = document.querySelectorAll(".product-card");

    productCards.forEach((card) => {
      const productName = card
        .querySelector(".product-info h3")
        .textContent.toLowerCase();
      if (productName.includes(searchTerm)) {
        card.style.display = "block";
      } else {
        card.style.display = "none";
      }
    });
  });
}

// User account click
const userInfo = document.querySelector(".user-info");
if (userInfo) {
  userInfo.addEventListener("click", function () {
    showNotification("Account page coming soon...");
  });
}

// Logout functionality
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", function (e) {
    e.stopImmediatePropagation();
    localStorage.removeItem("loggedInUser");
    showNotification("Logged out successfully!");
    setTimeout(() => {
      window.location.href = "../../index.html";
    }, 1000);
  });
}

// Cart click
const cartBtn = document.querySelector(".cart");
if (cartBtn) {
  cartBtn.addEventListener("click", function () {
    window.location.href = "../Cart/cart.html";
  });
}

console.log("Home page loaded successfully!");
