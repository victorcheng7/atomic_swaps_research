To run:
1. 
geth --datadir "./db2" --orkid 123456 --rpc --rpcport "8546"  --rpccorsdomain "*"  --port 30305 --nodiscover --rpcapi="admin,db,eth,debug,miner,net,shh,txpool,personal,web3" --ipcdisable console


Goal:
1. Provide MVP implementation of new atomic swaps algorithm that's more parallelizable than Herlihy's algorithm 
2. Derisk implementation difficulty for full decentralized solution (port javascript over to Solidity)
3. Do all of the above without taking too much of Amr or Victor's time


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

References:
https://sites.cs.ucsb.edu/~victorzakhary/assets/papers/arXiv__Atomic_Cross_Chain_Commitment.pdf

Good Resources:
https://easythereentropy.wordpress.com/2014/06/04/understanding-the-ethereum-trie/
https://programtheblockchain.com/posts/2018/03/09/understanding-ethereum-smart-contract-storage/
