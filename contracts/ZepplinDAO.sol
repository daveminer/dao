// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.0;

// import "@openzeppelin/contracts/governance/Governor.sol";
// import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
// import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
// import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
// import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
// import "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";
// import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
// import "@openzeppelin/contracts/access/Ownable.sol";
// import "@openzeppelin/contracts/governance/TimelockController.sol";

// /**
//  * @title ZeppelinDAO
//  * @dev A complete DAO implementation using OpenZeppelin's governance contracts
//  */
// contract ZeppelinDAO is 
//     Governor, 
//     GovernorSettings, 
//     GovernorCountingSimple, 
//     GovernorVotes, 
//     GovernorVotesQuorumFraction, 
//     GovernorTimelockControl 
// {
//     constructor(
//         IVotes _token,
//         TimelockController _timelock,
//         uint256 _quorumPercentage,
//         uint256 _votingDelay,
//         uint256 _votingPeriod,
//         uint256 _proposalThreshold
//     )
//         Governor("ZeppelinDAO")
//         GovernorSettings(uint32(_votingDelay), uint32(_votingPeriod), uint256(_proposalThreshold))
//         GovernorVotes(_token)
//         GovernorVotesQuorumFraction(_quorumPercentage)
//         GovernorTimelockControl(_timelock)
//     {}

//     // The following functions are overrides required by Solidity.

//     function votingDelay()
//         public
//         view
//         override(Governor, GovernorSettings)
//         returns (uint256)
//     {
//         return super.votingDelay();
//     }

//     function votingPeriod()
//         public
//         view
//         override(Governor, GovernorSettings)
//         returns (uint256)
//     {
//         return super.votingPeriod();
//     }

//     function quorum(uint256 blockNumber)
//         public
//         view
//         override(Governor, GovernorVotesQuorumFraction)
//         returns (uint256)
//     {
//         return super.quorum(blockNumber);
//     }

//     function state(uint256 proposalId)
//         public
//         view
//         override(Governor, GovernorTimelockControl)
//         returns (ProposalState)
//     {
//         return super.state(proposalId);
//     }

//     function propose(address[] memory targets, uint256[] memory values, bytes[] memory calldatas, string memory description)
//         public
//         override(Governor)
//         returns (uint256)
//     {
//         return super.propose(targets, values, calldatas, description);
//     }

//     function proposalThreshold()
//         public
//         view
//         override(Governor, GovernorSettings)
//         returns (uint256)
//     {
//         return super.proposalThreshold();
//     }

//     function _cancel(address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash)
//         internal
//         override(Governor, GovernorTimelockControl)
//         returns (uint256)
//     {
//         return super._cancel(targets, values, calldatas, descriptionHash);
//     }

//     function _executor()
//         internal
//         view
//         override(Governor, GovernorTimelockControl)
//         returns (address)
//     {
//         return super._executor();
//     }

//     function supportsInterface(bytes4 interfaceId)
//         public
//         view
//         override(Governor)
//         returns (bool)
//     {
//         return super.supportsInterface(interfaceId);
//     }

//     function _executeOperations(
//         uint256 proposalId,
//         address[] memory targets,
//         uint256[] memory values,
//         bytes[] memory calldatas,
//         bytes32 descriptionHash
//     ) internal override(Governor, GovernorTimelockControl) {
//         super._executeOperations(proposalId, targets, values, calldatas, descriptionHash);
//     }

//     function _queueOperations(
//         uint256 proposalId,
//         address[] memory targets,
//         uint256[] memory values,
//         bytes[] memory calldatas,
//         bytes32 descriptionHash
//     ) internal override(Governor, GovernorTimelockControl) returns (uint48) {
//         return super._queueOperations(proposalId, targets, values, calldatas, descriptionHash);
//     }

//     function proposalNeedsQueuing(uint256 proposalId)
//         public
//         view
//         override(Governor, GovernorTimelockControl)
//         returns (bool)
//     {
//         return super.proposalNeedsQueuing(proposalId);
//     }
// }
