const Web3 = require('web3');
const rpcURL = 'http://127.0.0.1:8545'; // Your RPC URL goes here
const web3 = new Web3(rpcURL);
const RLP = require('rlp');
const Trie = require('merkle-patricia-tree');
const { keccak, encode, decode, toBuffer} = require('eth-util-lite');
//const GetAndVerify = require('./helpers/getAndVerify');
const { GetAndVerify } = require('eth-proof'); // Check helpers/getAndVerify for code

let getAndVerify = new GetAndVerify(rpcURL);



module.exports = {
	verifyHeaderHash: function (blockHeader){
		function hashSerializer(hash){
			if(hash === 0) return '0x';
			return web3.utils.toHex(hash);
		}

		var arrFormat = [];
		arrFormat.push(blockHeader.parentHash);
		arrFormat.push(blockHeader.sha3Uncles);
		arrFormat.push(blockHeader.miner);
		arrFormat.push(blockHeader.stateRoot);
		arrFormat.push(blockHeader.transactionsRoot);
		arrFormat.push(blockHeader.receiptsRoot);
		arrFormat.push(blockHeader.logsBloom);
		arrFormat.push(blockHeader.difficulty);
		arrFormat.push(blockHeader.number);
		arrFormat.push(blockHeader.gasLimit);
		arrFormat.push(blockHeader.gasUsed);
		arrFormat.push(blockHeader.timestamp);
		arrFormat.push(blockHeader.extraData);
		arrFormat.push(blockHeader.mixHash);
		arrFormat.push(blockHeader.nonce);

		arrFormat = arrFormat.map(value => hashSerializer(value)); // Serialize hash
		arrFormat = '0x' + RLP.encode(arrFormat).toString('hex'); // RLP encode into hex
		return blockHeader.hash == web3.utils.keccak256(arrFormat);
	},

	verifyAccountStateRoot: async function (smartContractAddress, storageHash, nonce, codeHash, balance, proof, stateRoot){
		var check = true;
		// Verify that contract account address (merkleProof.address) depends on stateRoot (nonce, balance, storageHash, codeHash)
		// Nonce, balance, storageRoot, and codeHash are valid
		await Trie.verifyProof(stateRoot, keccak(smartContractAddress), proof, (err, value) => {
		   if (err || !value.equals(encode([parseInt(nonce),parseInt(balance),storageHash, codeHash])))
		      check = false;
		});

		return check;
	}, 

	verifyValidCode: async function(byteCode, codehash, originalContractCode, sendToAddress) {
		// NOTE replace with actual contract code
		let code = "pragmasolidity^0.4.11;contractTrent{addressowner;addresssender=0xBF20D8D746E53b6Bc1262CCa7c90276F6F0707d1;uintpublicvalue;//enumState{PUBLISHED,REDEEMED,REFUNDED}//Statepublicstate;bytes32publicconstantredeemHash=0x26ef0a97332ad048ac544d8dfacdd43e128b9816d599fdd0310960904fa18609;//keccak256hashof'redeem'keybytes32publicconstantrefundHash=0x4fd967966e6b0ea40f78dff297fed3b472763137dac6cf564d7263e918f425ef;//keccak256hashof'refund'keyconstructor()publicpayable{owner=msg.sender;value=msg.value;}functionredeem(stringkey)public{require(redeemHash==keccak256(abi.encodePacked(key)));//Sendsomemoneytootheraddresssender.transfer(value);//state=State.REDEEMED;}functionrefund(stringkey)public{require(redeemHash==keccak256(abi.encodePacked(key)));//Sendsomemoneytootheraddresssender.transfer(value);}functiondestroy()payablepublic{require(msg.sender==owner);selfdestruct(owner);}}"
		function replaceRange(s, start, end, substitute) {
		    return s.substring(0, start) + substitute + s.substring(end);
		}
		var check = true;

		// Replace sendToAddress at proper character count # 
		// and check if originalContractCode == sendToAddress
		check = originalContractCode.replace(/\s/g, '') == replaceRange(code, 63, 105, sendToAddress); 

		// Don't actually need below code assuming you can just read contract code directly
		// Check that codehash matches bytecode, so codehash is valid
		check =  web3.utils.keccak256(byteCode) == codehash;
		return check;
	}, 

	verifyStorage: async function(smartContractAddress, storageHash, storageProofs, fromAddress, contractFunds, blockHeaderHash){
		// TODO fix bug
		var check = true;

		// For every storageProof array index, check that it links to storageHash
		return Promise.all(storageProofs.map((proof) => {
			var check = true;
			// From https://github.com/zmitton/eth-proof/blob/master/getAndVerify.js

			// Validate storage merkle proof checks out
			if(!getAndVerify.storageAgainstBlockHash(smartContractAddress, proof.key, blockHeaderHash)) check = false;
			
			// Verify msg.sender = fromAddress
			if(proof.key == 0 && proof.value != fromAddress) check = false;
			
			// Verify msg.val contains sufficient funds
			if(proof.key == 2 && proof.value != contractFunds) check = false;

			return check;
			/*
			//const path = web3.utils.soliditySha3({t: 'uint256', v: proof.key }).slice(2);
			console.log(web3.utils.padLeft(proof.key, 32))
			console.log(keccak(web3.utils.padLeft(proof.key, 32)))
			//console.log(path)
			//console.log(Buffer.from(path, 'hex'));
			return Trie.verifyProof(storageHash, keccak(web3.utils.padLeft(proof.key, 32)), proof.proof, (err, value) => {
			   if (err || !value.equals(proof.value)) { 
			   	console.log(err);
			   	return false;
			   }
			   else console.log(value)
			});*/
		})).then(result => result.every(check => check)).catch(console.log("Error when validating storage"));
	},


	/*verifyProof: function(rootHash, key, proof, cb) {
	  key = stringToNibbles(key)
	  var wantHash = ethUtil.toBuffer(rootHash)
	  for (var i = 0; i < proof.length; i++) {
	    var p = ethUtil.toBuffer(proof[i])
	    var hash = ethUtil.sha3(proof[i])
	    if (Buffer.compare(hash, wantHash)) {
	      return cb(new Error('Bad proof node ' + i + ': hash mismatch'))
	    }
	    var node = new TrieNode(ethUtil.rlp.decode(p))
	    var cld
	    if (node.type === 'branch') {
	      if (key.length === 0) {
	        if (i !== proof.length - 1) {
	          return cb(new Error('Additional nodes at end of proof (branch)'))
	        }
	        return cb(null, node.value)
	      }
	      cld = node.raw[key[0]]
	      key = key.slice(1)
	      if (cld.length === 2) {
	        var embeddedNode = new TrieNode(cld)
	        if (i !== proof.length - 1) {
	          return cb(new Error('Additional nodes at end of proof (embeddedNode)'))
	        }

	        if (matchingNibbleLength(embeddedNode.key, key) !== embeddedNode.key.length) {
	          return cb(new Error('Key length does not match with the proof one (embeddedNode)'))
	        }
	        key = key.slice(embeddedNode.key.length)
	        if (key.length !== 0) {
	          return cb(new Error('Key does not match with the proof one (embeddedNode)'))
	        }
	        return cb(null, embeddedNode.value)
	      } else {
	        wantHash = cld
	      }
	    } else if ((node.type === 'extention') || (node.type === 'leaf')) {
	      if (matchingNibbleLength(node.key, key) !== node.key.length) {
	        return cb(new Error('Key does not match with the proof one (extention|leaf)'))
	      }
	      cld = node.value
	      key = key.slice(node.key.length)
	      if (key.length === 0 || (cld.length === 17 && key.length === 1)) {
	        // The value is in an embedded branch. Extract it.
	        if (cld.length === 17) {
	          cld = cld[key[0]][1]
	          key = key.slice(1)
	        }
	        if (i !== proof.length - 1) {
	          return cb(new Error('Additional nodes at end of proof (extention|leaf)'))
	        }
	        return cb(null, cld)
	      } else {
	        wantHash = cld
	      }
	    } else {
	      return cb(new Error('Invalid node type'))
	    }
	  }
	}*/
}