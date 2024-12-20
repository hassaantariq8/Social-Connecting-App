let liked = false;
let likeCount = 0;
let commentCount = 0;

const commentQueue = [];
let friendRequests = {}; 

function initializeDashboard() {
    const userSection = document.getElementById('user-section');
    const friendsList = document.getElementById('friends-list');
 


    const graphData = JSON.parse(localStorage.getItem("userGraph")) || {};
    const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
    const interestGraph = new Map(JSON.parse(localStorage.getItem("interestGraph")) || []); 

    if (!loggedInUser) {
        console.error("No logged-in user found.");
        return;
    }

 
    const userNode = graphData[loggedInUser.username];
    if (!userNode) {
        console.error("User not found in the graph.");
        return;
    }

    
    const userInterestData = interestGraph.get(loggedInUser.username);
    const userInterests = userInterestData?.interests || [];
    const profilePicURL = userInterestData?.profilePicture || "https://via.placeholder.com/100";


    const profilePic = userSection.querySelector('.profile-pic');
    const userName = userSection.querySelector('.user-name');
    const userUsername = userSection.querySelector('.user-username');

    if (profilePic) {
        profilePic.src = profilePicURL;
        profilePic.alt = "Profile Picture";
    }

    if (userName) {
        userName.textContent = userNode.data.username || "Unknown User";
    }

    if (userUsername) {
        userUsername.textContent = `@${userNode.data.username}` || "@unknown";
    }


    updateFriendsList();
    updateRequestsList() 



    loadFriendRequests();
    updateMutualFriends();
    updateSuggestions();
}


window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('shrink');
    } else {
        navbar.classList.remove('shrink');
    }
});



function logOut() {
    localStorage.removeItem("loggedInUser");
    document.body.style.opacity = "0"; 
    setTimeout(() => {
        window.location.replace("index.html"); 
    }, 800); 
}




function checkEnter(event, input) {
    if (event.key === 'Enter') {
        postComment();
    }
}

function updateComments() {
    const commentSection = document.getElementById('comment-section');
    commentSection.innerHTML = ''; // Clear existing comments

    commentQueue.forEach(comment => {
        const commentElement = document.createElement('div');
        commentElement.classList.add('comment');

        const userElement = document.createElement('span');
        userElement.classList.add('comment-user');
        userElement.textContent = comment.username;

        const timeElement = document.createElement('span');
        timeElement.classList.add('comment-time');
        timeElement.textContent = comment.timestamp;

        const textElement = document.createElement('p');
        textElement.textContent = comment.text;

        commentElement.appendChild(userElement);
        commentElement.appendChild(timeElement);
        commentElement.appendChild(textElement);

        commentSection.appendChild(commentElement);
    });
}

function searchUsers(query) {
    const searchResults = document.getElementById('search-results');
    const userGraph = JSON.parse(localStorage.getItem('userGraph')) || {};
    const interestGraph = JSON.parse(localStorage.getItem('interestGraph')) || [];
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));

    if (!loggedInUser) {
        console.error("No logged-in user found.");
        return;
    }

    if (!query.trim()) {
        searchResults.innerHTML = ''; // Clear results
        return;
    }

    console.log("User Graph:", userGraph);
    console.log("Interest Graph:", interestGraph);
    console.log("Search Query:", query);

    // Search users from userGraph based on the first two words
    const matches = Object.keys(userGraph).filter(username => {
        const userData = userGraph[username];
        if (!userData || !userData.data || !userData.data.username) {
            console.warn(`Invalid data for username: ${username}`);
            return false;
        }

        const fullName = userData.data.username.toLowerCase();
        const words = fullName.split(' ').slice(0, 2).join(' '); // First two words
        return words.includes(query.toLowerCase()) && username !== loggedInUser.username;
    });

    console.log("Matched Users:", matches);

    if (matches.length === 0) {
        searchResults.innerHTML = '<p>No users found.</p>';
        return;
    }

    // Helper: Find profile picture from interestGraph
    function getProfilePicture(username) {
        const userEntry = interestGraph.find(([name]) => name === username);
        return userEntry && userEntry[1]?.profilePicture
            ? userEntry[1].profilePicture
            : 'https://via.placeholder.com/40'; // Fallback placeholder
    }

    // Display matched users with profile pictures from interestGraph
    searchResults.innerHTML = matches
        .map(username => {
            const userData = userGraph[username];
            const profilePicture = getProfilePicture(username);
            return `
                <div class="search-item">
                    <img src="${profilePicture}" alt="Profile Picture">
                    <div class="user-details">
                        <p>${userData.data.username}</p>
                        <p class="small">@${username}</p>
                    </div>
                    <button onclick="sendFriendRequest('${username}')">Send Request</button>
                </div>`;
        })
        .join('');
}


