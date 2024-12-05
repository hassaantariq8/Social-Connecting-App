class User {
    constructor(username, password, email, bio) {
        this.username = username;
        this.password = password;
        this.email = email;
        this.bio = bio;
        this.connections = [];
        this.posts = []; // Array acting as a priority queue
    }

    addConnection(user) {
        if (!this.connections.includes(user.username)) {
            this.connections.push(user.username);
            user.connections.push(this.username);
        }
    }

    addPost(content) {
        const now = new Date();
        const timestamp = now.toISOString(); // Use ISO format for consistent sorting
        const day = now.toLocaleDateString('en-US', { weekday: 'long' });
        const date = now.toLocaleDateString();
        const time = now.toLocaleTimeString();

        // Add post to the priority queue
        this.posts.push({ content, timestamp, day, date, time });
        this.sortPostsByTimestamp(); // Ensure latest posts are always first
    }

    sortPostsByTimestamp() {
        // Sort posts by timestamp in descending order
        this.posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    getConnections() {
        return this.connections;
    }

    toString() {
        return this.username;
    }
}


// Global user graph
let userGraph = [];

function saveUsersToLocalStorage() {
    const usersToSave = userGraph.map(user => ({
        username: user.username,
        password: user.password,
        email: user.email,
        bio: user.bio,
        connections: user.connections,
        posts: user.posts, // Save posts along with user data
    }));
    localStorage.setItem('userGraph', JSON.stringify(usersToSave));
}

function loadUsersFromLocalStorage() {
    const data = localStorage.getItem('userGraph');
    if (data) {
        const users = JSON.parse(data);
        userGraph = users.map(userData => {
            const user = new User(userData.username, userData.password, userData.email, userData.bio);
            user.connections = userData.connections;
            user.posts = userData.posts || []; // Restore posts
            user.sortPostsByTimestamp(); // Ensure posts are sorted after loading
            return user;
        });
    }
}


// Initialize user data
loadUsersFromLocalStorage();

export default { User, userGraph, saveUsersToLocalStorage };
