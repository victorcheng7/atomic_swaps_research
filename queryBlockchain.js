const Web3 = require('web3')
const fs = require('fs')
const rpcURL = 'http://127.0.0.1:8545' // Your RPC URL goes here
const web3 = new Web3(rpcURL);

const debug = false;
const smartContractAddress = "0xfb32abae531d7e4cc4d71507de558ee3a24a74ff"; // Change contract address here


function retrieve(){ // Retrieve data and write to file to be used for trent.js 

	// Retrieve block headers and write to blockHeaders.json
	retrieveBlockHeaders();

	// Retrieve bytecode of contract and write to contractCode.txt
	retrieveContractCode(smartContractAddress);

	// Retrieve storage / contract account merkle proof 
	// and the data itself (sender/recipient address (msg.sender), msg.value).
	// Then write to merkleDataProof.json
	retrieveProof(smartContractAddress);
}

retrieve();

async function retrieveBlockHeaders(){
	var blocks = []; 
	var isNextBlock = true;
	var i = 0;

	while(isNextBlock){
		await web3.eth.getBlock(i).then((result) => { 
			if(debug) console.log("Inside eth.getBlock retrieveBlock");
			if(result != null) blocks.push(result);
			else isNextBlock = false;
		});
		i++;
	}

	if(debug) console.log(`${blocks.length} blocks`);
	if(debug) console.log(blocks);

	fs.writeFile('data/blockHeaders.json', JSON.stringify(blocks), (err) => {
		if(err) throw err;
	});
}

function retrieveContractCode(address){
	// Contains raw code
	web3.eth.getCode(address).then((result) => {
		fs.writeFile('data/byteCode.txt', result, (err) => { if(err) throw err});
	});
}

async function retrieveProof(address){
	// Contains necessary information for merkle proof
	// Retrieves proof for contract account containing code, sender/recipient addresses (msg.sender), msg.value, codehash, etc.
	web3.eth.getProof(address, ["0", "2"], "latest").then((result) => {
		fs.writeFile('data/merkleDataProof.json', JSON.stringify(result), (err) => {
			if(err) throw err;
		});
	});
}

//console.log(web3.utils.toChecksumAddress("0x123f681646d4a755815f9cb19e1acc8565a0c2ac"))
// Try both and do string comparison on bytecode to figure out ways to check
//0x8ef93287e177afe79472f70d1b2c9d806844c931 
// web3.eth.getCode("0x46465f376d3034d5f6aa1ee5a43b6ce572ebb153").then((result) => {
// 	console.log(result)
// 	});


/*
Address querying
const address = '0xccb06e380ae6805c7e6c77be24e215bb3442735a' // Your account address goes here
web3.eth.getBalance(address, (err, wei) => {
  balance = web3.utils.fromWei(wei, 'ether');
  console.log(balance)
	web3.utils.isAddress('0xc1912fee45d61c87cc5ea59dae31190fffff232d');

})
console.log(web3.eth.getTransactionCount());


Used for debugging storage
async function helper_printStorage(address){
	for(var i = 0; i < 10; i++){
		web3.eth.getStorageAt(smartContractAddress, i).then((value) => {
			if(value != 0) console.log(value)
		})
	}
}

function playground(){
	web3.eth.getCode(contractAddress).then(console.log);
	web3.eth.getTransactionCount(smartContractAddress).then(console.log);
	web3.eth.getStorageAt(smartContractAddress).then((result) => {
		console.log(result);
		console.log(web3.utils.hexToAscii(result));
	});
	web3.eth.getProof(smartContractAddress, ["0", "2"]).then((result) => console.log(JSON.stringify(result)));
}

*/

