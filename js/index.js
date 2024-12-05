// Query elements
const container = document.querySelector(".container");
const section = document.querySelector("section");
const spans = [...document.querySelectorAll(".form-box .top span")];
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");
const profileSection = document.getElementById("profile-section");
const loginUsername = document.getElementById("login-username");
const loginPassword = document.getElementById("login-password");
const signupUsername = document.getElementById("signup-username");
const signupEmail = document.getElementById("signup-email");
const signupPassword = document.getElementById("signup-password");
const signupConfirmPassword = document.getElementById("signup-confirm-password");
const profileUsername = document.getElementById("profile-username");
const profileEmail = document.getElementById("profile-email");
const logoutBtn = document.getElementById("logout-btn");
const postTextarea = document.querySelector(".post textarea");
const postButton = document.getElementById("post-button"); // Correct ID
const fileInput = document.getElementById("file-upload"); // Correct ID
const feed = document.querySelector(".posts-list");

// Toggle Forms
spans.forEach(span => span.addEventListener("click", () => {
  container.classList.toggle("active");
  section.classList.toggle("active");
}));

// Register User
signupForm.addEventListener("submit", e => {
  e.preventDefault();
  if (signupPassword.value !== signupConfirmPassword.value) {
    alert("Passwords do not match!");
    return;
  }

  const user = {
    id: Date.now(),
    username: signupUsername.value,
    email: signupEmail.value,
    password: signupPassword.value
  };

  let users = JSON.parse(localStorage.getItem("users")) || [];
  users.push(user);
  localStorage.setItem("users", JSON.stringify(users));
  alert("Registration successful!");
  signupForm.reset();
});

// Login User
loginForm.addEventListener("submit", e => {
  e.preventDefault();
  const users = JSON.parse(localStorage.getItem("users")) || [];
  const user = users.find(u => u.username === loginUsername.value && u.password === loginPassword.value);

  if (!user) {
    alert("Invalid credentials!");
    return;
  }

  localStorage.setItem("loggedInUser", JSON.stringify(user));
  showProfile(user);
});

function showProfile(user) {
  profileSection.style.display = "block";
  document.querySelector(".container").style.display = "none"; // Hide login/signup container
  profileUsername.textContent = user.username;
  profileEmail.textContent = user.email;
}

// Logout
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("loggedInUser");
  window.location.reload();
});

// Post with media
postButton.addEventListener("click", () => {
  const postContent = postTextarea.value.trim();
  const file = fileInput.files[0];

  if (!postContent && !file) {
    alert("Please write something or choose a file to post!");
    return;
  }

  const post = document.createElement("div");
  post.className = "post-item";
  let content = `<p><strong>${profileUsername.textContent}</strong>: ${postContent}</p>`;

  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const mediaType = file.type.split('/')[0];
      let mediaElement;

      if (mediaType === 'image') {
        mediaElement = `<img src="${e.target.result}" alt="Post Media" class="post-media">`;
      } else if (mediaType === 'video') {
        mediaElement = `<video controls class="post-media"><source src="${e.target.result}" type="${file.type}"></video>`;
      }

      content += mediaElement;
      post.innerHTML = content;
      feed.prepend(post);
    };
    reader.readAsDataURL(file);
  } else {
    post.innerHTML = content;
    feed.prepend(post);
  }

  postTextarea.value = "";
  fileInput.value = "";
});

// Load Profile on Page Load
window.onload = () => {
  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  if (user) {
    showProfile(user);
  }
};
