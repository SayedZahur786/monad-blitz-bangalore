// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {ClaimRegistry} from "../src/ClaimRegistry.sol";

contract ClaimRegistryTest is Test {
    ClaimRegistry registry;

    bytes32 constant CLAIM_ID = keccak256("CLM-2026-0001");
    bytes32 constant REASONS_HASH = keccak256("decision=Approved|reasons=...");

    function setUp() public {
        registry = new ClaimRegistry();
    }

    function test_LogAndFetch() public {
        registry.logDecision(CLAIM_ID, ClaimRegistry.Decision.Approved, 92, REASONS_HASH, "Hospital Claim | Rs 45000");

        ClaimRegistry.ClaimRecord memory r = registry.getRecord(CLAIM_ID);
        assertEq(uint8(r.decision), uint8(ClaimRegistry.Decision.Approved));
        assertEq(r.confidence, 92);
        assertEq(r.reasonsHash, REASONS_HASH);
        assertEq(r.submitter, address(this));
        assertTrue(r.timestamp != 0);
        assertEq(registry.totalClaims(), 1);
        assertTrue(registry.exists(CLAIM_ID));
        assertTrue(registry.verifyReasons(CLAIM_ID, REASONS_HASH));
        assertFalse(registry.verifyReasons(CLAIM_ID, keccak256("tampered")));
    }

    function test_RevertOnDuplicate() public {
        registry.logDecision(CLAIM_ID, ClaimRegistry.Decision.Approved, 92, REASONS_HASH, "x");
        vm.expectRevert(abi.encodeWithSelector(ClaimRegistry.ClaimAlreadyExists.selector, CLAIM_ID));
        registry.logDecision(CLAIM_ID, ClaimRegistry.Decision.Rejected, 10, REASONS_HASH, "x");
    }

    function test_RevertOnUnsetDecision() public {
        vm.expectRevert(ClaimRegistry.InvalidDecision.selector);
        registry.logDecision(CLAIM_ID, ClaimRegistry.Decision.Unset, 50, REASONS_HASH, "x");
    }

    function test_RevertOnBadConfidence() public {
        vm.expectRevert(ClaimRegistry.InvalidConfidence.selector);
        registry.logDecision(CLAIM_ID, ClaimRegistry.Decision.Approved, 101, REASONS_HASH, "x");
    }

    function test_RecentPagination() public {
        for (uint256 i = 0; i < 5; i++) {
            registry.logDecision(
                keccak256(abi.encodePacked("CLM", i)),
                ClaimRegistry.Decision.Partial,
                50,
                REASONS_HASH,
                "x"
            );
        }
        bytes32[] memory page = registry.recentClaimIds(0, 3);
        assertEq(page.length, 3);
        // newest first
        assertEq(page[0], keccak256(abi.encodePacked("CLM", uint256(4))));
        assertEq(page[2], keccak256(abi.encodePacked("CLM", uint256(2))));
    }
}
