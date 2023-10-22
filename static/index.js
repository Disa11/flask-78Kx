const storage = window.localStorage;
const socket = io();
let messagesLoaded = false;

// Función para agregar un usuario a la lista
function addUserToUserList(username) {
    const userList = document.getElementById("user-list");

    // Verificar si ya existe un elemento con el mismo texto
    const existingUserItem = $(`li:contains('${username}')`);
    
    // Si no existe, agregar el usuario a la lista
    if (existingUserItem) {
        const userItem = document.createElement("li");
        userItem.className = "px-3 py-2 d-block text-white";
        userItem.textContent = username;
        userList.appendChild(userItem);

        socket.emit('user-active', username);
    }
}

socket.on('user-active', (data) => {
    for (let i = 0; i < data.users.length; i++) {
        addUserToUserList(data.users[i]);
    }
});

// Función para eliminar un usuario de la lista
function removeUserFromUserList(username) {
    const userList = document.getElementById("user-list");
    const userItems = userList.getElementsByTagName("li");

    for (let i = 0; i < userItems.length; i++) {
        if (userItems[i].textContent === username) {
            userList.removeChild(userItems[i]);
            break;
        }
    }
}

function toggleForm() {
    const loginInputs = document.getElementsByClassName("input-login");
    const registerInputs = document.getElementsByClassName("input-register");

    for (let i = 0; i < loginInputs.length; i++) {
        loginInputs[i].classList.toggle("hidden-2");
    }

    for (let i = 0; i < registerInputs.length; i++) {
        registerInputs[i].classList.toggle("hidden-2");
    }

    const haveAccount = document.querySelector("#have-acount");
    const loginToRegister = document.getElementById("login-to-register");
    const h1LR = document.querySelector("#h1-l-r");

    if (haveAccount.innerHTML.includes("Already have an account?")) {
        loginToRegister.innerText = "Register";
        haveAccount.innerHTML = "Don't have an account?";
        h1LR.innerHTML = "Login";
        var title = "Login";
    } else {
        haveAccount.innerHTML = "Already have an account?";
        loginToRegister.innerText = "Login";
        h1LR.innerHTML = "Register";
        var title = "Register";
    }
    document.title = title;
    history.pushState({ 'title': title }, title, title)
    return false;
}

function logout() {
    var respuesta = window.confirm("¿?");

    if (respuesta) {
        alert("bye bye");
        var username = storage.getItem("username");

        // Limpiar localStorage primero
        storage.removeItem("username");
        storage.removeItem("password");
        storage.clear();

        // Después de limpiar localStorage, eliminar el usuario de la lista
        //si se hace esto primero no se elimina el storage xd
        removeUserFromUserList(username);

        document.querySelector('#lr-content').classList.add('hide-log');
        socket.emit('logout');
    }
}


function load_messages(room) {
    const request = new XMLHttpRequest();
    request.open('GET', `/loadMessages/${room}`);

    request.onload = () => {
        if (request.status === 200) {
            const data = JSON.parse(request.response);
            const chat = document.querySelector('#chat-msg-actv');

            for (let i = 0; i < data.length; i++) {
                const message = document.createElement('div');

                if (data[i]["username"] === storage.getItem("username")) {
                    message.className = "message-bubble sent";
                } else {
                    message.className = "message-bubble received";
                }

                message.innerHTML = `${data[i]["username"]}: ${data[i]["message"]}  <br> <span class="time">${data[i]["time"]}</span>`;
                chat.appendChild(message);
            }

            chat.scrollTop = chat.scrollHeight;
            messagesLoaded = true;
            localStorage.setItem(`messagesLoaded_${room}`, true);
        } else {
            console.error('Error al cargar mensajes:', request.status);
        }
    };

    request.send();
}


function send_message(msg, room, username, time) {
    console.log(msg);
    const chat = document.querySelector('#chat-msg-actv');

    const messageContainer = document.createElement('div');
    messageContainer.className = "message-bubble sent";
    messageContainer.innerHTML = `${username}: ${msg}  <br> <span class="time">${time}</span>`;

    chat.appendChild(messageContainer);
    chat.scrollTop = chat.scrollHeight;
}


function load_rooms() {
    const request = new XMLHttpRequest();
    request.open('GET', '/loadRooms');
    console.log("Holaaa");

    request.onload = () => {
        const data = Object.keys(JSON.parse(request.responseText));
        console.log(data);

        for (let i = 0; i < data.length; i++) {
            addRoom(data[i])
        }
    };
    request.send();
}

function join_room(room) {
    const chat = document.querySelector('#chat-msg-actv');

    chat.innerHTML = "";
    messagesLoaded = false;
    document.querySelectorAll('.hide-contt').forEach(function (elemento) {
        elemento.classList.remove('hide-contt');
    });
    document.querySelector('#chat-title').innerText = room;
    load_messages(room);
}

