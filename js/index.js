
class Graph {
  constructor() {
    this.adjacencyList = {};
  }

  addUser(user) {
    if (!this.adjacencyList[user.username]) {
      this.adjacencyList[user.username] = { data: user, friends: [] };
    }
  }
  
  addFriend(username1, username2) {
    if (
      this.adjacencyList[username1] &&
      this.adjacencyList[username2] &&
      !this.adjacencyList[username1].friends.includes(username2)
    ) {
      this.adjacencyList[username1].friends.push(username2);
      this.adjacencyList[username2].friends.push(username1);
    }
  }

  getUser(username) {
    return this.adjacencyList[username] || null;
  }

  getFriends(username) {
    return this.adjacencyList[username]?.friends || [];
  }
}



function encryptPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  return crypto.subtle.digest("SHA-256", data).then((hashBuffer) => {
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
  });
}

const userGraph = new Graph();


function loadGraphFromStorage() {
  const graphData = JSON.parse(localStorage.getItem("userGraph")) || {};
  Object.keys(graphData).forEach((username) => {
    const userNode = graphData[username];
    userGraph.addUser(userNode.data);
    userNode.friends.forEach((friend) => userGraph.addFriend(username, friend));
  });
}



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
const logoutButton = document.getElementById("logout-btn");

function isStrongPassword(password) {
  const passwordErrors = [];
  if (!/(?=.*[a-z])/.test(password)) passwordErrors.push("lowercase letter");
  if (!/(?=.*[A-Z])/.test(password)) passwordErrors.push("uppercase letter");
  if (!/(?=.*\d)/.test(password)) passwordErrors.push("number");
  if (!/(?=.*[@$!%*?&])/.test(password)) passwordErrors.push("special character");
  if (password.length < 8) passwordErrors.push("at least 8 characters");

  return passwordErrors;
}



function checkUsernameAvailability(username) {
  const usernameAvailabilityMessage = document.getElementById("signup-username-error");
  const usernameInput = document.getElementById("signup-username");

  const user = userGraph.getUser(username);
  if (user) {
    usernameInput.style.borderColor = "red";
    usernameAvailabilityMessage.textContent = "Username already taken!";
    usernameAvailabilityMessage.style.color = "red";
  } else {
    usernameInput.style.borderColor = "green";
    usernameAvailabilityMessage.textContent = "";
  }
}


function isValidEmail(email) {

  const gmailRegex = /^[a-zA-Z0-9._-]+@(gmail\.com|googlemail\.com)$/;

  const generalEmailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  return gmailRegex.test(email) || generalEmailRegex.test(email);
}


signupUsername.addEventListener("input", (e) => {
  const username = e.target.value;
  const usernameAvailabilityMessage = document.getElementById("signup-username-error");

  const user = userGraph.getUser(username);
  if (user) {
    signupUsername.style.borderColor = "red";
    usernameAvailabilityMessage.textContent = "Username already taken!";
    usernameAvailabilityMessage.style.color = "red";
    usernameAvailabilityMessage.style.display = "block";
  } else {
    signupUsername.style.borderColor = "green";
    usernameAvailabilityMessage.style.display = "none"; 
    usernameAvailabilityMessage.textContent = ""; 
  }
});



signupPassword.addEventListener("input", () => {
  const passwordStrengthMessage = document.getElementById("signup-password-error");
  const passwordErrors = isStrongPassword(signupPassword.value);

  if (passwordErrors.length > 0) {
    signupPassword.style.borderColor = "red";
    passwordStrengthMessage.textContent = "Missing: " + passwordErrors.join(", ");
    passwordStrengthMessage.style.color = "red";
    passwordStrengthMessage.style.display = "block";
  } else {
    signupPassword.style.borderColor = "green";
    passwordStrengthMessage.style.display = "none";
    passwordStrengthMessage.textContent = ""; 
  }
});



