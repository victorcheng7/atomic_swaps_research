const fs = require('fs');
const Web3 = require('web3')
const RLP = require('rlp');
const utils = require('./utils')
const Trie = require('merkle-patricia-tree')
const { keccak, encode, decode, toBuffer} = require('eth-util-lite')

const rpcURL = 'http://127.0.0.1:8545' // RPC URL goes here
const web3 = new Web3(rpcURL);

var debug = true;

attemptRedeem();

function attemptRedeem(){
	// Calls redeem 
	console.log("Issuing redeem signature") 
	verify().then(result => { 
		if(result) console.log(web3.eth.abi.encodeParameter('bytes32', keccak('redeem')))
		else console.log("Failed to redeem");
	});
}

function attemptRefund(){
	console.log("Issuing refund signature") 
	console.log(web3.eth.abi.encodeParameter('bytes32', keccak('refund')));
}

// Give signature if everything is given correctly
function verify(){
	const byteCode = fs.readFileSync('data/byteCode.txt', 'utf-8');
	const blockHeaders = JSON.parse(fs.readFileSync('data/blockHeaders.json', 'utf-8'));
	const merkleProof = JSON.parse(fs.readFileSync('data/merkleDataProof.json', 'utf-8'));
	const smartContractCode = fs.readFileSync('data/smartContractCode.txt', 'utf-8');
	const fromAddress = 0xCCb06E380ae6805C7e6c77bE24E215BB3442735A; // NOTE Modify this with correct address
	const sendToAddress = 0xBF20D8D746E53b6Bc1262CCa7c90276F6F0707d1; // NOTE Modify this with correct address

	const smartContractAddress1 = "0xfb32abae531d7e4cc4d71507de558ee3a24a74ff"; // NOTE Change contract address here
	const smartContractAddress2 = ""; // NOTE Change contract address here

	const contractFunds = 1000;  // NOTE change this value depending on agreed upon funds

	// if all pass, return signature
	return Promise.all([
		verifyBlockHeaders(blockHeaders), 
		verifyMerkleProof(blockHeaders[blockHeaders.length-1], merkleProof, byteCode, fromAddress, sendToAddress, smartContractCode, smartContractAddress1, contractFunds)
		/*verifyMerkleProof(blockHeaders[blockHeaders.length-1], merkleProof, byteCode, sendToAddress, fromAddress, smartContractCode, smartContractAddress2, contractFunds)*/])
	.then((result) => {
		console.log("Final result: " + result)
		if(result.every(a => a)) return true;
	}).catch(console.log);
}

async function verifyBlockHeaders(blockHeaders){ 
	var parentHash = blockHeaders[0].parentHash;
	return blockHeaders.every(function(block){
		var check = true;

		// Compute hash of blockheader data and see if it equals to hash
		if(!utils.verifyHeaderHash(block)) check = false;

		// Verify this block contains previous hash 
		if(block.parentHash !== parentHash) check = false;
		
		// Verify difficulty is within some range. 
		// NOTE -- replace 130000 difficulty with correct difficulty (most recent ethereum difficulty ~ 2,000,000,000,000,000)
		// OR replace with calculating for both BTC (changes every epoch) and ETH (calculation in white paper)
		if(block.number != 0) check = block.difficulty > 130000; 

		// Verify valid PoW (nonce correctly calculated)
		// NOTE rewrite my own PoW verification, look at internals
		web3.eth.submitWork(block.nonce, block.hash, block.mixHash)
		.then((result) => check = result)
		.catch((err) => {if(err) check = false}); // when node is shutdown

		parentHash = block.hash;
		return check;
	});
}

async function verifyMerkleProof(latestBlockHeader, mp, byteCode, fromAddress, sendToAddress, originalContractCode, smartContractAddress, contractFunds){
	//  Look at internals at https://github.com/zmitton/eth-proof
	// and this https://github.com/ethereumjs/merkle-patricia-tree
	// For Ethereum on chain merkle proof verification - https://github.com/lorenzb/proveth

	var check = true;
	// Valid merkle proof that contract account address (merkleProof.address) depends on stateRoot
	// and is dependent on provided storageroot, codeHash, nonce, balance
	accountResult = utils.verifyAccountStateRoot(smartContractAddress, mp.storageHash, mp.nonce, mp.codeHash, mp.balance, mp.accountProof, latestBlockHeader.stateRoot)

	// Check if code is correct + bytecode is correct codeHash (don't need this if you assume you have contract code)
	validCodeResult = utils.verifyValidCode(byteCode, mp.codeHash, originalContractCode, sendToAddress);

	// Check storage data is correct and dependent on storageRoot 
	// Validate msg.sender, recipient address, and msg.val
	storageResult = utils.verifyStorage(smartContractAddress, mp.storageHash, mp.storageProof, fromAddress, contractFunds, latestBlockHeader.hash);

	return Promise.all([accountResult, storageResult, validCodeResult]).then((values) => {
		return values.every((result) => result);
	}).catch(console.log);
}