function updateFriendsList() {
    const friendsList = document.getElementById('friends-list');
    const graphData = JSON.parse(localStorage.getItem('userGraph')) || {};
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser')) || {};
    const interestGraph = JSON.parse(localStorage.getItem('interestGraph')) || [];

    if (!loggedInUser) {
        console.error('No logged-in user found.');
        return;
    }

    const userNode = graphData[loggedInUser.username];
    if (!userNode) {
        console.error('User not found in the graph.');
        return;
    }

    friendsList.innerHTML = ''; // Clear current list
    const friends = userNode.friends || [];

    if (friends.length === 0) {
        friendsList.innerHTML = '<p>No friends added yet.</p>';
        return;
    }

    // Helper: Find profile picture from interestGraph
    function getProfilePicture(username) {
        const userEntry = interestGraph.find(([name]) => name === username);
        return userEntry && userEntry[1]?.profilePicture
            ? userEntry[1].profilePicture
            : 'https://via.placeholder.com/40'; // Fallback placeholder
    }

    friends.forEach(friendUsername => {
        const friendNode = graphData[friendUsername];
        if (friendNode) {
            const profilePicture = getProfilePicture(friendUsername);

            const friendItem = document.createElement('div');
            friendItem.classList.add('friend');
            friendItem.innerHTML = `
                <img src="${profilePicture}" alt="Profile Picture">
                <p>${friendNode.data.username}</p>
                <button onclick="removeFriend('${friendUsername}')">Remove Friend</button>
            `;
            friendsList.appendChild(friendItem);
        }
    });
}


function updateSenderFriendsList(senderUsername) {
    const graphData = JSON.parse(localStorage.getItem('userGraph')) || {};
    const senderNode = graphData[senderUsername];

    if (!senderNode) {
        console.error('Sender not found in the graph.');
        return;
    }

    const senderFriendsList = document.getElementById('sender-friends-list'); 
    if (!senderFriendsList) return;

    senderFriendsList.innerHTML = ''; 
    const friends = senderNode.friends || [];

    if (friends.length === 0) {
        senderFriendsList.innerHTML = '<p>No friends added yet.</p>';
        return;
    }

    friends.forEach(friendUsername => {
        const friendNode = graphData[friendUsername];
        if (friendNode) {
            const friendItem = document.createElement('div');
            friendItem.classList.add('friend');
            friendItem.innerHTML = `
                <img src="${friendNode.data.profilePicture || 'https://via.placeholder.com/40'}" alt="Profile Picture">
                <p>${friendNode.data.username}</p>
            `;
            senderFriendsList.appendChild(friendItem);
        }
    });
}




function saveFriendRequests() {
    localStorage.setItem('friendRequests', JSON.stringify(friendRequests));
}



function loadFriendRequests() {
    friendRequests = JSON.parse(localStorage.getItem('friendRequests')) || {};
    console.log('Loaded');
}


function sendFriendRequest(recipientUsername) { 
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    
    if (!loggedInUser) {
        alert('You must be logged in to send a friend request.');
        return;
    }

    const graphData = JSON.parse(localStorage.getItem('userGraph')) || {};
    const loggedInUsername = loggedInUser.username;

  
    const userNode = graphData[loggedInUsername];
    const recipientNode = graphData[recipientUsername];

    if (!userNode || !recipientNode) {
        alert('User not found in the graph.');
        return;
    }

    const userFriends = userNode.friends || [];

   
    if (userFriends.includes(recipientUsername)) {
        alert('You are already friends with this user.');
        return;
    }

   
    if (!friendRequests[recipientUsername]) {
        friendRequests[recipientUsername] = loggedInUsername;
        saveFriendRequests();

        alert('Friend request sent!');
    } else {
        alert('You have already sent a friend request to this user.');
    }
}


