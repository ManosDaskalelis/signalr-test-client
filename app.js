// const connection = new signalR.HubConnectionBuilder()
//   .withUrl(prompt("Enter the url"))
//   // .withUrl("https://localhost:7274/hubs/chat")
//   .configureLogging(signalR.LogLevel.Information)
//   .build();

// async function start() {
//   try {
//     await connection.start();
//     console.log("SignalR Connected.");
//   } catch (err) {
//     console.log(err);
//     setTimeout(start, 5000);
//   }
// }

// connection.on("ReceiveRoomMessage", (data) => {
//   const list = document.getElementById("messageResponses");

//   const messagesArray = Array.isArray(data) ? data : [data];

//   messagesArray.forEach((msg) => {
//     const { content, id, roomId, senderId, type, createdAtUtc } = msg;
//     const { reactions } = msg;
//     const emojis = reactions.map((emReact) => emReact.emoji).join(" ");

//     const li = document.createElement("li");

//     li.textContent = `User: ${senderId} said => ${id} ${content}-${emojis}`;
//     list.appendChild(li);
//   });
// });

// connection.onclose(async () => {
//   await start();
// });

// start();
// function buttonClicked() {
//   let joinbutton = document.getElementById("joinRoomButton");

//   joinbutton.addEventListener("click", async () => {
//     const roomId = document.getElementById("roomIdInput").value;
//     try {
//       await connection.invoke("SubscribeToRoom", roomId);
//       console.log("connected to room");
//     } catch (error) {
//       console.error(`Error ====> ${error}`);
//     }
//   });

//   let leavebutton = document.getElementById("leaveRoomButton");
//   leavebutton.addEventListener("click", async () => {
//     const roomId = document.getElementById("roomIdInput").value;
//     try {
//       await connection.invoke("UnsubscribeFromRoom", roomId);
//       console.log("left the room");
//     } catch (error) {
//       console.error(`Error ====> ${error}`);
//     }
//   });

//   let sendMessageButton = document.getElementById("sendMessageButton");
//   sendMessageButton.addEventListener("click", async () => {
//     const roomId = document.getElementById("roomIdInput").value;
//     const messageContent = document.getElementById("messageInput").value;
//     try {
//       await connection.invoke("SendRoomMessage", roomId, messageContent);
//       console.log("message send successfully");
//     } catch (error) {
//       console.error(`Error ====> ${error}`);
//     }
//   });

//   let getMessagesButton = document.getElementById("getMessagesButton");
//   getMessagesButton.addEventListener("click", async () => {
//     const roomId = document.getElementById("roomIdInput").value;
//     try {
//       await connection.invoke("GetRoomMessages", roomId);
//       console.log("message received successfully");
//     } catch (error) {
//       console.error(`Error ====> ${error}`);
//     }
//   });

//   let addReactionButton = document.getElementById("addReaction");
//   addReactionButton.addEventListener("click", async () => {
//     const messageContent = document.getElementById("messageInput").value;
//     const emojiContent = document.getElementById("emojiInput").value;

//     try {
//       await connection.invoke("AddReaction", messageContent, emojiContent);
//       console.log("reaction added");
//     } catch (error) {
//       console.error(`Error ====> ${error}`);
//     }
//   });

//   let removeReactionButton = document.getElementById("removeReaction");
//   removeReactionButton.addEventListener("click", async () => {
//     const messageContent = document.getElementById("messageInput").value;
//     const emojiContent = document.getElementById("emojiInput").value;

//     try {
//       await connection.invoke("RemoveReaction", messageContent, emojiContent);
//       console.log("reaction removed");
//     } catch (error) {
//       console.error(`Error ====> ${error}`);
//     }
//   });

//   let editMessageButton = document.getElementById("editMessageButton");
//   editMessageButton.addEventListener("click", async () => {
//     const messageContent = document.getElementById("messageInput").value;
//     const emojiContent = document.getElementById("emojiInput").value;

//     try {
//       await connection.invoke("EditMessage", messageContent, emojiContent);
//       console.log("message edited");
//     } catch (error) {
//       console.error(`Error ====> ${error}`);
//     }
//   });

//   let deleteMessageButton = document.getElementById("deleteMessageButton");
//   deleteMessageButton.addEventListener("click", async () => {
//     const messageContent = document.getElementById("messageInput").value;

//     try {
//       await connection.invoke("DeleteMessage", messageContent);
//       console.log("message deleted");
//     } catch (error) {
//       console.error(`Error ====> ${error}`);
//     }
//   });
// }

// buttonClicked();

let connection = null;
let isConnected = false;

const urlInput = document.getElementById("urlInput");
const connectButton = document.getElementById("connectButton");
const disconnectButton = document.getElementById("disconnectButton");
const chatInterface = document.getElementById("chatInterface");
const statusDot = document.querySelector(".status-dot");
const statusText = document.querySelector(".status-text");

