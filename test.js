const fs = require('fs');
const Web3 = require('web3')
const RLP = require('rlp');
const utils = require('./utils')
const Trie = require('merkle-patricia-tree')
const { keccak, encode, decode, toBuffer} = require('eth-util-lite')

const rpcURL = 'http://127.0.0.1:8545' // RPC URL goes here
const web3 = new Web3(rpcURL);

const contractABI = JSON.parse(fs.readFileSync('contractABI.txt', 'utf-8'));

const contract = new web3.eth.Contract(contractABI, "0x3b4ec9e5e3f3cc80c7b8168066db041980a56157");
contract.methods.redeem("password").estimateGas().then(console.log).catch(console.log);

// var gasEstimate = web3.eth.estimateGas({
//     from: web3.eth.coinbase,
//     to: "0xc7278d22c0d1fecd9ea85a12d9b17815301eff45",
//     data: callData
// });

// var gasPrice = web3.eth.gasPrice;

// console.log('gas Price: ' + gasPrice);
// console.log('Estimated Transaction gas: ' + gasEstimate);