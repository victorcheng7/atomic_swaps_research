pragma solidity ^0.4.11;

contract WN {
    address owner = 0xCCb06E380ae6805C7e6c77bE24E215BB3442735A;
    address sender = 0xBF20D8D746E53b6Bc1262CCa7c90276F6F0707d1;
    uint public value;
    enum State {PUBLISHED, REDEEMABLE, REFUNDABLE}
    State public state;
    
    constructor() public payable {
        owner = msg.sender;
        value = msg.value;
        state = State.PUBLISHED;
    }
    
    // Function to fill in owner and sender declaring each other


    function isRedeemable(address p, bytes32 hash, uint8 v, bytes32 r, bytes32 s) public constant {
        // Note: this only verifies that signer is correct.
        // You'll also need to verify that the hash of the data
        // is also correct.
        if(ecrecover(hash, v, r, s) == p) {
            state = State.REDEEMABLE;
        }
    }
    
    function isRefundable(address p, bytes32 hash, uint8 v, bytes32 r, bytes32 s) public constant {
        // Send some money to other address
        if(ecrecover(hash, v, r, s) == p) {
            state = State.REFUNDABLE;
        }
    }
    
    
    function destroy() payable public {
        require(msg.sender == owner);
        selfdestruct(owner);
    }
}