function initializeConnection(url) {
  connection = new signalR.HubConnectionBuilder()
    .withUrl(url)
    .configureLogging(signalR.LogLevel.Information)
    .build();

  setupSignalRHandlers();

  connection.onclose(async () => {
    console.log("Connection closed. Attempting to reconnect...");
    updateConnectionStatus("disconnected");
    isConnected = false;
    setTimeout(() => start(url), 5000);
  });
}

async function start(url) {
  if (!connection) {
    initializeConnection(url);
  }

  updateConnectionStatus("connecting");
  connectButton.disabled = true;
  connectButton.textContent = "Connecting...";

  try {
    await connection.start();
    console.log("SignalR Connected.");

    isConnected = true;
    updateConnectionStatus("connected");

    chatInterface.classList.add("enabled");

    connectButton.disabled = true;
    connectButton.textContent = "Connected";
    disconnectButton.disabled = false;
  } catch (err) {
    console.error("Connection failed:", err);
    alert("Connection failed: " + err.message);

    isConnected = false;
    updateConnectionStatus("disconnected");

    connectButton.disabled = false;
    connectButton.textContent = "Connect";
    disconnectButton.disabled = true;
  }
}

async function disconnect() {
  if (connection) {
    try {
      await connection.stop();
      console.log("Disconnected");

      isConnected = false;
      updateConnectionStatus("disconnected");

      chatInterface.classList.remove("enabled");

      connectButton.disabled = false;
      connectButton.textContent = "Connect";
      disconnectButton.disabled = true;
    } catch (err) {
      console.error("Disconnect failed:", err);
    }
  }
}

function updateConnectionStatus(status) {
  statusDot.className = `status-dot ${status}`;

  switch (status) {
    case "connected":
      statusText.textContent = "Connected";
      statusText.style.color = "#4caf50";
      break;
    case "connecting":
      statusText.textContent = "Connecting...";
      statusText.style.color = "#ff9800";
      break;
    case "disconnected":
      statusText.textContent = "Disconnected";
      statusText.style.color = "#f44336";
      break;
  }
}

function setupSignalRHandlers() {
  connection.on("ReceiveRoomMessage", (data) => {
    const list = document.getElementById("messageResponses");

    const messagesArray = Array.isArray(data) ? data : [data];

    messagesArray.forEach((msg) => {
      const { content, id, roomId, senderId, type, createdAtUtc, reactions } =
        msg;
      const emojis = reactions
        ? reactions.map((emReact) => emReact.emoji).join(" ")
        : "";

      const li = document.createElement("li");
      li.textContent = `User: ${senderId} said => ${id} ${content} ${emojis}`;
      list.appendChild(li);
    });
  });
}

function setupConnectionButtons() {
  connectButton.addEventListener("click", async () => {
    const url = urlInput.value.trim();

    if (!url) {
      alert("Please enter a valid SignalR Hub URL!");
      return;
    }

    await start(url);
  });

  disconnectButton.addEventListener("click", async () => {
    await disconnect();
  });
}