function updateRequestsList() {
    const requestsList = document.getElementById('requests-list');
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const interestGraph = JSON.parse(localStorage.getItem('interestGraph')) || [];
    const friendRequests = JSON.parse(localStorage.getItem('friendRequests')) || {}; 

    if (!loggedInUser) {
        console.error('No logged-in user found.');
        return;
    }

    requestsList.innerHTML = ''; 
    const requests = Object.keys(friendRequests).filter(
        recipient => recipient === loggedInUser.username
    );

    if (requests.length === 0) {
        requestsList.innerHTML = '<p>No friend requests.</p>';
        return;
    }


    function getProfilePicture(username) {
        const userEntry = interestGraph.find(([name]) => name === username);
        return userEntry && userEntry[1]?.profilePicture
            ? userEntry[1].profilePicture
            : 'https://via.placeholder.com/40'; 
    }

    requests.forEach(recipient => {
        const senderUsername = friendRequests[recipient]; 
        const graphData = JSON.parse(localStorage.getItem('userGraph')) || {};
        const senderNode = graphData[senderUsername];

        if (senderNode) {
            const profilePicture = getProfilePicture(senderUsername);

            const requestItem = document.createElement('div');
            requestItem.classList.add('request');
            requestItem.innerHTML = `
                <img src="${profilePicture}" alt="Profile Picture">
                <p>${senderNode.data.username}</p>
                <button onclick="acceptFriendRequest('${senderUsername}')">Accept</button>
                <button onclick="declineFriendRequest('${senderUsername}')">Decline</button>
            `;
            requestsList.appendChild(requestItem);
        }
    });
}



function acceptFriendRequest(senderUsername) {
    const graphData = JSON.parse(localStorage.getItem('userGraph')) || {};
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));

    if (!loggedInUser) {
        console.error('No logged-in user found.');
        return;
    }

    const userNode = graphData[loggedInUser.username];
    const senderNode = graphData[senderUsername];

    if (!userNode || !senderNode) {
        console.error('Sender or recipient not found in the graph data.');
        return;
    }

  
    userNode.friends = [...new Set(userNode.friends || [])];
    senderNode.friends = [...new Set(senderNode.friends || [])];


    if (!userNode.friends.includes(senderUsername)) {
        userNode.friends.push(senderUsername);
    }
    if (!senderNode.friends.includes(loggedInUser.username)) {
        senderNode.friends.push(loggedInUser.username);
    }


    Object.keys(friendRequests).forEach(recipient => {
        if (friendRequests[recipient] === senderUsername && recipient === loggedInUser.username) {
            delete friendRequests[recipient];
        }
    });

  
    localStorage.setItem('userGraph', JSON.stringify(graphData));
    saveFriendRequests();


    updateFriendsList();
    updateRequestsList(); 
    alert(`You are now friends with ${senderNode.data.username}!`);
}

function declineFriendRequest(senderUsername) {
    if (friendRequests[senderUsername]) {
        delete friendRequests[senderUsername];
        saveFriendRequests();
        updateRequestsList();
        alert('Friend request declined.');
    }
}





function declineFriendRequest(senderUsername) {
    if (friendRequests[senderUsername]) {
        delete friendRequests[senderUsername];
        saveFriendRequests();
        updateRequestsList();
        alert('Friend request declined.');
    }
}
function removeFriend(friendUsername) {
    const graphData = JSON.parse(localStorage.getItem('userGraph')) || {};
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));

    if (!loggedInUser) {
        console.error('No logged-in user found.');
        return;
    }

    const userNode = graphData[loggedInUser.username];
    const friendNode = graphData[friendUsername];

    if (!userNode || !friendNode) {
        console.error('User or friend not found in the graph data.');
        return;
    }

    userNode.friends = (userNode.friends || []).filter(username => username !== friendUsername);
    friendNode.friends = (friendNode.friends || []).filter(username => username !== loggedInUser.username);

    localStorage.setItem('userGraph', JSON.stringify(graphData));


    updateFriendsList();
    alert(`${friendNode.data.username} has been removed from your friends.`);
}
function getRandomItems(array, count) {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}


function findMutualFriends(loggedInUser, graphData) {
    const userFriends = new Set(graphData[loggedInUser.username]?.friends || []);
    const mutualFriends = [];

    userFriends.forEach(friend => {
        const friendFriends = graphData[friend]?.friends || [];
        friendFriends.forEach(friendOfFriend => {
            if (
                userFriends.has(friendOfFriend) &&
                friendOfFriend !== loggedInUser.username &&
                !mutualFriends.some(mf => mf.username === friendOfFriend)
            ) {
                mutualFriends.push({
                    username: friendOfFriend,
                    mutualWith: friend, 
                });
            }
        });
    });

    return getRandomItems(mutualFriends, 3); 
}


