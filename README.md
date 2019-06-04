Goal:
1. Provide MVP implementation of new atomic swaps algorithm proposed in https://sites.cs.ucsb.edu/~victorzakhary/assets/papers/arXiv__Atomic_Cross_Chain_Commitment.pdf
2. Derisk implementation difficulty for full decentralized solution (port javascript over to Solidity)
3. Do all of the above without taking too much of Amr or Victor's time


To run:
1. Complete getting started tutorial on private Ethereum blockchain (i.e install Geth)
2. Start private ethereum blockchain by running
geth --datadir "./db2" --orkid 123456 --rpc --rpcport "8546"  --rpccorsdomain "*"  --port 30305 --nodiscover --rpcapi="admin,db,eth,debug,miner,net,shh,txpool,personal,web3" --ipcdisable console
2. In separate terminal, create new default account by running "geth account new --password <passwordfile>"
3. Unlock account by running "personal.unlockAccount(eth.accounts[0], 'yourpassword')" in terminal running private blockchain
4. If you want to try running verification from scratch, deploy "trent.sol" in Remix and set value == "1000" wei. Then copy contract address and change "smartContractAddress" queryBlockchain.js. Then run "node queryBlockchain.js"
5. If you want to just try what I've deployed, just run "node trent.js"
  
The WN contract is in "WN.sol"
The Trent smart contract is in "Trent.sol"
The blockchain query is in queryBlockchain.js and writes to folder /data
The verification algorithm is in trent.js and reads data from folder /data
I only use db2. I don't use db, but it can be used for testing

TODO: Copy my implementation in "trent.js" and "util.js" and take examples I've referenced (i.e. on-chain Merkle Proofs) below to finish final smart contract. The off-chain implementation of merkle proofs is in the folder /helpers


New Proposed Algorithm:
Alice deploys SC with validate WN smart contract (give base block of WN + block with WN smart contract that gets alice and bob’s agreement + blocks after)
Bob deploys SC with validate WN smart contract (give base block of WN + block with WN smart contract that gets alice and bob’s agreement + blocks after)
Bob and Alice can each provide the WN smart contract once the state has changed up starting from agreed upon base block AND smart contract depends on their addresses

Challenges: 
Had to understand how Ethereum internals truly worked (i.e. storage, merkle tries, address generation, etc.) and tried many workarounds not listed in research paper

Code Comment Guidelines:
1. Replace all comments that include "NOTE" with different hardcoded values.

Outside References for future on-chain verification:
1. https://github.com/aragon/evm-storage-proofs
2. https://github.com/ConsenSys/rb-relay/blob/master/contracts/MerklePatriciaProof.sol
3. https://github.com/zmitton/eth-proof
4. https://github.com/ethereum/btcrelay

Good Resources:
https://easythereentropy.wordpress.com/2014/06/04/understanding-the-ethereum-trie/
https://programtheblockchain.com/posts/2018/03/09/understanding-ethereum-smart-contract-storage/
