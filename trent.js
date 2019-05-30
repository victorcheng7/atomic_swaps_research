const fs = require('fs');
const Web3 = require('web3')
const RLP = require('rlp');
const utils = require('./utils')
const Trie = require('merkle-patricia-tree')
const { keccak, encode, decode, toBuffer} = require('eth-util-lite')
const { GetAndVerify, GetProof, VerifyProof } = require('eth-proof')

const rpcURL = 'http://127.0.0.1:8546' // RPC URL goes here
const web3 = new Web3(rpcURL);
let getAndVerify = new GetAndVerify(rpcURL);

var debug = true;

// Give signature if everything is given correctly
function verify(fromAddress, sendToAddress){
	const byteCode = fs.readFileSync('data/byteCode.txt', 'utf-8');
	const blockHeaders = JSON.parse(fs.readFileSync('data/blockHeaders.json', 'utf-8'));
	const merkleProof = JSON.parse(fs.readFileSync('data/merkleDataProof.json', 'utf-8'));
	const smartContractCode = fs.readFileSync('data/smartContractCode.txt', 'utf-8');

	// if all pass, return signature
	if(verifyBlockHeaders(blockHeaders) && verifyMerkleProof(blockHeaders[blockHeaders.length-1].stateRoot, merkleProof, byteCode, fromAddress, sendToAddress, smartContractCode))
		return issueSignature();
}


verify(0xCCb06E380ae6805C7e6c77bE24E215BB3442735A, 0x123F681646d4A755815f9CB19e1aCc8565A0c2AC);

function issueSignature(){
	// TODO issue signature
}


function verifyBlockHeaders(blockHeaders){ 
	var parentHash = blockHeaders[0].parentHash;
	return blockHeaders.every(function(block){
		var check = true;

		// Compute hash of blockheader data and see if it equals to hash
		if(!utils.verifyHeaderHash(block)) check = false;

		// Verify this block contains previous hash 
		if(block.parentHash !== parentHash) check = false;
		
		// Verify difficulty is within some range. 
		// TODO -- replace 130000 difficulty with correct one (most recent ethereum difficulty ~ 2,000,000,000,000,000)
		// OR replace with calculating for both BTC (changes every epoch) and ETH (calculation in white paper)
		if(block.number != 0) check = block.difficulty > 130000; 

		// Verify valid PoW (nonce correctly calculated)
		// TODO rewrite my own PoW verification, look at internals
		web3.eth.submitWork(block.nonce, block.hash, block.mixHash)
		.then((result) => check = result)
		.catch((err) => {if(err) check = false}); // when node is shutdown

		parentHash = block.hash;
		return check;
	});
}

function verifyMerkleProof(stateRoot, mp, byteCode, fromAddress, sendToAddress, originalContractCode){
	//  Look at internals at https://github.com/zmitton/eth-proof
	// and this https://github.com/ethereumjs/merkle-patricia-tree
	// For Ethereum on chain merkle proof verification - https://github.com/lorenzb/proveth
	const smartContractAddress = "0xc40bf4154176bedc7ec5989cf065d3ca3b5deedc"; // Change contract address here

	var check = true;
	// Valid merkle proof that contract account address (merkleProof.address) depends on stateRoot
	// and is dependent on provided storageroot, codeHash, nonce, balance
	check = utils.verifyAccountStateRoot(smartContractAddress, mp.storageHash, mp.nonce, mp.codeHash, mp.balance, mp.accountProof, stateRoot)

	// Check storage data is correct and dependent on storageRoot 
	// Validate msg.sender, recipient address, and msg.val
	check = utils.verifyStorage(mp.storageHash, mp.storageProof, fromAddress, sendToAddress);

	// Check bytecode is correct codeHash
	check = utils.verifyValidCode(byteCode, mp.codeHash, originalContractCode);

	return check;
}


