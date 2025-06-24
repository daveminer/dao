//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Token.sol";

contract DAO {
    address owner;
    Token public token;
    uint256 public quorum;

    struct Proposal {
        uint256 id;
        string name;
        uint256 amount;
        address payable recipient;
        uint256 votes;
        uint256 downVotes;
        bool finalized;
        string description;
    }

    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    mapping(address => mapping(uint256 => bool)) public votes;
    mapping(address => mapping(uint256 => bool)) public downVotes;

    event Propose(
        uint id,
        uint256 amount,
        address recipient,
        address creator
    );

    event Vote(
        uint256 id,
        address investor,
        bool isUpvote
    );

    event Finalize(
        uint256 id
    );

    constructor(Token _token, uint256 _quorum) {
        owner = msg.sender;
        token = _token;
        quorum = _quorum;
    }

    receive() external payable {
        // Function to receive ETH
    }

    modifier onlyInvestor() {
        require(Token(token).balanceOf(msg.sender) > 0, "must be token holder");
        _;
    }

    function createProposal(string memory _name, uint256 _amount, address payable _recipient, string memory _description) external onlyInvestor {
        require(address(this).balance >= _amount, "Not enough balance");
        
        proposalCount++;

        proposals[proposalCount] = Proposal(
            proposalCount,
            _name,
            _amount,
            _recipient,
            0,
            0,
            false,
            _description
        );

        emit Propose(proposalCount, _amount, _recipient, msg.sender);
    }

    function vote(uint256 _id, bool _isUpvote) external onlyInvestor {
        Proposal storage proposal = proposals[_id];

        require(!votes[msg.sender][_id], "already voted");
        require(!downVotes[msg.sender][_id], "already down voted");

        if (_isUpvote) {
            proposal.votes = proposal.votes + token.balanceOf(msg.sender);
            votes[msg.sender][_id] = true;
        } else {
            proposal.downVotes = proposal.downVotes + token.balanceOf(msg.sender);
            downVotes[msg.sender][_id] = true;
        }

        emit Vote(_id, msg.sender, _isUpvote);
    }

    function finalizeProposal(uint256 _id) external onlyInvestor {
        Proposal storage proposal = proposals[_id];

        require(!proposal.finalized, "proposal already finalized");
        proposal.finalized = true;

        require(proposal.votes - proposal.downVotes > quorum, "must reach quorum to finalize proposal");
   
        (bool sent, ) = proposal.recipient.call{value: proposal.amount}("");
        require(sent, "Failed to send Ether");

        emit Finalize(_id);
    }
}
