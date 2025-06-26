// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.0;

// import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
// import "@openzeppelin/contracts/access/Ownable.sol";

// /**
//  * @title GovernanceToken
//  * @dev ERC20 token with voting power for the DAO
//  */
// contract GovernanceToken is ERC20, Ownable {
//     constructor() ERC20("GovernanceToken", "GT") Ownable(msg.sender) {
//         _mint(msg.sender, 1000000 * 10 ** decimals());
        
//         uint256 chainId;
//         assembly {
//             chainId := chainid()
//         }
//         DOMAIN_SEPARATOR = keccak256(
//             abi.encode(
//                 keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
//                 keccak256(bytes(name())),
//                 keccak256(bytes("1")),
//                 chainId,
//                 address(this)
//             )
//         );
//     }

//     function mint(address to, uint256 amount) public onlyOwner {
//         _mint(to, amount);
//     }

//     function _delegate(address delegator, address delegatee)
//         internal
//     {
//         address currentDelegate = delegates(delegator);
//         uint256 delegatorBalance = balanceOf(delegator);
//         _delegates[delegator] = delegatee;

//         emit DelegateChanged(delegator, currentDelegate, delegatee);

//         _moveDelegates(currentDelegate, delegatee, delegatorBalance);
//     }

//     function _moveDelegates(address srcRep, address dstRep, uint256 amount) internal {
//         if (srcRep != dstRep && amount > 0) {
//             if (srcRep != address(0)) {
//                 uint256 srcRepNum = numCheckpoints[srcRep];
//                 uint256 srcRepOld = srcRepNum > 0 ? checkpoints[srcRep][srcRepNum - 1].votes : 0;
//                 uint256 srcRepNew = srcRepOld - amount;
//                 _writeCheckpoint(srcRep, srcRepNum, srcRepOld, srcRepNew);
//             }

//             if (dstRep != address(0)) {
//                 uint256 dstRepNum = numCheckpoints[dstRep];
//                 uint256 dstRepOld = dstRepNum > 0 ? checkpoints[dstRep][dstRepNum - 1].votes : 0;
//                 uint256 dstRepNew = dstRepOld + amount;
//                 _writeCheckpoint(dstRep, dstRepNum, dstRepOld, dstRepNew);
//             }
//         }
//     }

//     function _writeCheckpoint(address delegatee, uint256 nCheckpoints, uint256 oldVotes, uint256 newVotes) internal {
//         uint256 blockNumber = block.number;

//         if (nCheckpoints > 0 && checkpoints[delegatee][nCheckpoints - 1].fromBlock == blockNumber) {
//             checkpoints[delegatee][nCheckpoints - 1].votes = uint96(newVotes);
//         } else {
//             checkpoints[delegatee][nCheckpoints] = Checkpoint(uint32(blockNumber), uint96(newVotes));
//             numCheckpoints[delegatee] = nCheckpoints + 1;
//         }

//         emit DelegateVotesChanged(delegatee, oldVotes, newVotes);
//     }

//     function delegates(address account) public view returns (address) {
//         return _delegates[account];
//     }

//     function delegate(address delegatee) public {
//         return _delegate(msg.sender, delegatee);
//     }

//     function delegateBySig(address delegatee, uint256 nonce, uint256 expiry, uint8 v, bytes32 r, bytes32 s) public {
//         require(block.timestamp <= expiry, "GovernanceToken::delegateBySig: signature expired");
//         bytes32 structHash = keccak256(abi.encode(DELEGATION_TYPEHASH, delegatee, nonce, expiry));
//         bytes32 hash = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash));
//         address signer = ecrecover(hash, v, r, s);
//         require(signer != address(0), "GovernanceToken::delegateBySig: invalid signature");
//         require(nonce == nonces[signer]++, "GovernanceToken::delegateBySig: invalid nonce");
//         return _delegate(signer, delegatee);
//     }

//     function getCurrentVotes(address account) external view returns (uint256) {
//         uint256 nCheckpoints = numCheckpoints[account];
//         return nCheckpoints > 0 ? checkpoints[account][nCheckpoints - 1].votes : 0;
//     }

//     function getPriorVotes(address account, uint256 blockNumber) public view returns (uint256) {
//         require(blockNumber < block.number, "GovernanceToken::getPriorVotes: not yet determined");

//         uint256 nCheckpoints = numCheckpoints[account];
//         if (nCheckpoints == 0) {
//             return 0;
//         }

//         if (checkpoints[account][nCheckpoints - 1].fromBlock <= blockNumber) {
//             return checkpoints[account][nCheckpoints - 1].votes;
//         }

//         if (checkpoints[account][0].fromBlock > blockNumber) {
//             return 0;
//         }

//         uint256 lower = 0;
//         uint256 upper = nCheckpoints - 1;
//         while (upper > lower) {
//             uint256 center = upper - (upper - lower) / 2;
//             Checkpoint memory cp = checkpoints[account][center];
//             if (cp.fromBlock == blockNumber) {
//                 return cp.votes;
//             } else if (cp.fromBlock < blockNumber) {
//                 lower = center;
//             } else {
//                 upper = center - 1;
//             }
//         }
//         return checkpoints[account][lower].votes;
//     }

//     mapping(address => address) internal _delegates;
//     mapping(address => mapping(uint256 => Checkpoint)) public checkpoints;
//     mapping(address => uint256) public numCheckpoints;
//     mapping(address => uint256) public nonces;

//     struct Checkpoint {
//         uint32 fromBlock;
//         uint96 votes;
//     }

//     bytes32 public constant DELEGATION_TYPEHASH = keccak256("Delegation(address delegatee,uint256 nonce,uint256 expiry)");
//     bytes32 public DOMAIN_SEPARATOR;

//     event DelegateChanged(address indexed delegator, address indexed fromDelegate, address indexed toDelegate);
//     event DelegateVotesChanged(address indexed delegate, uint256 previousBalance, uint256 newBalance);
// } 