function addRoom(name) {
    const chatList = document.querySelector("#list-room");
    let roomItem = document.createElement('li');
    roomItem.className = 'p-3  knroom';
    roomItem.innerHTML = `
        <a href="#" class="roomnavbar text-decoration-none knroom" data-roomnav="${name}">
            <div class="d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center">
                    <img src="https://via.placeholder.com/40" alt="User" class="me-2">
                    <div class="text-black">
                        <h6 class="mb-1">${name}</h6>
                        <p class="small mb-0">Description</p>
                    </div>
                </div>
            </div>
        </a>
    `;
    chatList.appendChild(roomItem);

    // Agregar evento clic a cada elemento de la lista de salas
    roomItem.querySelector('.roomnavbar').addEventListener('click', function (event) {
        event.preventDefault();
        const roomName = this.getAttribute('data-roomnav');
        console.log(`Clic en la sala: ${roomName}`);

        if (roomName === storage.getItem("channel")) {
            alert("Ya estas en esta sala");
            return;
        }

        let res = window.confirm(`¿Quieres entrar a ${roomName}?`);

        if (res) {
            storage.setItem("channel", roomName);
            socket.emit('join_room', roomName);
        }


    });
}
socket.on('joinroom', (data) => {
    console.log(data);
    join_room(data["room"]);
});


function log_in() {
    document.querySelectorAll('.hide-contt').forEach(function (elemento) {
        elemento.classList.remove('hide-contt');
    });

    document.querySelector('#lr-content').classList.add('hide-log');
}


document.addEventListener('DOMContentLoaded', () => {
    let room;
    let title = "Login";
    document.title = title;
    history.pushState({ 'title': title }, title, title)

    load_rooms();

    if (storage.getItem("username")) {
        console.log(storage.getItem("username"));
        document.querySelector("#profile").innerText = storage.getItem("username");
        socket.emit('login', {"username":storage.getItem("username"), "password": storage.getItem("password")});
    }
    if (storage.getItem("channel")) {
        join_room(storage.getItem("channel"));
    }

    document.getElementById("login-to-register").addEventListener("click", toggleForm);

    window.onpopstate = e => {
        if (e.state !== null) {
            const data = e.state;
            document.title = data.title;
        }
    };

    document.querySelector("#login-form-btn").onclick = () => {
        const username = document.querySelector("#username").value;
        const password = document.querySelector("#password").value;

        if (username.length === 0) {
            alert("Please enter a username");
        } else {
            socket.emit('login', {"username": username, "password": password});
        }
    };
    socket.on('login', (data) => {
        storage.setItem("username", data["username"]);
        storage.setItem("password", data["password"]);
        console.log(storage.getItem("username"));
        addUserToUserList(data["username"]);
        document.querySelector("#profile").innerText = data["username"];
    });



    document.querySelector("#register-form-btn").onclick = () => {
        const username = document.querySelector("#username-r").value;
        const password = document.querySelector("#password-r").value;
        const confirm = document.querySelector("#confirm_password").value;

        if (username.length === 0 && password.length === 0) {
            alert("Please enter a username and password");
        }
        else if (username.length < 3) {

            alert("Username must be at least 3 characters long :c");
        }
        else if (password !== confirm) {
            alert("Passwords don't match");
        }
        else if (password.length < 4) {
            alert("Password must be at least 4 characters long :c");
        }
        else {
            socket.emit('register', {"username": username, "password":password});
            document.querySelector("#chat-form").style.display = "block";
        }

        socket.on('register', (data) => {
            if (data.success) {
                alert("Registration successful");
            }
            else {
                alert("Registration failed");
            }

        });

    };

    socket.on('status', (data) => {
        if (data["msg"] === "Login Successful") {
            document.querySelector("#lr-content").style.display = "none";
            document.querySelector("#lr-content").style.visibility = "hidden";

            let elementos = document.getElementsByClassName("tagvisibility");

            for (let i = 0; i < elementos.length; i++) {
                elementos[i].style.visibility = "visible"
            }
            document.title = "Flack";
            history.pushState({ 'title': 'Flack' }, 'Flack', 'Flack')
        }
        else if (data["msg"] === "Register Successful") {
            toggleForm();
        }
        else if (data["msg"] === "Login Failed") {
            let res = window.confirm("Login Failed");
            if (res) {
                toggleForm();
            }
        }
        else if (data["msg"] === "Register Failed") {
            alert("Registration Failed");
        }
        else if (data["msg"] === "Username already exists") {
            alert("Username already exists");

        }
    });

    document.querySelector("#chat-form").addEventListener('submit', (event) => {
        event.preventDefault();
        const message = document.querySelector("#chat-input").value;
        if (message === "") {
            return;
        }
        const time = new Date().toLocaleTimeString();
        const username = storage.getItem("username");
        const room = storage.getItem("channel");
        socket.emit('message', {"message": message, "room":room, "username":username, "time":time});
        document.querySelector("#chat-input").value = "";
    });


    socket.on('message', (data) => {
        console.log(data);
        send_message(data.msg, storage.getItem("channel"), data.username, data.time);
        const message = document.querySelector("#chat-msg-actv");
        message.scrollTop = message.scrollHeight;
    });

    document.querySelector("#logout").addEventListener("click", logout);

});