function suggestFriends(loggedInUser, graphData, interestGraph) {
    const userFriends = new Set(graphData[loggedInUser.username]?.friends || []);
    const userInterests = new Set(interestGraph[loggedInUser.username]?.interests || []);
    const suggestions = new Set();

    console.log("Logged-in user:", loggedInUser.username);
    console.log("User's friends:", userFriends);
    console.log("User's interests:", userInterests);


    graphData[loggedInUser.username]?.friends?.forEach(friend => {
        graphData[friend]?.friends?.forEach(friendOfFriend => {
            if (!userFriends.has(friendOfFriend) && friendOfFriend !== loggedInUser.username) {
                suggestions.add(friendOfFriend);
            }
        });
    });

    console.log("Friends of friends:", suggestions);


    Object.keys(interestGraph).forEach(username => {
        const userInterestsList = interestGraph[username]?.interests || [];
        console.log(`Checking shared interests for ${username}:`, userInterestsList);
        if (
            username !== loggedInUser.username &&
            !userFriends.has(username) &&
            userInterestsList.some(interest => userInterests.has(interest))
        ) {
            suggestions.add(username);
        }
    });

    console.log("Suggestions after adding shared interests:", suggestions);

    
    Object.keys(graphData)
        .filter(username => username !== loggedInUser.username && !userFriends.has(username))
        .sort((a, b) => (graphData[b]?.friends?.length || 0) - (graphData[a]?.friends?.length || 0))
        .slice(0, 5)
        .forEach(username => suggestions.add(username));

    console.log("Final suggestions after adding popular users:", suggestions);

    if (suggestions.size === 0) {
        console.log("No suggestions found. Returning fallback random users.");
        return getRandomItems(
            Object.keys(graphData).filter(username => username !== loggedInUser.username),
            2
        );
    }

    return getRandomItems([...suggestions], 3);
}

function updateMutualFriends() {
    const mutualFriendsList = document.getElementById('mutual-friends-list');
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const graphData = JSON.parse(localStorage.getItem('userGraph')) || {};
    const interestGraph = JSON.parse(localStorage.getItem('interestGraph')) || [];

    if (!loggedInUser) {
        console.error("No logged-in user found.");
        return;
    }

    const mutualFriends = findMutualFriends(loggedInUser, graphData);

    console.log("Mutual friends to display:", mutualFriends);

    function getProfilePicture(username) {
        const userEntry = interestGraph.find(([name]) => name === username);
        return userEntry && userEntry[1]?.profilePicture
            ? userEntry[1].profilePicture
            : 'https://via.placeholder.com/40'; 
    }

    mutualFriendsList.innerHTML = mutualFriends.length
        ? mutualFriends
              .map(({ username, mutualWith }) => {
                  const friendData = graphData[username]?.data || {};
                  const profilePicture = getProfilePicture(username);

                  return `
                      <div class="friend">
                          <img src="${profilePicture}" alt="Profile Picture">
                          <div>
                              <p class="friend-name">${friendData.name || username}</p>
                              <p class="friend-username">@${username}</p>
                              <p class="mutual-info">Mutual friend: @${mutualWith}</p>
                          </div>
                      </div>`;
              })
              .join('')
        : '<p>No mutual friends found.</p>';
}



function updateSuggestions() {
    const suggestionsList = document.getElementById('suggestions-list');
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const graphData = JSON.parse(localStorage.getItem('userGraph')) || {};
    const interestGraph = new Map(JSON.parse(localStorage.getItem('interestGraph')) || []);

    if (!loggedInUser) return;


    const suggestions = suggestFriends(loggedInUser, graphData, interestGraph);

    console.log("Generated Suggestions:", suggestions); 
    console.log("Graph Data:", graphData);

    if (suggestions.length === 0) {
        
        const fallbackUsers = getRandomItems(Object.keys(graphData), 2);
        console.log("Fallback Suggestions:", fallbackUsers); 

       
        suggestionsList.innerHTML = fallbackUsers
            .map(username => {
                const fallbackData = graphData[username]?.data;
                const fallbackProfilePic = interestGraph.get(username)?.profilePicture || 'https://via.placeholder.com/40';

                return `
                    <div class="friend">
                        <img src="${fallbackProfilePic}" alt="Profile Picture">
                        <div>
                            <p class="friend-name">${fallbackData?.name || username}</p>
                            <p class="friend-username">@${username}</p>
                        </div>
                        <button onclick="sendFriendRequest('${username}')" class="button-primary">Send Request</button>
                    </div>`;
            })
            .join('');
    } else {
       
        suggestionsList.innerHTML = suggestions
            .map(username => {
                const suggestionData = graphData[username]?.data;
                const suggestionProfilePic = interestGraph.get(username)?.profilePicture || 'https://via.placeholder.com/40';

                return `
                    <div class="friend">
                        <img src="${suggestionProfilePic}" alt="Profile Picture">
                        <div>
                            <p class="friend-name">${suggestionData?.name || username}</p>
                            <p class="friend-username">@${username}</p>
                        </div>
                        <button onclick="sendFriendRequest('${username}')" class="button-primary">Send Request</button>
                    </div>`;
            })
            .join('');
    }
}













initializeDashboard();
