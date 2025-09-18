const SHA256 = require("crypto-js/sha256");

class Block {
  constructor(index, timestamp, data, previousHash = "") {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;
    this.previousHash = previousHash;
    this.hash = this.calculateHash();
    this.nonce = 0;
  }

  calculateHash() {
    return SHA256(
      this.index +
        this.previousHash +
        this.timestamp +
        JSON.stringify(this.data) +
        this.nonce
    ).toString();
  }

  mineBlock(difficulty) {
    while (
      this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")
    ) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
    console.log(`Block mined: ${this.hash}`);
  }
}

class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 2;
    this.pendingTransactions = [];
    this.miningReward = 100;
  }

  createGenesisBlock() {
    return new Block(0, new Date().toString(), "Genesis Block", "0");
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  minePendingTransactions(miningRewardAddress) {
    const rewardTransaction = {
      fromAddress: null,
      toAddress: miningRewardAddress,
      amount: this.miningReward,
    };

    this.pendingTransactions.push(rewardTransaction);

    let block = new Block(
      this.chain.length,
      new Date().toString(),
      this.pendingTransactions,
      this.getLatestBlock().hash
    );

    block.mineBlock(this.difficulty);
    console.log("Block successfully mined!");
    this.chain.push(block);

    this.pendingTransactions = [];
  }

  createTransaction(transaction) {
    this.pendingTransactions.push(transaction);
  }

  getBalanceOfAddress(address) {
    let balance = 0;

    for (const block of this.chain) {
      for (const trans of block.data) {
        if (trans.fromAddress === address) {
          balance -= trans.amount;
        }

        if (trans.toAddress === address) {
          balance += trans.amount;
        }
      }
    }

    return balance;
  }

  getAllTransactionsForWallet(address) {
    const txs = [];

    for (const block of this.chain) {
      for (const tx of block.data) {
        if (tx.fromAddress === address || tx.toAddress === address) {
          txs.push(tx);
        }
      }
    }

    return txs;
  }

  isChainValid() {
    const realGenesis = JSON.stringify(this.createGenesisBlock());

    if (realGenesis !== JSON.stringify(this.chain[0])) {
      return false;
    }

    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      if (!currentBlock.hasValidTransactions()) {
        return false;
      }

      if (currentBlock.hash !== currentBlock.calculateHash()) {
        return false;
      }

      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
    }

    return true;
  }

  // Disentralize

  isValidChain(chain) {
    if (
      JSON.stringify(chain[0]) !== JSON.stringify(this.createGenesisBlock())
    ) {
      return false;
    }

    for (let i = 1; i < chain.length; i++) {
      const block = chain[i];
      const previousBlock = chain[i - 1];

      if (block.previousHash !== previousBlock.hash) {
        return false;
      }

      if (block.hash !== block.calculateHash()) {
        return false;
      }
    }

    return true;
  }

  // Replace chain dengan versi yang lebih panjang (konsensus)
  replaceChain(newChain) {
    if (newChain.length <= this.chain.length) {
      console.log("Received chain is not longer than current chain");
      return false;
    }

    if (!this.isValidChain(newChain)) {
      console.log("Received chain is not valid");
      return false;
    }

    console.log("Replacing current chain with new chain");
    this.chain = newChain;
    return true;
  }

  forceSync(newChain) {
    if (newChain.length > this.chain.length && this.isValidChain(newChain)) {
      console.log(
        `Force sync: new chain length ${newChain.length} > current ${this.chain.length}`
      );
      this.chain = newChain;
      return true;
    }
    return false;
  }

  addUser(userData) {
    const userTx = {
      type: "USER",
      id: userData.id,
      name: userData.name,
      email: userData.email,
      walletAddress: userData.walletAddress,
      createdAt: userData.createdAt,
    };

    this.createTransaction({
      fromAddress: null,
      toAddress: userData.walletAddress,
      amount: 0,
      data: userTx,
    });
  }

  getUsers() {
    const users = [];
    for (const block of this.chain) {
      for (const tx of block.data) {
        if (tx.data && tx.data.type === "USER") {
          users.push({
            ...tx.data,
            balance: this.getBalanceOfAddress(tx.data.walletAddress),
          });
        }
      }
    }
    return users;
  }

  isValidTransaction(tx) {
    if (tx.fromAddress === null) return true; // Mining reward

    return (
      tx.fromAddress &&
      tx.toAddress &&
      tx.amount > 0 &&
      this.getBalanceOfAddress(tx.fromAddress) >= tx.amount
    );
  }

  // Tambahkan transaksi dengan broadcast
  addTransaction(transaction) {
    if (!transaction.fromAddress || !transaction.toAddress) {
      throw new Error("Transaction must include from and to address");
    }

    if (!this.isValidTransaction(transaction)) {
      throw new Error("Cannot add invalid transaction to chain");
    }

    if (
      this.getBalanceOfAddress(transaction.fromAddress) < transaction.amount
    ) {
      throw new Error("Not enough balance");
    }

    this.pendingTransactions.push(transaction);
  }
}

module.exports.Blockchain = Blockchain;
module.exports.Block = Block;
