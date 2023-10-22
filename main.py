import os
from flask import Flask, render_template, redirect, request
from flask_socketio import SocketIO, emit, join_room, leave_room
from dotenv import load_dotenv
from colorama import Fore, Style
from termcolor import colored

load_dotenv()
user = {}
sala = {}
active_Users = [];

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

@app.route("/Login")
@app.route("/Register")
@app.route("/dashboard")
@app.route("/Flack")
@app.route("/")
def index():
    return render_template("chat.html")

@socketio.on("login")
def login(data):
    username = data["username"]
    password = data["password"]
    if username in user and user[username] == password:
        emit("status", {"msg": "Login Successful"})
        emit("login", {"username": username, "password": password}, broadcast=True)
    else:
        emit("status", {"msg": "Login Failed"})
        
@socketio.on("register")
def register(data):
    username = data["username"]
    password = data["password"]
    if username in user:
        emit("status", {"msg": "Username already exists"})
    else:
        user[username] = password
        emit("status", {"msg": "Register Successful"})


@socketio.on("logout")
def logout():
    return redirect("/")

@socketio.on("message")
def message(data):
    message_text = data["message"]
    room = data["room"]
    username = data["username"]
    time = data["time"]
    if room not in sala:
        sala[room] = []
    sala[room].append({"message": message_text, "username": username, "time": time})
    if len(sala[room]) > 120:
        sala[room] = sala[room][-120:]
    emit("message", {"msg": message_text, "username": username, "time": time}, broadcast=True,include_self=True ,room=room)

    
@app.route("/loadMessages/<string:room>")
def loadMessages(room):
    if len(sala[room]) > 120:
        return sala[room][-120:]
    else:
        return sala[room]

@socketio.on("create")
def create(room):
    if room in sala:
        emit("status", {"msg": "Room already exists"})
        return redirect("/")
    sala[room] = []
    emit("status", {"msg": "Created room" + room , "room": room})
    return room

@app.route("/loadRooms")
def loadRooms():
    print(sala)
    return sala

@socketio.on("join_room")
def joinRoom(room):
    join_room(room)
    emit("joinroom", {"msg": "Joined room " + room, "room": room}, room=room)
    return room

@socketio.on("user-active")
def user__ac(username):
    active_Users.add(username)
    emit("user-active", {"msg": "User " + username + " is active", "users": list(active_Users)}, broadcast=True)
 

@socketio.on("connect", namespace="/chat")
def connect():
    emit("status", {"msg": "Connected"})


if __name__ == "__main__":
    socketio.run(app, debug=True)
