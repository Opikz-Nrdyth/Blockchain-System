// p2p-server.js
const WebSocket = require("ws");
const { Blockchain } = require("./blockchain");

class P2PServer {
  constructor(blockchain) {
    this.blockchain = blockchain;
    this.sockets = [];
    this.port = null;
    this.nodeList = new Set();
  }

  listen(port) {
    this.port = port;
    const server = new WebSocket.Server({ port: port });
    server.on("connection", (socket) => {
      this.connectSocket(socket);
    });
    console.log(`P2P server listening on port ${port}`);
  }

  connectSocket(socket) {
    this.sockets.push(socket);
    console.log("Socket connected");

    this.shareNodeList(socket);

    // Event handlers
    this.messageHandler(socket);
    this.errorHandler(socket);

    // Send current blockchain to new node
    this.sendChain(socket);
  }

  connectToPeers(newPeers) {
    newPeers.forEach((peer) => {
      try {
        const socket = new WebSocket(peer);
        socket.on("open", () => {
          this.connectSocket(socket);
        });
        socket.on("error", (err) => {
          console.log(`Gagal connect ke ${peer} - port belum aktif`);
        });
      } catch (e) {
        console.log("Skip connection:", e.message);
      }
    });
  }

  messageHandler(socket) {
    socket.on("message", (message) => {
      const data = JSON.parse(message);

      switch (data.type) {
        case "chain":
          if (this.blockchain.forceSync(data.chain)) {
            console.log("Chain synced!");
          }
          break;
        case "transaction":
          this.blockchain.addTransaction(data.transaction);
          break;
        case "clear-transactions":
          this.blockchain.clearPendingTransactions();
          break;
        case "nodelist":
          this.handleNodeList(data.nodes);
          break;
      }
    });
  }

  errorHandler(socket) {
    socket.on("error", (err) => {
      console.log("Socket error:", err.message);
    });
  }

  shareNodeList(socket) {
    const nodes = Array.from(this.nodeList);
    socket.send(
      JSON.stringify({
        type: "nodelist",
        nodes: nodes,
      })
    );
  }

  handleNodeList(receivedNodes) {
    receivedNodes.forEach((node) => {
      if (!this.nodeList.has(node)) {
        this.nodeList.add(node);
        // Auto connect ke node baru
        this.connectToPeers([node]);
      }
    });
  }

  sendChain(socket) {
    socket.send(
      JSON.stringify({
        type: "chain",
        chain: this.blockchain.chain,
      })
    );
  }

  broadcastChain() {
    this.sockets.forEach((socket) => {
      this.sendChain(socket);
    });
  }

  broadcastTransaction(transaction) {
    this.sockets.forEach((socket) => {
      socket.send(
        JSON.stringify({
          type: "transaction",
          transaction: transaction,
        })
      );
    });
  }
}

module.exports = P2PServer;
