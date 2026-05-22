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

function logEvent(label, data) {
  const log = document.getElementById("eventLog");
  const li = document.createElement("li");
  const time = new Date().toLocaleTimeString();
  li.innerHTML = `<span class="log-time">${time}</span> <span class="log-label">${label}</span> <span class="log-data">${JSON.stringify(data)}</span>`;
  log.prepend(li);
}

function setupSignalRHandlers() {
  connection.on("ReceiveRoomMessage", (data) => {
    const messagesArray = Array.isArray(data) ? data : [data];
    messagesArray.forEach((msg) => {
      const { content, id, roomId, senderId, reactions } = msg;
      const emojis = reactions ? reactions.map((r) => r.emoji).join(" ") : "";
      logEvent("ReceiveRoomMessage", { senderId, id, content, emojis });
    });
  });

  connection.on("JoinRoomMessage", (data) => logEvent("JoinRoomMessage", data));
  connection.on("LeaveRoomMessage", (data) => logEvent("LeaveRoomMessage", data));
  connection.on("RemovedFromRoom", (data) => logEvent("RemovedFromRoom", data));
  connection.on("MemberRoleChanged", (data) => logEvent("MemberRoleChanged", data));
  connection.on("RoomRenamed", (data) => logEvent("RoomRenamed", data));
  connection.on("RoomDeleted", (data) => logEvent("RoomDeleted", data));
  connection.on("ReactionAdded", (data) => logEvent("ReactionAdded", data));
  connection.on("ReactionRemoved", (data) => logEvent("ReactionRemoved", data));
  connection.on("MessageEdited", (data) => logEvent("MessageEdited", data));
  connection.on("MessageDeleted", (data) => logEvent("MessageDeleted", data));
  connection.on("UserStartedTyping", (data) => logEvent("UserStartedTyping", data));
  connection.on("UserStoppedTyping", (data) => logEvent("UserStoppedTyping", data));
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

function setupTypingIndicator() {
  const contentInput = document.getElementById("sendMsgContentInput");
  const typingStatus = document.getElementById("typingStatus");
  let isTyping = false;
  let typingTimeout = null;

  async function sendTypingStarted() {
    const roomId = document.getElementById("sendRoomIdInput").value;
    if (!roomId || !isConnected) return;
    try {
      await connection.invoke("TypingStarted", roomId);
      typingStatus.textContent = "Typing...";
      typingStatus.classList.remove("hidden");
    } catch (err) {
      console.error("TypingStarted error:", err);
    }
  }

  async function sendTypingStopped() {
    const roomId = document.getElementById("sendRoomIdInput").value;
    if (!roomId || !isConnected) return;
    try {
      await connection.invoke("TypingStopped", roomId);
      typingStatus.textContent = "";
      typingStatus.classList.add("hidden");
    } catch (err) {
      console.error("TypingStopped error:", err);
    }
  }

  contentInput.addEventListener("input", () => {
    if (!isTyping) {
      isTyping = true;
      sendTypingStarted();
    }

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(async () => {
      isTyping = false;
      await sendTypingStopped();
    }, 1500);
  });

  contentInput.addEventListener("blur", () => {
    if (isTyping) {
      clearTimeout(typingTimeout);
      isTyping = false;
      sendTypingStopped();
    }
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
    .getElementById("createRoomButton")
    .addEventListener("click", async () => {
      if (!isConnected) {
        alert("Please connect to the hub first!");
        return;
      }

      const roomName = document.getElementById("newRoomNameInput").value || null;
      const roomType = document.getElementById("roomTypeInput").value;

      if (!roomType) {
        alert("Please enter a Room Type!");
        return;
      }

      try {
        await connection.invoke("CreateRoom", roomName, roomType);
        console.log("Room created:", roomName, roomType);
      } catch (error) {
        console.error("Error creating room:", error);
        alert("Failed to create room: " + error.message);
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
    .getElementById("deleteRoomButton")
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
        await connection.invoke("DeleteRoom", roomId);
        console.log("Room deleted:", roomId);
      } catch (error) {
        console.error("Error deleting room:", error);
        alert("Failed to delete room: " + error.message);
      }
    });

  document
    .getElementById("sendMessageButton")
    .addEventListener("click", async () => {
      if (!isConnected) { alert("Please connect to the hub first!"); return; }
      const roomId = document.getElementById("sendRoomIdInput").value;
      const messageContent = document.getElementById("sendMsgContentInput").value;
      if (!roomId || !messageContent) { alert("Please enter Room ID and Content!"); return; }
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
    if (!isConnected) { alert("Please connect to the hub first!"); return; }
    const messageId = document.getElementById("reactionMsgIdInput").value;
    const emoji = document.getElementById("reactionEmojiInput").value;
    if (!messageId || !emoji) { alert("Please enter Message ID and Emoji!"); return; }
    try {
      await connection.invoke("AddReaction", messageId, emoji);
      console.log("Reaction added");
    } catch (error) {
      console.error("Error adding reaction:", error);
    }
  });

  document.getElementById("removeReaction").addEventListener("click", async () => {
    if (!isConnected) { alert("Please connect to the hub first!"); return; }
    const messageId = document.getElementById("reactionMsgIdInput").value;
    const emoji = document.getElementById("reactionEmojiInput").value;
    if (!messageId || !emoji) { alert("Please enter Message ID and Emoji!"); return; }
    try {
      await connection.invoke("RemoveReaction", messageId, emoji);
      console.log("Reaction removed");
    } catch (error) {
      console.error("Error removing reaction:", error);
    }
  });

  document.getElementById("editMessageButton").addEventListener("click", async () => {
    if (!isConnected) { alert("Please connect to the hub first!"); return; }
    const messageId = document.getElementById("editMsgIdInput").value;
    const newContent = document.getElementById("editMsgContentInput").value;
    if (!messageId || !newContent) { alert("Please enter Message ID and New Content!"); return; }
    try {
      await connection.invoke("EditMessage", messageId, newContent);
      console.log("Message edited");
    } catch (error) {
      console.error("Error editing message:", error);
    }
  });

  document.getElementById("deleteMessageButton").addEventListener("click", async () => {
    if (!isConnected) { alert("Please connect to the hub first!"); return; }
    const messageId = document.getElementById("deleteMsgIdInput").value;
    if (!messageId) { alert("Please enter a Message ID!"); return; }
    try {
      await connection.invoke("DeleteMessage", messageId);
      console.log("Message deleted");
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  });

  setupTypingIndicator();

  document.getElementById("clearLogButton").addEventListener("click", () => {
    document.getElementById("eventLog").innerHTML = "";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupConnectionButtons();
  setupChatButtons();
  updateConnectionStatus("disconnected");
});
