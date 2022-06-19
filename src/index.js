const http = require("http");
const express = require("express");
const path = require("path");
const socketio = require("socket.io");
const {
  generateMessage,
  generateLocationMessage,
} = require("../src/utils/messages");
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const publicPath = path.join(__dirname, "../public");

app.use(express.static(publicPath));

io.on("connection", (socket) => {
  console.log("new websocket connection");

  socket.on("join", ({ username, room }, cb) => {
    const { error, user } = addUser({ id: socket.id, username, room });
    if (error) {
      return cb(error);
    }
    socket.join(user.room);

    socket.emit("messageForAll", generateMessage("Admin", "Welcome!"));
    socket.broadcast
      .to(user.room)
      .emit(
        "messageForAll",
        generateMessage("Admin", `${user.username} just joined!`)
      );
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });
    cb();
  });

  socket.on("message", (message, cb) => {
    const user = getUser(socket.id);
    if (!user) {
      return cb("user does not exits");
    }
    io.to(user.room).emit(
      "messageForAll",
      generateMessage(user.username, message)
    );
    cb("Message Delivered!");
  });
  socket.on("location", (location, cb) => {
    const user = getUser(socket.id);
    if (!user) {
      return cb("user does not exits");
    }
    io.to(user.room).emit(
      "locationMessage",
      generateLocationMessage(
        user.username,
        `https://google.com/maps?q=${location.lat},${location.long}`
      )
    );
    cb("Location shared!");
  });
  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user[0].room).emit(
        "messageForAll",
        generateMessage("Admin", `${user[0].username} left!`)
      );
      io.to(user[0].room).emit("roomData", {
        room: user[0].room,
        users: getUsersInRoom(user[0].room),
      });
    }
  });
});

server.listen(3000, () => {
  console.log("The server is running on 3000");
});
