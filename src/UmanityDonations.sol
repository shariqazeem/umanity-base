// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract UmanityDonations {
    address public owner;
    
    // Verified recipients
    mapping(address => bool) public verifiedRecipients;
    address[] public recipientList;
    
    // Donation tracking
    mapping(address => uint256) public donorTotals;
    mapping(address => uint256) public recipientTotals;
    mapping(address => uint256) public donorCounts;
    
    // Platform stats
    uint256 public totalDonated;
    uint256 public totalDonationCount;
    
    // Events
    event DonationMade(
        address indexed donor,
        address indexed recipient,
        uint256 amount,
        uint256 timestamp
    );
    event RecipientVerified(address indexed recipient);
    event RecipientRemoved(address indexed recipient);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    // Donate to random verified recipient
    function donateRandom() external payable {
        require(msg.value >= 0.0003 ether, "Minimum 0.0003 ETH");
        require(recipientList.length > 0, "No recipients available");
        
        // Simple random selection
        uint256 randomIndex = uint256(
            keccak256(abi.encodePacked(block.timestamp, msg.sender, block.prevrandao))
        ) % recipientList.length;
        
        address recipient = recipientList[randomIndex];
        
        // Transfer to recipient
        (bool success, ) = payable(recipient).call{value: msg.value}("");
        require(success, "Transfer failed");
        
        // Update stats
        donorTotals[msg.sender] += msg.value;
        recipientTotals[recipient] += msg.value;
        donorCounts[msg.sender] += 1;
        totalDonated += msg.value;
        totalDonationCount += 1;
        
        emit DonationMade(msg.sender, recipient, msg.value, block.timestamp);
    }
    
    // Add verified recipient (admin only)
    function addVerifiedRecipient(address _recipient) external onlyOwner {
        require(_recipient != address(0), "Invalid address");
        require(!verifiedRecipients[_recipient], "Already verified");
        
        verifiedRecipients[_recipient] = true;
        recipientList.push(_recipient);
        
        emit RecipientVerified(_recipient);
    }
    
    // Remove recipient (admin only)
    function removeRecipient(address _recipient) external onlyOwner {
        require(verifiedRecipients[_recipient], "Not verified");
        
        verifiedRecipients[_recipient] = false;
        
        // Remove from list
        for (uint256 i = 0; i < recipientList.length; i++) {
            if (recipientList[i] == _recipient) {
                recipientList[i] = recipientList[recipientList.length - 1];
                recipientList.pop();
                break;
            }
        }
        
        emit RecipientRemoved(_recipient);
    }
    
    // Get donor stats
    function getDonorStats(address _donor) external view returns (
        uint256 totalDonated_,
        uint256 donationCount_,
        uint256 rank_
    ) {
        totalDonated_ = donorTotals[_donor];
        donationCount_ = donorCounts[_donor];
        rank_ = calculateRank(_donor);
    }
    
    // Calculate donor rank (simplified for gas efficiency)
    function calculateRank(address _donor) public view returns (uint256) {
        uint256 donorTotal = donorTotals[_donor];
        if (donorTotal == 0) return 0;
        
        uint256 rank = 1;
        
        // Count how many have donated more (check up to 100 addresses)
        uint256 checkLimit = recipientList.length < 100 ? recipientList.length : 100;
        for (uint256 i = 0; i < checkLimit; i++) {
            if (donorTotals[recipientList[i]] > donorTotal) {
                rank++;
            }
        }
        
        return rank;
    }
    
    // Get recipient count
    function getRecipientCount() external view returns (uint256) {
        return recipientList.length;
    }
    
    // Get all recipients
    function getAllRecipients() external view returns (address[] memory) {
        return recipientList;
    }
    
    // Get platform stats
    function getPlatformStats() external view returns (
        uint256 totalDonated_,
        uint256 totalDonationCount_,
        uint256 recipientCount_
    ) {
        totalDonated_ = totalDonated;
        totalDonationCount_ = totalDonationCount;
        recipientCount_ = recipientList.length;
    }
}