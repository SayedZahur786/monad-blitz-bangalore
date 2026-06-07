// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {ClaimRegistry} from "../src/ClaimRegistry.sol";

contract Deploy is Script {
    function run() external returns (ClaimRegistry registry) {
        vm.startBroadcast();
        registry = new ClaimRegistry();
        console.log("ClaimRegistry deployed at:", address(registry));
        vm.stopBroadcast();
    }
}
