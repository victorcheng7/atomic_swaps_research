pragma solidity ^0.4.11;

contract Trent {
    address owner;
    address sender = 0xBF20D8D746E53b6Bc1262CCa7c90276F6F0707d1;
    uint public value;
    // enum State {PUBLISHED, REDEEMED, REFUNDED}
    // State public state;
    bytes32 public constant redeemHash = 0x26ef0a97332ad048ac544d8dfacdd43e128b9816d599fdd0310960904fa18609; // keccak256 hash of 'redeem' key
    bytes32 public constant refundHash = 0x4fd967966e6b0ea40f78dff297fed3b472763137dac6cf564d7263e918f425ef; // keccak256 hash of 'refund' key

    
    constructor() public payable {
        owner = msg.sender;
        value = msg.value;
    }


    function redeem(string key) public {
        require(redeemHash == keccak256(abi.encodePacked(key)));
        // Send some money to other address
        sender.transfer(value);
        //state = State.REDEEMED;
    }
    
    function refund(string key) public{
        require(redeemHash == keccak256(abi.encodePacked(key)));
        // Send some money to other address
        sender.transfer(value);
    }
    
    
    function destroy() payable public {
        require(msg.sender == owner);
        selfdestruct(owner);
    }
}