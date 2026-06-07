// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title ClaimTrust India — ClaimRegistry
/// @notice Immutable, on-chain audit trail for AI-driven health-insurance claim
///         decisions. Every decision made by the ClaimTrust AI agent is hashed
///         together with its plain-language reasons and committed here, so the
///         decision can be independently verified and can never be silently
///         altered after the fact. This is what turns an opaque "black-box" AI
///         decision into a transparent, tamper-evident record (IRDAI-friendly).
/// @dev    The full reasons text lives off-chain (in the app / report). On-chain
///         we store only a keccak256 commitment of the canonical decision payload
///         plus light metadata, which keeps gas low while remaining verifiable:
///         anyone can re-hash the published decision JSON and compare.
contract ClaimRegistry {
    /// @notice Decision outcomes. 0 is reserved as "unset" so we can detect
    ///         whether a claimId has been recorded.
    enum Decision {
        Unset, // 0 - never recorded
        Approved, // 1
        Rejected, // 2
        Partial // 3
    }

    struct ClaimRecord {
        bytes32 claimId; // app-level unique id, e.g. keccak256("CLM-...")
        address submitter; // address that committed the record
        Decision decision; // final outcome
        uint16 confidence; // AI confidence, 0..100 (percent)
        bytes32 reasonsHash; // keccak256 of canonical decision+reasons payload
        uint64 timestamp; // block timestamp at commit
        string metadataURI; // short human-readable summary (claim type, amount, ABHA-masked)
    }

    /// @dev claimId => record
    mapping(bytes32 => ClaimRecord) private _records;

    /// @dev append-only list of all recorded claim ids, for enumeration
    bytes32[] private _claimIds;

    /// @notice Emitted once per claim decision. Indexers / explorers use this as
    ///         the canonical audit-trail event.
    event ClaimDecisionLogged(
        bytes32 indexed claimId,
        address indexed submitter,
        Decision decision,
        uint16 confidence,
        bytes32 reasonsHash,
        uint64 timestamp,
        string metadataURI
    );

    error ClaimAlreadyExists(bytes32 claimId);
    error ClaimNotFound(bytes32 claimId);
    error InvalidDecision();
    error InvalidConfidence();

    /// @notice Commit an AI claim decision to the immutable audit trail.
    /// @param claimId      Unique id for this claim (revert if already recorded).
    /// @param decision     1=Approved, 2=Rejected, 3=Partial.
    /// @param confidence   AI confidence in percent (0..100).
    /// @param reasonsHash  keccak256 of the canonical decision+reasons payload.
    /// @param metadataURI  Short human-readable summary of inputs used.
    /// @return index       Position of this record in the global list.
    function logDecision(
        bytes32 claimId,
        Decision decision,
        uint16 confidence,
        bytes32 reasonsHash,
        string calldata metadataURI
    ) external returns (uint256 index) {
        if (_records[claimId].timestamp != 0) revert ClaimAlreadyExists(claimId);
        if (decision == Decision.Unset) revert InvalidDecision();
        if (confidence > 100) revert InvalidConfidence();

        _records[claimId] = ClaimRecord({
            claimId: claimId,
            submitter: msg.sender,
            decision: decision,
            confidence: confidence,
            reasonsHash: reasonsHash,
            timestamp: uint64(block.timestamp),
            metadataURI: metadataURI
        });

        index = _claimIds.length;
        _claimIds.push(claimId);

        emit ClaimDecisionLogged(
            claimId, msg.sender, decision, confidence, reasonsHash, uint64(block.timestamp), metadataURI
        );
    }

    /// @notice Fetch a single recorded claim. Reverts if not found.
    function getRecord(bytes32 claimId) external view returns (ClaimRecord memory) {
        ClaimRecord memory r = _records[claimId];
        if (r.timestamp == 0) revert ClaimNotFound(claimId);
        return r;
    }

    /// @notice Whether a claimId has been recorded.
    function exists(bytes32 claimId) external view returns (bool) {
        return _records[claimId].timestamp != 0;
    }

    /// @notice Verify a published decision payload against the on-chain commitment.
    /// @dev    Off-chain, hash the exact canonical payload string with keccak256
    ///         and pass it here; returns true iff it matches what was recorded.
    function verifyReasons(bytes32 claimId, bytes32 reasonsHash) external view returns (bool) {
        return _records[claimId].timestamp != 0 && _records[claimId].reasonsHash == reasonsHash;
    }

    /// @notice Total number of recorded claims.
    function totalClaims() external view returns (uint256) {
        return _claimIds.length;
    }

    /// @notice Claim id at a given index in the global list.
    function claimIdAt(uint256 index) external view returns (bytes32) {
        return _claimIds[index];
    }

    /// @notice Paginated reverse-chronological listing of recent claim ids.
    /// @param offset Number of most-recent records to skip.
    /// @param limit  Max records to return.
    function recentClaimIds(uint256 offset, uint256 limit) external view returns (bytes32[] memory page) {
        uint256 total = _claimIds.length;
        if (offset >= total) return new bytes32[](0);
        uint256 remaining = total - offset;
        uint256 n = remaining < limit ? remaining : limit;
        page = new bytes32[](n);
        // newest first
        for (uint256 i = 0; i < n; i++) {
            page[i] = _claimIds[total - 1 - offset - i];
        }
    }
}
