const socket = io('http://localhost:80')
const messagesContainer = document.getElementById('messagesContainer')
const messageForm = document.getElementById('messagesContainer')
const messageInput = document.getElementById('chatForm')

socket.on('chat-message', data =>{
  appendMessage(data)
})

messageForm.addEventListener('submit', e=>{
  e.preventDefault()
  const message = messageInput.value;
  socket.emit('send-chat-message', message)
  messageInput.value = ''
})

function appendMessage(message){
  const messageElement = document.createElement('div')
  messageElement.innerText = message
  messagesContainer.append(messageElement)
}