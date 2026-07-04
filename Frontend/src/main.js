// Simulate a 3-second loading time
function showLoader() {
  const loaderContainer = document.getElementById("loaderContainer");
  const mainContent = document.getElementById("mainContent");

  loaderContainer.style.display = "flex";
  mainContent.style.display = "none";
}

function hideLoader() {
  const loaderContainer = document.getElementById("loaderContainer");
  const mainContent = document.getElementById("mainContent");

  loaderContainer.style.display = "none";
  mainContent.style.display = "block";
}

// Show loader on page load
window.addEventListener("load", () => {
  showLoader();

  // Simulate content loading after 3 seconds
  setTimeout(() => {
    hideLoader();
  }, 2000);
});

// Page switching functions
function showLoginForm() {
  document.getElementById("loginContainer").style.display = "block";
  document.getElementById("signupContainer").style.display = "none";
}

function showSignupForm() {
  document.getElementById("loginContainer").style.display = "none";
  document.getElementById("signupContainer").style.display = "block";
}

function generateShortId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

window.addEventListener("DOMContentLoaded", () => {
  showLoginForm();
  const loginForm = document.getElementById("loginForm");
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const response = await fetch("http://localhost:3000/users", {
      method: "GET",
    });
    const users = await response.json();

    const user = users.find(
      (u) => u.email === email && u.password === password,
    );
    if (!user) {
      return alert("Invalid Credentials..!!");
    } else {
      alert("Login Successfull...!!");
      // Save user data to localStorage
      localStorage.setItem("loggedInUser", JSON.stringify(user));
      window.location.href = "./src/Home/home.html";
    }
  });

  const signupLink = document.getElementById("signupLink");
  const loginLink = document.getElementById("loginLink");

  signupLink.addEventListener("click", () => {
    showSignupForm();
  });

  loginLink.addEventListener("click", (e) => {
    showLoginForm();
  });

  const signupForm = document.getElementById("signupForm");

  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fullname = document.getElementById("signup-name").value;
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;
    const confirmPassword = document.getElementById("signup-confirm").value;

    if (password !== confirmPassword) {
      return alert("Password doesn't matched!!");
    }

    const response = await fetch("http://localhost:3000/users", {
      method: "GET",
    });
    const users = await response.json();

    const user = users.find(
      (u) => u.email === email && u.password === password,
    );

    if (user) {
      return alert("User Already Exist!!");
    } else {
      await fetch("http://localhost:3000/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: generateShortId(),
          fullname,
          email,
          password,
          createdAt: new Date().toLocaleString(),
        }),
      });

      alert("Account is Created! please Login..");
      showLoginForm();
    }
  });
});
