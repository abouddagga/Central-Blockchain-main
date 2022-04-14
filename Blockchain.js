const { mode } = require('crypto-js');
const SHA256 = require('crypto-js/sha256');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');


class Transaction{
    constructor(fromAddress, toAddress, amount){
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.amount = amount;
    }

    calculateHash(){
        return SHA256(this.fromAddress + this.toAddress + this.amount).toString();
    }

    signTransaction(signingKey){
        if(signingKey.getPublic('hex') !== this.fromAddress){
            throw new Error('You cannot sign transactions for other wallets!');
        }

        const hashTx = this.calculateHash(); 
        const sig = signingKey.sign(hashTx, 'base64')
        this.signature = sig.toDER('hex') 

    }

    isValid(){
        if (this.fromAddress === null) return true;
        if (!this.signature || this.signature.length === 0) {
           throw new Error('No signature in this transaction');
        }
        const publicKey = ec.keyFromPublic(this.fromAddress, 'hex');
        return publicKey.verify(this.calculateHash(), this.signature);
    }
}

class Block{
   
    constructor(timestamp, transactions, previousHash = '00e5d8e4414c1fbffa3fe030aa36be7690f0f62734994363408f9a767c5f443e'){
        this.timestamp = timestamp; 
        this.transactions = transactions; 
        this.previousHash = previousHash;
        this.hash = this.calculateHash(); 
        this.nonce = 0; 
    }
    
    calculateHash(){   
        return SHA256(this.index + this.timestamp + this.previousHash + JSON.stringify(this.transactions) + this.nonce).toString();
    }

    mineBlock(difficulty){
        while(this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")){    
            this.nonce++;
            this.hash = this.calculateHash();
        }
        console.log("Block mined: "  +  this.hash);
        var header = {
            Hash: this.hash.toString(),
            TimeStamp: this.timestamp.toString(),
            Nonce: this.nonce.toString(),
            PreviousHash: this.previousHash.toString(),
            Difficulty: difficulty.toString()
          };
        var fs = require('fs');

        fs.appendFile('data.txt',"Block Header: " + JSON.stringify(header) + "\n", 'utf8',
         function(err) {     
            if (err) throw err;
            console.log("Data is appended to file successfully.")
        });

       

    }

    hasValidTransactions(){
        for(const tx of this.transactions){
            if(!tx.isValid()){
                return false;
            }
        }
        return true;
    }

}

class Blockchain{
    constructor(){
        this.chain = [this.createGenesisBlock()];
        this.difficulty = 2; 
        this.pendingTransactions = [];
        this.miningReward = 100;
    }

    createGenesisBlock(){
        return new Block('01/01/2021', "Genesis Block", "0");
    }

    getLatestBlock(){
        return this.chain[this.chain.length - 1]; 
    }
    minePendingTransactions(miningRewardAddress){
         const rewardTx = new Transaction(null, miningRewardAddress, this.miningReward);
        this.pendingTransactions.push(rewardTx);
        let block = new Block(Date.now(), this.pendingTransactions,  this.getLatestBlock().hash); 
        block.mineBlock(this.difficulty);
        console.log("Block successfully mined!");
        this.chain.push(block);

        this.pendingTransactions = [
            new Transaction(null, miningRewardAddress, this.miningReward)
        ]; 
        
    }

    addTransaction(transaction){
        
        if (!transaction.fromAddress || !transaction.toAddress) { 
            throw new Error('Transaction must include from and to address');
          }

          if (!transaction.isValid()) {
            throw new Error('Cannot add invalid transaction to chain');
          }

        this.pendingTransactions.push(transaction);
    }

    getBalanceOfAddress(address){
        let Balance = 0;

        for(const block of this.chain){ 
            for(const trans of block.transactions){ 
                if(trans.fromAddress === address){
                    Balance -= trans.amount;
                }

                if(trans.toAddress === address){
                    Balance += trans.amount;
                }
            }
        }

        return Balance;
    }

    isChainValid(){
        for(let i = 1; i < this.chain.length; i++){
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            if(!currentBlock.hasValidTransactions()){ 
                return false; 
            }

            if(currentBlock.hash !== currentBlock.calculateHash()){ 
                return false;
            }

            if (currentBlock.previousHash !== previousBlock.hash){
                return false;
            }
        }

        return true; 
    }

}

module.exports.Blockchain = Blockchain;
module.exports.Transaction = Transaction;