function setupChatButtons() {
  document
    .getElementById("joinHubButton")
    .addEventListener("click", async () => {
      if (!isConnected) {
        alert("Please connect to the hub first!");
        return;
      }

      const roomId = document.getElementById("roomIdInput").value;
      if (!roomId) {
        alert("Please enter a Room ID!");
        return;
      }

      try {
        await connection.invoke("SubscribeToRoom", roomId);
        console.log("Connected to room:", roomId);
      } catch (error) {
        console.error("Error joining room:", error);
        alert("Failed to join room: " + error.message);
      }
    });

  document
    .getElementById("leaveHubButton")
    .addEventListener("click", async () => {
      if (!isConnected) {
        alert("Please connect to the hub first!");
        return;
      }

      const roomId = document.getElementById("roomIdInput").value;
      if (!roomId) {
        alert("Please enter a Room ID!");
        return;
      }

      try {
        await connection.invoke("UnsubscribeFromRoom", roomId);
        console.log("Left the room:", roomId);
      } catch (error) {
        console.error("Error leaving room:", error);
      }
    });

  document
    .getElementById("joinRoomButton")
    .addEventListener("click", async () => {
      const roomId = document.getElementById("roomIdInput").value;
      try {
        await connection.invoke("JoinRoom", roomId);
      } catch (error) {
        console.error("Error joining room:", error);
      }
    });

  document
    .getElementById("leaveRoomButton")
    .addEventListener("click", async () => {
      const roomId = document.getElementById("roomIdInput").value;
      try {
        await connection.invoke("LeaveRoom", roomId);
      } catch (error) {
        console.error("Error leaving room:", error);
      }
    });

  document
    .getElementById("removeMemberButton")
    .addEventListener("click", async () => {
      if (!isConnected) {
        alert("Please connect to the hub first!");
        return;
      }

      const roomId = document.getElementById("roomIdInput").value;
      const userId = document.getElementById("memberUserIdInput").value;

      if (!roomId || !userId) {
        alert("Please enter both Room ID and User ID!");
        return;
      }

      try {
        await connection.invoke("RemoveFromRoom", roomId, userId);
        console.log("Member removed:", userId);
      } catch (error) {
        console.error("Error removing member:", error);
        alert("Failed to remove member: " + error.message);
      }
    });

  document
    .getElementById("changeMemberRoleButton")
    .addEventListener("click", async () => {
      if (!isConnected) {
        alert("Please connect to the hub first!");
        return;
      }

      const roomId = document.getElementById("roomIdInput").value;
      const userId = document.getElementById("memberUserIdInput").value;
      const role = document.getElementById("memberRoleInput").value;

      if (!roomId || !userId || !role) {
        alert("Please enter Room ID, User ID, and Role!");
        return;
      }

      try {
        await connection.invoke("ChangeMemberRole", roomId, userId, role);
        console.log("Member role changed:", userId, role);
      } catch (error) {
        console.error("Error changing member role:", error);
        alert("Failed to change member role: " + error.message);
      }
    });

  document
    .getElementById("renameRoomButton")
    .addEventListener("click", async () => {
      if (!isConnected) {
        alert("Please connect to the hub first!");
        return;
      }

      const roomId = document.getElementById("roomIdInput").value;
      const roomName = document.getElementById("roomNameInput").value;

      if (!roomId || !roomName) {
        alert("Please enter both Room ID and Room Name!");
        return;
      }

      try {
        await connection.invoke("RenameRoom", roomId, roomName);
        console.log("Room renamed:", roomName);
      } catch (error) {
        console.error("Error renaming room:", error);
        alert("Failed to rename room: " + error.message);
      }
    });

  document
    .getElementById("sendMessageButton")
    .addEventListener("click", async () => {
      if (!isConnected) {
        alert("Please connect to the hub first!");
        return;
      }

      const roomId = document.getElementById("roomIdInput").value;
      const messageContent = document.getElementById("messageInput").value;

      if (!roomId || !messageContent) {
        alert("Please enter both Room ID and Message!");
        return;
      }

      try {
        await connection.invoke("SendRoomMessage", roomId, messageContent);
        console.log("Message sent successfully");
      } catch (error) {
        console.error("Error sending message:", error);
        alert("Failed to send message: " + error.message);
      }
    });

  document
    .getElementById("getMessagesButton")
    .addEventListener("click", async () => {
      if (!isConnected) {
        alert("Please connect to the hub first!");
        return;
      }

      const roomId = document.getElementById("roomIdInput").value;
      if (!roomId) {
        alert("Please enter a Room ID!");
        return;
      }

      try {
        await connection.invoke("GetRoomMessages", roomId);
        console.log("Messages received successfully");
      } catch (error) {
        console.error("Error getting messages:", error);
      }
    });

  document.getElementById("addReaction").addEventListener("click", async () => {
    if (!isConnected) {
      alert("Please connect to the hub first!");
      return;
    }

    const messageId = document.getElementById("messageIdInput").value;
    const emoji = document.getElementById("emojiInput").value;

    if (!messageId || !emoji) {
      alert("Please enter both Message ID and Emoji!");
      return;
    }

    try {
      await connection.invoke("AddReaction", messageId, emoji);
      console.log("Reaction added");
    } catch (error) {
      console.error("Error adding reaction:", error);
    }
  });

  document
    .getElementById("removeReaction")
    .addEventListener("click", async () => {
      if (!isConnected) {
        alert("Please connect to the hub first!");
        return;
      }

      const messageId = document.getElementById("messageIdInput").value;
      const emoji = document.getElementById("emojiInput").value;

      if (!messageId || !emoji) {
        alert("Please enter both Message ID and Emoji!");
        return;
      }

      try {
        await connection.invoke("RemoveReaction", messageId, emoji);
        console.log("Reaction removed");
      } catch (error) {
        console.error("Error removing reaction:", error);
      }
    });

  document
    .getElementById("editMessageButton")
    .addEventListener("click", async () => {
      if (!isConnected) {
        alert("Please connect to the hub first!");
        return;
      }

      const messageId = document.getElementById("messageIdInput").value;
      const newContent = document.getElementById("messageInput").value;

      if (!messageId || !newContent) {
        alert("Please enter both Message ID and New Content!");
        return;
      }

      try {
        await connection.invoke("EditMessage", messageId, newContent);
        console.log("Message edited");
      } catch (error) {
        console.error("Error editing message:", error);
      }
    });

  document
    .getElementById("deleteMessageButton")
    .addEventListener("click", async () => {
      if (!isConnected) {
        alert("Please connect to the hub first!");
        return;
      }

      const messageId = document.getElementById("messageIdInput").value;

      if (!messageId) {
        alert("Please enter a Message ID!");
        return;
      }

      try {
        await connection.invoke("DeleteMessage", messageId);
        console.log("Message deleted");
      } catch (error) {
        console.error("Error deleting message:", error);
      }
    });
}

document.addEventListener("DOMContentLoaded", () => {
  setupConnectionButtons();
  setupChatButtons();
  updateConnectionStatus("disconnected");
});
