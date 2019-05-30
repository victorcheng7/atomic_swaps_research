const Web3 = require('web3')
const rpcURL = 'http://127.0.0.1:8546' // Your RPC URL goes here
const web3 = new Web3(rpcURL);
const RLP = require('rlp');
const Trie = require('merkle-patricia-tree')
const { keccak, encode, decode, toBuffer} = require('eth-util-lite')


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

	verifyAccountStateRoot: function (smartContractAddress, storageHash, nonce, codeHash, balance, proof, stateRoot){
		var check = true;
		// Verify that contract account address (merkleProof.address) depends on stateRoot (nonce, balance, storageHash, codeHash)
		// Nonce, balance, storageRoot, and codeHash are valid
		Trie.verifyProof(stateRoot, keccak(smartContractAddress), proof, (err, value) => {
		   if (err || !value.equals(encode([parseInt(nonce),parseInt(balance),storageHash, codeHash])))
		      check = false;
		});

		return check;
	}, 

	verifyValidCode: function(code, codehash, originalContractCode) {
		// TODO validate code template is correct (everything is the same but address)
		// Take out all the spaces and check character # is replaced with correct code

		// Check that codehash matches bytecode
		return web3.utils.keccak256(code) == codehash;
	}, 

	verifyStorage: function(storageHash, storageProof, fromAddress, sendToAddress){
		// TODO 
		// Verify msg.sender = fromAddress, unique address in template in code is correct, sufficient funds in msg.val
		// Verify merkleProof for storage data and storageRoot 

		return false;
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