signupEmail.addEventListener("input", () => {
  const emailMessage = document.getElementById("signup-email-error");

  if (isValidEmail(signupEmail.value)) {
    signupEmail.style.borderColor = "green";
    emailMessage.style.display = "none"; 
    emailMessage.textContent = ""; 
  } else {
    signupEmail.style.borderColor = "red";
    emailMessage.textContent = "Invalid Email!";
    emailMessage.style.color = "red";
    emailMessage.style.display = "block";
  }
});



signupConfirmPassword.addEventListener("input", () => {
  const confirmPasswordMessage = document.getElementById("signup-confirm-password-error");

  if (signupPassword.value !== signupConfirmPassword.value) {
    signupConfirmPassword.style.borderColor = "red";
    confirmPasswordMessage.textContent = "Passwords do not match!";
    confirmPasswordMessage.style.color = "red";
    confirmPasswordMessage.style.display = "block"; 
  } else {
    signupConfirmPassword.style.borderColor = "green";
    confirmPasswordMessage.style.display = "none"; 
    confirmPasswordMessage.textContent = ""; 
  }
});



spans.forEach((span) =>
  span.addEventListener("click", () => {
    container.classList.toggle("active");
    section.classList.toggle("active");
  })
);

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();

 
  if (signupPassword.value !== signupConfirmPassword.value) {
    alert("Passwords do not match!");
    return;
  }

 
  const passwordErrors = isStrongPassword(signupPassword.value);
  if (passwordErrors.length > 0) {
    alert("Your password must contain: " + passwordErrors.join(", "));
    return;
  }

  
  if (!isValidEmail(signupEmail.value)) {
    alert("Please enter a valid email address.");
    return;
  }


  const existingUser = userGraph.getUser(signupUsername.value);
  if (existingUser) {
    alert("Username already exists!");
    return;
  }


  const encryptedPassword = await encryptPassword(signupPassword.value);


  const user = {
    id: Date.now(),
    username: signupUsername.value,
    email: signupEmail.value,
    password: encryptedPassword,
  };

  try {
    // Add user to the graph
    userGraph.addUser(user);
    localStorage.setItem('username', signupUsername.value);

    // Update and save the graph in localStorage
    const currentGraph = JSON.parse(localStorage.getItem("userGraph")) || {};
    currentGraph[signupUsername.value] = { data: user, friends: [] };
    localStorage.setItem("userGraph", JSON.stringify(currentGraph));

    alert("Registration successful!");
    animateAndRedirectToInterestPage();
    signupForm.reset();
  } catch (error) {
    alert("An error occurred: " + error.message);
  }
});



function animateAndRedirectToInterestPage() {
 
  document.body.style.transition = "opacity 0.8s ease-in-out";
  document.body.style.opacity = "0";

  setTimeout(() => {
   
    window.location.replace("interest.html");
  }, 800); 
}



window.onload = () => {
  
  history.pushState(null, null, window.location.href);


  window.addEventListener("popstate", () => {
   
    history.pushState(null, null, window.location.href);
  });
};



loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const userNode = userGraph.getUser(loginUsername.value);

  if (!userNode) {
    alert("User not found!");
    return;
  }

  const encryptedInputPassword = await encryptPassword(loginPassword.value);
  if (userNode.data.password !== encryptedInputPassword) {
    alert("Invalid password!");
    return;
  }


  localStorage.setItem("loggedInUser", JSON.stringify(userNode.data));


  showProfile(userNode.data);
});


function showProfile(user) {

  document.body.style.transition = "opacity 0.8s ease-in-out";
  document.body.style.opacity = "0"; 

  setTimeout(() => {
    
    window.location.replace("dashboard.html");
  }, 800); 
}



window.onload = () => {
  loadGraphFromStorage();

  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
  if (loggedInUser) {
    showProfile(loggedInUser);
  } else {
    loginForm.style.display = "block";
    signupForm.style.display = "block";
  }
};

