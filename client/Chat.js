import { io } from 'https://cdn.socket.io/4.3.2/socket.io.esm.min.js'

const getUsername = async () => {
  const username = localStorage.getItem('username')
  if (username) {
    console.log(`User existed ${username}`)
    return username
  }

  const res = await fetch('https://random-data-api.com/api/users/random_user')
  const { username: randomUsername } = await res.json()

  localStorage.setItem('username', randomUsername)
  return randomUsername
}

const socket = io({
  auth: {
    username: await getUsername(),
    serverOffset: 0
  }
})

const form = document.getElementById('form')
const input = document.getElementById('input')
const messages = document.getElementById('messages')

socket.on('chat message', (msg, serverOffset, username) => {
  const item = `<li>
    <p>${msg}</p>
    <small>${username}</small>
  </li>`
  messages.insertAdjacentHTML('beforeend', item)
  socket.auth.serverOffset = serverOffset
  messages.scrollTop = messages.scrollHeight
})

form.addEventListener('submit', (e) => {
  e.preventDefault()

  if (input.value) {
    socket.emit('chat message', input.value)
    input.value = ''
  }
})


  


// MANEJO DE ABRIR CHAT
const chatBubble = document.getElementById('chat-bubble');
const chat = document.getElementById('chat');

// Agregar el evento de clic a la burbuja
chatBubble.addEventListener('click', () => {
  // Cambiar la clase active para mostrar u ocultar el chat
  chat.classList.toggle('active');
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (input.value.trim() !== "") {
    const newMessage = document.createElement('li');
    newMessage.textContent = input.value;
    messages.appendChild(newMessage);
    input.value = ''; // Limpiar el campo de entrada
    messages.scrollTop = messages.scrollHeight; // Desplazar al último mensaje
  }
});
