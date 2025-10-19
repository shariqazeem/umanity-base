// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
}

contract UmanityDonations {
    address public owner;
    address public usdcToken;
    
    // Pool types
    enum PoolType { EDUCATION, HEALTHCARE, EMERGENCY }
    
    // Pool structure
    struct Pool {
        string name;
        uint256 totalDonated;
        uint256 totalWithdrawn;
        bool active;
    }
    
    // Pools
    mapping(PoolType => Pool) public pools;
    
    // Verified recipients
    mapping(address => bool) public verifiedRecipients;
    address[] public recipientList;
    
    // Recipient applications
    struct Application {
        address applicant;
        string name;
        string story;
        string proofUrl;
        uint256 timestamp;
        bool approved;
        bool rejected;
    }
    
    mapping(address => Application) public applications;
    address[] public pendingApplications;
    
    // Donation tracking (in USDC, 6 decimals)
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
    
    event PoolDonation(
        address indexed donor,
        PoolType indexed poolType,
        uint256 amount,
        uint256 timestamp
    );
    
    event RecipientVerified(address indexed recipient);
    event RecipientRemoved(address indexed recipient);
    event ApplicationSubmitted(address indexed applicant, uint256 timestamp);
    event ApplicationApproved(address indexed applicant);
    event ApplicationRejected(address indexed applicant);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    constructor(address _usdcToken) {
        owner = msg.sender;
        usdcToken = _usdcToken;
        
        // Initialize pools
        pools[PoolType.EDUCATION] = Pool("Education Fund", 0, 0, true);
        pools[PoolType.HEALTHCARE] = Pool("Healthcare Fund", 0, 0, true);
        pools[PoolType.EMERGENCY] = Pool("Emergency Relief", 0, 0, true);
    }
    
    // Donate USDC to random verified recipient
    function donateRandom(uint256 amount) external {
        require(amount >= 1000000, "Minimum 1 USDC");
        require(recipientList.length > 0, "No recipients available");
        
        // Random selection
        uint256 randomIndex = uint256(
            keccak256(abi.encodePacked(block.timestamp, msg.sender, block.prevrandao))
        ) % recipientList.length;
        
        address recipient = recipientList[randomIndex];
        
        // Transfer USDC from donor to recipient
        require(
            IERC20(usdcToken).transferFrom(msg.sender, recipient, amount),
            "Transfer failed"
        );
        
        // Update stats
        donorTotals[msg.sender] += amount;
        recipientTotals[recipient] += amount;
        donorCounts[msg.sender] += 1;
        totalDonated += amount;
        totalDonationCount += 1;
        
        emit DonationMade(msg.sender, recipient, amount, block.timestamp);
    }
    
    // Donate to specific pool
    function donateToPool(PoolType poolType, uint256 amount) external {
        require(amount >= 1000000, "Minimum 1 USDC");
        require(pools[poolType].active, "Pool not active");
        
        // Transfer USDC to contract
        require(
            IERC20(usdcToken).transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );
        
        // Update pool and donor stats
        pools[poolType].totalDonated += amount;
        donorTotals[msg.sender] += amount;
        donorCounts[msg.sender] += 1;
        totalDonated += amount;
        totalDonationCount += 1;
        
        emit PoolDonation(msg.sender, poolType, amount, block.timestamp);
    }
    
    // Apply to become a verified recipient
    function applyAsRecipient(
        string memory name,
        string memory story,
        string memory proofUrl
    ) external {
        require(!verifiedRecipients[msg.sender], "Already verified");
        require(applications[msg.sender].timestamp == 0, "Already applied");
        
        applications[msg.sender] = Application({
            applicant: msg.sender,
            name: name,
            story: story,
            proofUrl: proofUrl,
            timestamp: block.timestamp,
            approved: false,
            rejected: false
        });
        
        pendingApplications.push(msg.sender);
        
        emit ApplicationSubmitted(msg.sender, block.timestamp);
    }
    
    // Approve recipient application (admin only)
    function approveApplication(address applicant) external onlyOwner {
        require(applications[applicant].timestamp > 0, "No application");
        require(!applications[applicant].approved, "Already approved");
        require(!applications[applicant].rejected, "Already rejected");
        
        applications[applicant].approved = true;
        verifiedRecipients[applicant] = true;
        recipientList.push(applicant);
        
        // Remove from pending
        _removePendingApplication(applicant);
        
        emit ApplicationApproved(applicant);
        emit RecipientVerified(applicant);
    }
    
    // Reject recipient application (admin only)
    function rejectApplication(address applicant) external onlyOwner {
        require(applications[applicant].timestamp > 0, "No application");
        require(!applications[applicant].approved, "Already approved");
        require(!applications[applicant].rejected, "Already rejected");
        
        applications[applicant].rejected = true;
        
        // Remove from pending
        _removePendingApplication(applicant);
        
        emit ApplicationRejected(applicant);
    }
    
    // Withdraw from pool (admin only)
    function withdrawFromPool(
        PoolType poolType,
        address recipient,
        uint256 amount
    ) external onlyOwner {
        require(pools[poolType].active, "Pool not active");
        uint256 available = pools[poolType].totalDonated - pools[poolType].totalWithdrawn;
        require(amount <= available, "Insufficient pool balance");
        
        pools[poolType].totalWithdrawn += amount;
        
        require(
            IERC20(usdcToken).transfer(recipient, amount),
            "Transfer failed"
        );
    }
    
    // Remove pending application helper
    function _removePendingApplication(address applicant) internal {
        for (uint256 i = 0; i < pendingApplications.length; i++) {
            if (pendingApplications[i] == applicant) {
                pendingApplications[i] = pendingApplications[pendingApplications.length - 1];
                pendingApplications.pop();
                break;
            }
        }
    }
    
    // Add verified recipient manually (admin only - backward compatibility)
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
    
    // Calculate donor rank
    function calculateRank(address _donor) public view returns (uint256) {
        uint256 donorTotal = donorTotals[_donor];
        if (donorTotal == 0) return 0;
        
        uint256 rank = 1;
        uint256 checkLimit = recipientList.length < 100 ? recipientList.length : 100;
        
        for (uint256 i = 0; i < checkLimit; i++) {
            if (donorTotals[recipientList[i]] > donorTotal) {
                rank++;
            }
        }
        
        return rank;
    }
    
    // Get pool info
    function getPoolInfo(PoolType poolType) external view returns (
        string memory name,
        uint256 totalDonated_,
        uint256 totalWithdrawn_,
        uint256 available,
        bool active
    ) {
        Pool memory pool = pools[poolType];
        return (
            pool.name,
            pool.totalDonated,
            pool.totalWithdrawn,
            pool.totalDonated - pool.totalWithdrawn,
            pool.active
        );
    }
    
    // Get all pools
    function getAllPools() external view returns (
        string[3] memory names,
        uint256[3] memory totals,
        uint256[3] memory available
    ) {
        for (uint256 i = 0; i < 3; i++) {
            PoolType poolType = PoolType(i);
            Pool memory pool = pools[poolType];
            names[i] = pool.name;
            totals[i] = pool.totalDonated;
            available[i] = pool.totalDonated - pool.totalWithdrawn;
        }
    }
    
    // Get recipient count
    function getRecipientCount() external view returns (uint256) {
        return recipientList.length;
    }
    
    // Get all recipients
    function getAllRecipients() external view returns (address[] memory) {
        return recipientList;
    }
    
    // Get pending applications
    function getPendingApplications() external view returns (address[] memory) {
        return pendingApplications;
    }
    
    // Get application details
    function getApplication(address applicant) external view returns (
        string memory name,
        string memory story,
        string memory proofUrl,
        uint256 timestamp,
        bool approved,
        bool rejected
    ) {
        Application memory app = applications[applicant];
        return (app.name, app.story, app.proofUrl, app.timestamp, app.approved, app.rejected);
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