const connection = new signalR.HubConnectionBuilder()
  .withUrl("")
  .configureLogging(signalR.LogLevel.Information)
  .build();

async function start() {
  try {
    await connection.start();
    console.log("SignalR Connected.");
  } catch (err) {
    console.log(err);
    setTimeout(start, 5000);
  }
}


connection.on("ReceiveRoomMessage", (data) => {
    const list = document.getElementById("messageResponses");
    
    const messagesArray = Array.isArray(data) ? data : [data];

    messagesArray.forEach(msg => {
        const li = document.createElement("li");
        li.textContent = msg;
        list.appendChild(li);
    }); 
});

connection.onclose(async () => {
  await start();
});

start();
function buttonClicked() {
  let joinbutton = document.getElementById("joinRoomButton");

  joinbutton.addEventListener("click", async () => {
    const roomId = document.getElementById("roomIdInput").value;
    try {
      await connection.invoke("JoinRoom", roomId);
      console.log("connected to room");
    } catch (error) {
      console.error(`Error ====> ${error}`);
    }
  });

  let leavebutton = document.getElementById("leaveRoomButton");
  leavebutton.addEventListener("click", async () => {
    const roomId = document.getElementById("roomIdInput").value;
    try {
      await connection.invoke("LeaveRoom", roomId);
      console.log("left the room");
    } catch (error) {
      console.error(`Error ====> ${error}`);
    }
  });

  let sendMessageButton = document.getElementById("sendMessageButton");
  sendMessageButton.addEventListener("click", async () => {
    const roomId = document.getElementById("roomIdInput").value;
    const messageContent = document.getElementById("messageInput").value;
    try {
      await connection.invoke("SendRoomMessage", roomId, messageContent);
      console.log("message send successfully");
    } catch (error) {
      console.error(`Error ====> ${error}`);
    }
  });

  let getMessagesButton = document.getElementById("getMessagesButton");
  getMessagesButton.addEventListener("click", async () => {
    const roomId = document.getElementById("roomIdInput").value;
    try {
      await connection.invoke("GetRoomMessages", roomId);
      console.log("message received successfully");
    } catch (error) {
      console.error(`Error ====> ${error}`);
    }
  });
}

buttonClicked();
