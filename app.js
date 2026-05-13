const connection = new signalR.HubConnectionBuilder()
  .withUrl("https://localhost:7274/hubs/chat")
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

  messagesArray.forEach((msg) => {
    const { content, id, roomId, senderId, type, createdAtUtc } = msg;
    const { reactions } = msg;
    const emojis = reactions.map((emReact) => emReact.emoji).join(" ");

    const li = document.createElement("li");

    li.textContent = `${content} ${emojis}`;
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
      await connection.invoke("SubscribeToRoom", roomId);
      console.log("connected to room");
    } catch (error) {
      console.error(`Error ====> ${error}`);
    }
  });

  let leavebutton = document.getElementById("leaveRoomButton");
  leavebutton.addEventListener("click", async () => {
    const roomId = document.getElementById("roomIdInput").value;
    try {
      await connection.invoke("UnsubscribeFromRoom", roomId);
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

  let addReactionButton = document.getElementById("addReaction");
  addReactionButton.addEventListener("click", async () => {
    const messageContent = document.getElementById("messageInput").value;
    const emojiContent = document.getElementById("emojiInput").value;

    try {
      await connection.invoke("AddReaction", messageContent, emojiContent);
      console.log("reaction added");
    } catch (error) {
      console.error(`Error ====> ${error}`);
    }
  });

  let removeReactionButton = document.getElementById("removeReaction");
  removeReactionButton.addEventListener("click", async () => {
    const messageContent = document.getElementById("messageInput").value;
    const emojiContent = document.getElementById("emojiInput").value;

    try {
      await connection.invoke("RemoveReaction", messageContent, emojiContent);
      console.log("reaction removed");
    } catch (error) {
      console.error(`Error ====> ${error}`);
    }
  });

  let editMessageButton = document.getElementById("editMessageButton");
  editMessageButton.addEventListener("click", async () => {
    const messageContent = document.getElementById("messageInput").value;
    const emojiContent = document.getElementById("emojiInput").value;

    try {
      await connection.invoke("EditMessage", messageContent, emojiContent);
      console.log("message edited");
    } catch (error) {
      console.error(`Error ====> ${error}`);
    }
  });

  let deleteMessageButton = document.getElementById("deleteMessageButton");
  deleteMessageButton.addEventListener("click", async () => {
    const messageContent = document.getElementById("messageInput").value;

    try {
      await connection.invoke("DeleteMessage", messageContent);
      console.log("message deleted");
    } catch (error) {
      console.error(`Error ====> ${error}`);
    }
  });
}

buttonClicked();
