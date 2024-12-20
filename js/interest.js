
const selectedInterestsQueue = [];

const interestGraph = new Map();


function initializeInterestGraph() {
    const storedGraph = localStorage.getItem('interestGraph');
    if (storedGraph) {
       
        const graphData = JSON.parse(storedGraph);
        graphData.forEach(([key, value]) => {
            interestGraph.set(key, value);
        });
    }
}


function persistInterestGraph(callback = null) {
    localStorage.setItem('interestGraph', JSON.stringify(Array.from(interestGraph.entries())));
    console.log('InterestGraph:', interestGraph);
    if (callback) callback(); 
}


function saveUserData(username, callback = null) {
    initializeInterestGraph(); 

    const userData = {
        interests: Array.from(selectedInterestsQueue), 
        profilePicture: null,
    };

    if (profilePicInput.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            userData.profilePicture = e.target.result; 
            interestGraph.set(username, userData); 
            persistInterestGraph(callback); 
        };
        reader.readAsDataURL(profilePicInput.files[0]);
    } else {
        interestGraph.set(username, userData); 
        persistInterestGraph(callback); 
    }
}

const interests = document.querySelectorAll('.interest');
const selectedInterests = new Set();
const nextButton = document.getElementById('next');
const profileSection = document.getElementById('profile-section');
const interestContainer = document.getElementById('interests');
const doneButton = document.getElementById('done');
const backButton = document.getElementById('back');
const profilePicInput = document.getElementById('profile-pic');
const profilePreview = document.getElementById('profile-preview');
const interestHeading = document.getElementById('interest-heading');
const container = document.querySelector('.container'); 


interests.forEach(interest => {
    interest.addEventListener('click', () => {
        const interestName = interest.getAttribute('data-interest');
        const index = selectedInterestsQueue.indexOf(interestName);

        if (index !== -1) {
           
            selectedInterestsQueue.splice(index, 1);
            selectedInterests.delete(interestName);
            interest.classList.remove('selected');
        } else {
           
            selectedInterestsQueue.push(interestName);
            selectedInterests.add(interestName);
            interest.classList.add('selected');
        }

        console.log('Selected Interests Queue:', selectedInterestsQueue); 
    });
});


nextButton.addEventListener('click', () => {
    const username = localStorage.getItem('username');
    if (selectedInterests.size === 0) {
        alert('Please select at least one interest.');
        return;
    }

    saveUserData(username);

    interestContainer.style.display = 'none';
    interestHeading.style.display = 'none';
    nextButton.style.display = 'none';

   
    container.classList.add('active');
    profileSection.classList.add('active');
});


doneButton.addEventListener('click', () => {
    const username = localStorage.getItem('username'); 

    if (!username) {
        alert('Error: User is not registered. Please register first.');
        return;
    }

   
    saveUserData(username, () => {
        localStorage.setItem('isLoggedIn', 'true'); 
        smoothRedirect('index.html');
    });
});


function smoothRedirect(url) {
    document.body.style.transition = 'opacity 0.8s ease-in-out';
    document.body.style.opacity = '0';
    setTimeout(() => {
        window.location.replace(url); 
    }, 800); 
}


backButton.addEventListener('click', () => {
    profileSection.classList.add('exiting'); 
    setTimeout(() => {
        profileSection.classList.remove('active', 'exiting'); 
        interestContainer.style.display = 'flex';
        interestHeading.style.display = 'block';
        nextButton.style.display = 'inline-block';
    }, 300); 
});


profilePicInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            profilePreview.innerHTML = `<img src="${e.target.result}" alt="Profile Picture">`;
        };
        reader.readAsDataURL(file);
    }
});


window.onload = () => {
    initializeInterestGraph(); 

    const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
    const username = localStorage.getItem("username"); 
    if (!loggedInUser && username) {
        
        const userNode = interestGraph.get(username);

        if (userNode) {
           
            localStorage.setItem("loggedInUser", JSON.stringify(userNode));
            showProfile(userNode);
        }
    } else {
        loginForm.style.display = "block";
        signupForm.style.display = "block";
    }

    
    history.pushState(null, null, window.location.href);
    window.addEventListener('popstate', () => {
        history.pushState(null, null, window.location.href);
    });
};
