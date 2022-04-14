const {Blockchain, Transaction} = require('./Blockchain');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const myKey = ec.keyFromPrivate('8890a9c240852619fef12c081cbe2bc1a0a3b2f9cae6d3544204b25e8e847200');
const myWalletAddress = myKey.getPublic('hex');

let myBlockchain  = new Blockchain();
const tx1 = new Transaction(myWalletAddress, "to address public key goes here", 10);
tx1.signTransaction(myKey);
myBlockchain.addTransaction(tx1)


console.log("Starting the miner... ");
myBlockchain.minePendingTransactions(myWalletAddress);


console.log("My balance is: " + myBlockchain.getBalanceOfAddress(myWalletAddress)); 

console.log("Is chain valid?" + myBlockchain.isChainValid())

var data = {
  Address: myWalletAddress.toString(),
  Amount: myBlockchain.getBalanceOfAddress(myWalletAddress) 
};

var fs = require('fs');
  
fs.appendFile('data.txt',"Transactions: " + JSON.stringify(data) + "\n", 'utf8',
    function(err) {     
        if (err) throw err;
        console.log("Data is appended to file successfully.")
});
