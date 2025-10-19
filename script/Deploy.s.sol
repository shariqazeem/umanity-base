// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/UmanityDonations.sol";

contract DeployScript is Script {
    function run() external {
        // Use msg.sender (from --account flag) instead of environment variable
        vm.startBroadcast();

        // Deploy contract
        UmanityDonations donations = new UmanityDonations();
        
        console.log("UmanityDonations deployed to:", address(donations));

        // Add test recipients (with EXACT correct checksums)
        address[] memory testRecipients = new address[](3);
        testRecipients[0] = 0x742D35CC6634c0532925A3b844BC9E7595F0BEb0;
        testRecipients[1] = 0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed;
        testRecipients[2] = 0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359;

        for (uint256 i = 0; i < testRecipients.length; i++) {
            donations.addVerifiedRecipient(testRecipients[i]);
            console.log("Added recipient:", testRecipients[i]);
        }

        console.log("\n=== Deployment Complete ===");
        console.log("Add this to your .env.local:");
        console.log("NEXT_PUBLIC_CONTRACT_ADDRESS=%s", address(donations));

        vm.stopBroadcast();
    }
}