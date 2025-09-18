// decentralized-server.js
const express = require("express");
const bodyParser = require("body-parser");
const { Blockchain } = require("./blockchain");
const P2PServer = require("./p2p-server");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs"); // TAMBAHKAN ini
const path = require("path"); // TAMBAHKAN ini
const crypto = require("crypto"); // TAMBAHKAN ini

const app = express();
const blockchain = new Blockchain();
const p2pServer = new P2PServer(blockchain);

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Set EJS as templating engine
app.set("view engine", "ejs");

const os = require("os");

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (let name of Object.keys(interfaces)) {
    for (let iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}

let users = [];

// Node identification
const nodeId = uuidv4();
let peers = [];

// Load users from file
const loadUsers = () => {
  try {
    const data = fs.readFileSync(path.join(__dirname, "data", "users.json"));
    users = JSON.parse(data);
  } catch (error) {
    users = [];
  }
};

// Save users to file
const saveUsers = () => {
  fs.writeFileSync(
    path.join(__dirname, "data", "users.json"),
    JSON.stringify(users, null, 2)
  );
};

// Fungsi untuk generate wallet address baru
function generateWalletAddress() {
  const privateKey = crypto.randomBytes(32).toString("hex");
  // Sederhana: hash private key untuk membuat address
  const address =
    "0x" +
    crypto.createHash("sha256").update(privateKey).digest("hex").substring(24);
  return {
    privateKey: "0x" + privateKey,
    address: address,
  };
}

// Routes
app.get("/", (req, res) => {
  res.render("index", {
    blockchain: blockchain.chain,
    difficulty: blockchain.difficulty,
    miningReward: blockchain.miningReward,
  });
});

app.get("/users", (req, res) => {
  loadUsers();
  users.forEach((user) => {
    user.balance = blockchain.getBalanceOfAddress(user.walletAddress);
  });
  res.render("users", { users: users });
});

app.post("/users", (req, res) => {
  const { name, email, walletAddress } = req.body;
  const newUser = {
    id: uuidv4(),
    name,
    email,
    walletAddress,
    balance: 0,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  saveUsers();
  res.redirect("/users");
});

app.get("/payments", (req, res) => {
  res.render("payments", {
    transactions: blockchain.pendingTransactions,
  });
});

app.post("/payments", (req, res) => {
  const { fromAddress, toAddress, amount } = req.body;

  blockchain.createTransaction({
    fromAddress,
    toAddress,
    amount: parseFloat(amount),
  });

  res.redirect("/payments");
});

app.get("/node-management", (req, res) => {
  res.render("node-management");
});

// Route baru untuk generate wallet
app.get("/generate-wallet", (req, res) => {
  const wallet = generateWalletAddress();
  res.json(wallet);
});

app.get("/wallet-generator", (req, res) => {
  res.render("wallet-generator");
});

app.get("/blockchain-info", (req, res) => {
  res.render("blockchain-info", {
    blockchain: blockchain.chain,
    isValid: blockchain.isChainValid(),
  });
});

app.get("/balance/:address", (req, res) => {
  const balance = blockchain.getBalanceOfAddress(req.params.address);
  res.json({ balance: balance });
});

// Routes untuk node management
app.get("/node-info", (req, res) => {
  res.json({
    nodeId: nodeId,
    peers: peers.length,
    chainLength: blockchain.chain.length,
    pendingTransactions: blockchain.pendingTransactions.length,
  });
});

app.post("/connect-node", (req, res) => {
  const { peerAddress } = req.body;
  if (peerAddress && !peers.includes(peerAddress)) {
    peers.push(peerAddress);
    p2pServer.connectToPeers([peerAddress]);
    res.json({ message: "Connected to peer", peer: peerAddress });
  } else {
    res
      .status(400)
      .json({ error: "Invalid peer address or already connected" });
  }
});

app.get("/peers", (req, res) => {
  const peerList = Array.from(p2pServer.nodeList);
  res.json({ peers: peerList });
});

// Mining dengan broadcast
app.post("/mine", (req, res) => {
  const { miningRewardAddress } = req.body;

  try {
    blockchain.minePendingTransactions(miningRewardAddress);

    if (p2pServer.sockets.length > 0) {
      p2pServer.broadcastChain();
      console.log(`Broadcasted to ${p2pServer.sockets.length} peers`);
    } else {
      console.log("No peers to broadcast");
    }
    // Broadcast ke semua node
    p2pServer.broadcastChain();

    loadUsers();
    const user = users.find((u) => u.walletAddress === miningRewardAddress);
    if (user) {
      user.balance = blockchain.getBalanceOfAddress(miningRewardAddress);
      saveUsers();
    }
    res.json({
      message: "Block mined successfully and broadcasted",
      block: blockchain.getLatestBlock(),
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Transaksi dengan broadcast
app.post("/transactions", (req, res) => {
  const { fromAddress, toAddress, amount } = req.body;

  try {
    const transaction = {
      fromAddress,
      toAddress,
      amount: parseFloat(amount),
    };

    blockchain.addTransaction(transaction);

    // Broadcast transaksi ke semua node
    p2pServer.broadcastTransaction(transaction);

    res.json({ message: "Transaction added and broadcasted", transaction });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Sync blockchain
app.post("/sync", (req, res) => {
  p2pServer.broadcastChain();
  res.json({ message: "Blockchain sync initiated" });
});

function getRandomPort(min = 3000, max = 9000) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Start servers
const HTTP_PORT = getRandomPort();
const P2P_PORT = getRandomPort();

console.log(`Starting node on HTTP:${HTTP_PORT} P2P:${P2P_PORT}`);
const LOCAL_IP = getLocalIP();
console.log(`Local IP: ${LOCAL_IP}`);

app.listen(HTTP_PORT, () => {
  // Display connection info
  console.log(`\n=== NODE READY ===`);
  console.log(`🚀 Node running at http://localhost:${HTTP_PORT}`);
  console.log(`📡 P2P port: ${P2P_PORT}`);
  console.log(`LAN IP: ws://${LOCAL_IP}:${P2P_PORT}`);
  console.log(`Share your LAN IP to local friends`);
  console.log(`==================\n`);
});

p2pServer.listen(P2P_PORT);
setTimeout(() => {
  console.log("Waiting for peer connections...");
}, 3000);
