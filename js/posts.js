
class PriorityQueue {
    constructor() {
        this.queue = [];
    }

    enqueue(post) {
        this.queue.push(post);
        this.queue.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Sort by timestamp
    }

    getAll() {
        return [...this.queue];
    }

    isEmpty() {
        return this.queue.length === 0;
    }

    dequeue() {
        return this.queue.shift();
    }
}


const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser")) || { username: "currentUser", name: "Current User" };
const postQueue = new PriorityQueue();


function togglePostModal(isVisible) {
    const modal = document.getElementById("post-modal");
    modal.style.display = isVisible ? "flex" : "none";

    if (!isVisible) {
        document.getElementById("new-post-text").value = "";
        document.getElementById("post-media").value = "";
    }
}


function showAddPostSection() {
    const modal = document.getElementById("post-modal");
    if (modal.style.display !== "flex") {
        togglePostModal(true);
    }
}


function submitPost() {
    const text = document.getElementById("new-post-text").value.trim();
    const mediaFile = document.getElementById("post-media").files[0];

    if (!text && !mediaFile) {
        alert("Please enter some text or upload a media file.");
        return;
    }

    createPostObject(text, mediaFile).then((newPost) => {
        postQueue.enqueue(newPost);
        localStorage.setItem("posts", JSON.stringify(postQueue.getAll()));
        updatePosts();
        togglePostModal(false);
    });
}


async function createPostObject(text, mediaFile) {
    const base64Media = mediaFile ? await fileToBase64(mediaFile) : null;
    return {
        username: loggedInUser.username,
        name: loggedInUser.name,
        text,
        media: base64Media,
        mediaType: mediaFile ? (mediaFile.type.startsWith("image") ? "image" : "video") : null,
        timestamp: new Date().toISOString(),
        likes: 0,
        likedByUser: false,
        comments: [],
    };
}


function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
}


function updatePosts() {
    const postsContainer = document.getElementById("posts-container");
    const allPosts = postQueue.getAll();

    // Retrieve the logged-in user's friends list
    const graphData = JSON.parse(localStorage.getItem('userGraph')) || {};
    const loggedInUserData = graphData[loggedInUser.username];

    // Ensure friends list exists
    const friends = loggedInUserData?.friends || [];

    // Filter posts: Only include posts from friends and the logged-in user
    const filteredPosts = allPosts.filter(post => 
        post.username === loggedInUser.username || friends.includes(post.username)
    );

    // Render the filtered posts
    postsContainer.innerHTML = filteredPosts.map(renderPost).join("");
}



function renderPost(post) {
    const interestGraph = JSON.parse(localStorage.getItem('interestGraph')) || [];

    // Helper: Find profile picture from interestGraph
    function getProfilePicture(username) {
        const userEntry = interestGraph.find(([name]) => name === username);
        return userEntry && userEntry[1]?.profilePicture
            ? userEntry[1].profilePicture
            : 'https://via.placeholder.com/50'; // Fallback placeholder
    }

    const profilePicture = getProfilePicture(post.username);

    return `
        <div class="post">
            <div class="post-header">
                <img src="${profilePicture}" alt="Profile Picture" class="post-profile-pic">
                <div>
                    <p class="post-author">${post.username}</p>
                    <p class="post-username">@${post.username}</p>
                </div>
                <p class="post-time">${formatTime(post.timestamp)}</p>
            </div>
            <div class="post-content">
                ${post.text ? `<p>${post.text}</p>` : ""}
                ${renderMedia(post)}
            </div>
            <div class="post-actions">
                <button onclick="toggleLike('${post.timestamp}')">
                    <span class="${post.likedByUser ? 'liked' : ''}">❤️</span> Like ${post.likes}
                </button>
                <button onclick="toggleCommentSection('${post.timestamp}')">💬 ${post.comments.length}</button>
            </div>
            <div class="post-comments" id="comments-${post.timestamp}" style="display: none;">
                ${renderComments(post.comments)}
                <input type="text" placeholder="Add a comment..." onkeydown="addComment(event, '${post.timestamp}')">
            </div>
        </div>`;
}



function renderMedia(post) {
    if (!post.media) return "";
    return post.mediaType === "image" ? 
        `<img src="${post.media}" alt="Post Image" class="post-media">` : 
        `<video controls class="post-media"><source src="${post.media}" type="video/mp4">Your browser does not support the video tag.</video>`;
}


function renderComments(comments) {
    return comments.map(comment => `<p><strong>${comment.username}:</strong> ${comment.text}</p>`).join("");
}


function formatTime(timestamp) {
    return new Date(timestamp).toLocaleString();
}


function toggleLike(timestamp) {
    const allPosts = postQueue.getAll();
    const post = allPosts.find(post => post.timestamp === timestamp);

    if (post) {
        // Check if the logged-in user has already liked the post
        if (post.likedByUser) {
            alert("You can only like a post once!");
            return;
        }

        // If not liked, like the post
        post.likes++;
        post.likedByUser = true;  // Mark post as liked by the user

        // Update posts in localStorage
        localStorage.setItem("posts", JSON.stringify(allPosts));
        updatePosts();
    }
}


function toggleCommentSection(timestamp) {
    const commentsSection = document.getElementById(`comments-${timestamp}`);
    commentsSection.style.display = commentsSection.style.display === "none" ? "block" : "none";
}


function addComment(event, timestamp) {
    if (event.key === "Enter") {
        const text = event.target.value.trim();
        if (text) {
            const allPosts = postQueue.getAll();
            const post = allPosts.find(post => post.timestamp === timestamp);

            if (post) {
                post.comments.push({ username: loggedInUser.username, text });
                localStorage.setItem("posts", JSON.stringify(allPosts));
                updatePosts();
            }
        }
    }
}


function init() {
    const storedPosts = JSON.parse(localStorage.getItem("posts")) || [];
    storedPosts.forEach(post => postQueue.enqueue(post));
    updatePosts();
}

document.addEventListener("DOMContentLoaded", init);
