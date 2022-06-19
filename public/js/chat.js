const socket = io();

//Elements
const $messageForm = document.getElementById("message-form");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $sendLocationButton = document.getElementById("send-location");
const $messageBox = document.getElementById("messages");

//Templates
const messageTemplate = document.getElementById("message-template").innerHTML;
const locationTemplate = document.getElementById("location-template").innerHTML;
const sidebarTemplate = document.getElementById('sidebar-template').innerHTML;

//Options
const {username, room} = Qs.parse(location.search, { ignoreQueryPrefix : true});

const autoScroll = () =>{
  const $newMessage = $messageBox.lastElementChild;

  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  //visible height
  const visibleHeight = $messageBox.offsetHeight;

  //Height of messages container
  const containerHeight = $messageBox.scrollHeight;

  //how far have i scrolled?
  const scrollOffset = $messageBox.scrollTop + visibleHeight;

  if(containerHeight - newMessageHeight <= scrollOffset){
    $messageBox.scrollTop = $messageBox.scrollHeight;
  }
}

socket.on("messageForAll", (message) => {
  console.log(message);
  const html = Mustache.render(messageTemplate, {
    ...message,
    createdAt: moment(message.createdAt).format("h:mm a"),
  });
  $messageBox.insertAdjacentHTML("beforeend", html);
  autoScroll();
});

socket.on("locationMessage", (url) => {
  console.log(url);
  const html = Mustache.render(locationTemplate, {
    ...url,
    createdAt: moment(url.createdAt).format("h:mm a"),
  });
  $messageBox.insertAdjacentHTML("beforeend", html);
  autoScroll();
});


socket.on('roomData', ({room, users}) => {
  // console.log(room);
  // console.log(users);
  const html = Mustache.render(sidebarTemplate, {room, users});
  document.getElementById('sidebar').innerHTML = html;
});

$messageForm.addEventListener("submit", (event) => {
  event.preventDefault();
  //disable
  $messageFormInput.setAttribute("disabled", "disabled");
  const messageText = event.target.elements["message-text"].value;
  socket.emit("message", messageText, (message) => {
    console.log(message);
    //enable
    $messageFormInput.removeAttribute("disabled");
    $messageFormInput.value = "";
    $messageFormInput.focus();
  });
});

$sendLocationButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("Geolocation is not supported by your browser!");
  }
  $sendLocationButton.setAttribute("disabled", "disabled");
  navigator.geolocation.getCurrentPosition((position) => {
    const { latitude: lat, longitude: long } = position.coords;
    socket.emit("location", { lat, long }, (message) => {
      $sendLocationButton.removeAttribute("disabled");
      console.log(message);
    });
  });
});

socket.emit('join', {username, room}, (error) => {
  if(error){
    alert(error);
    location.href = '/';
  }
});