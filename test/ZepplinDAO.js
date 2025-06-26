// const { expect } = require('chai')
// const { ethers } = require('hardhat')

// const tokens = (n) => {
//   return ethers.utils.parseUnits(n.toString(), 'ether')
// }

// describe('ZeppelinDAO', () => {
//   let governanceToken, dao, timelock

//   let deployer,
//     proposer,
//     executor,
//     voter1,
//     voter2,
//     voter3,
//     voter4,
//     voter5,
//     recipient,
//     user1

//   beforeEach(async () => {
//     // Set up accounts
//     let accounts = await ethers.getSigners()
//     deployer = accounts[0]
//     proposer = accounts[1]
//     executor = accounts[2]
//     voter1 = accounts[3]
//     voter2 = accounts[4]
//     voter3 = accounts[5]
//     voter4 = accounts[6]
//     voter5 = accounts[7]
//     recipient = accounts[8]
//     user1 = accounts[9]

//     // Deploy GovernanceToken
//     const GovernanceToken = await ethers.getContractFactory('GovernanceToken')
//     governanceToken = await GovernanceToken.deploy()

//     // Send tokens to voters
//     await governanceToken.transfer(voter1.address, tokens(200000))
//     await governanceToken.transfer(voter2.address, tokens(200000))
//     await governanceToken.transfer(voter3.address, tokens(200000))
//     await governanceToken.transfer(voter4.address, tokens(200000))
//     await governanceToken.transfer(voter5.address, tokens(200000))

//     // Deploy TimelockController
//     const minDelay = 0 // For testing, no delay
//     const proposers = [proposer.address]
//     const executors = [executor.address]
//     const admin = deployer.address

//     const TimelockController = await ethers.getContractFactory(
//       'TimelockController'
//     )
//     timelock = await TimelockController.deploy(
//       minDelay,
//       proposers,
//       executors,
//       admin
//     )

//     // Deploy ZeppelinDAO
//     const quorumPercentage = 4 // 4%
//     const votingDelay = 1 // 1 block
//     const votingPeriod = 45818 // ~1 week
//     const proposalThreshold = tokens(1000) // 1000 tokens to propose

//     const ZeppelinDAO = await ethers.getContractFactory('ZeppelinDAO')
//     dao = await ZeppelinDAO.deploy(
//       governanceToken.address,
//       timelock.address,
//       quorumPercentage,
//       votingDelay,
//       votingPeriod,
//       proposalThreshold
//     )

//     // Grant proposer role to DAO
//     await timelock.grantRole(await timelock.PROPOSER_ROLE(), dao.address)
//     // Grant executor role to DAO
//     await timelock.grantRole(await timelock.EXECUTOR_ROLE(), dao.address)
//     // Revoke admin role from deployer
//     await timelock.revokeRole(
//       await timelock.DEFAULT_ADMIN_ROLE(),
//       deployer.address
//     )
//   })

//   describe('Deployment', () => {
//     it('deploys governance token correctly', async () => {
//       expect(await governanceToken.name()).to.equal('GovernanceToken')
//       expect(await governanceToken.symbol()).to.equal('GT')
//       expect(await governanceToken.totalSupply()).to.equal(tokens(1000000))
//     })

//     it('deploys timelock correctly', async () => {
//       expect(await timelock.getMinDelay()).to.equal(0)
//     })

//     it('deploys DAO with correct parameters', async () => {
//       expect(await dao.name()).to.equal('ZeppelinDAO')
//       expect(await dao.votingDelay()).to.equal(1)
//       expect(await dao.votingPeriod()).to.equal(45818)
//       expect(await dao.proposalThreshold()).to.equal(tokens(1000))
//     })

//     it('sets up token delegation correctly', async () => {
//       // Voters should delegate to themselves by default
//       expect(await governanceToken.delegates(voter1.address)).to.equal(
//         voter1.address
//       )
//     })
//   })

//   describe('Token delegation', () => {
//     it('allows users to delegate their voting power', async () => {
//       await governanceToken.connect(voter1).delegate(voter2.address)
//       expect(await governanceToken.delegates(voter1.address)).to.equal(
//         voter2.address
//       )
//     })

//     it('updates voting power after delegation', async () => {
//       await governanceToken.connect(voter1).delegate(voter2.address)
//       expect(await governanceToken.getCurrentVotes(voter2.address)).to.equal(
//         tokens(400000)
//       ) // voter1 + voter2
//     })
//   })

//   describe('Proposal creation', () => {
//     let targets, values, calldatas, description

//     beforeEach(async () => {
//       // Prepare proposal data
//       targets = [recipient.address]
//       values = [0]
//       calldatas = ['0x'] // Empty calldata
//       description = 'Test proposal'
//     })

//     describe('Success', () => {
//       it('creates a proposal when threshold is met', async () => {
//         const tx = await dao
//           .connect(voter1)
//           .propose(targets, values, calldatas, description)
//         const receipt = await tx.wait()

//         // Get proposal ID from event
//         const event = receipt.events?.find((e) => e.event === 'ProposalCreated')
//         const proposalId = event.args.proposalId

//         expect(await dao.proposalCount()).to.equal(1)
//         expect(await dao.state(proposalId)).to.equal(0) // Pending
//       })

//       it('emits ProposalCreated event', async () => {
//         await expect(
//           dao.connect(voter1).propose(targets, values, calldatas, description)
//         )
//           .to.emit(dao, 'ProposalCreated')
//           .withArgs(
//             ethers.utils.keccak256(ethers.utils.toUtf8Bytes(description)),
//             voter1.address,
//             targets,
//             values,
//             calldatas,
//             description
//           )
//       })
//     })

//     describe('Failure', () => {
//       it('rejects proposal from user below threshold', async () => {
//         await expect(
//           dao.connect(user1).propose(targets, values, calldatas, description)
//         ).to.be.revertedWith(
//           'Governor: proposer votes below proposal threshold'
//         )
//       })

//       it('rejects proposal with mismatched arrays', async () => {
//         const wrongTargets = [recipient.address, recipient.address]
//         await expect(
//           dao
//             .connect(voter1)
//             .propose(wrongTargets, values, calldatas, description)
//         ).to.be.revertedWith('Governor: invalid proposal length')
//       })
//     })
//   })

//   describe('Voting', () => {
//     let proposalId

//     beforeEach(async () => {
//       // Create a proposal
//       const targets = [recipient.address]
//       const values = [0]
//       const calldatas = ['0x']
//       const description = 'Test proposal for voting'

//       const tx = await dao
//         .connect(voter1)
//         .propose(targets, values, calldatas, description)
//       const receipt = await tx.wait()
//       const event = receipt.events?.find((e) => e.event === 'ProposalCreated')
//       proposalId = event.args.proposalId

//       // Wait for voting delay
//       await ethers.provider.send('evm_mine')
//     })

//     describe('Success', () => {
//       it('allows voting on active proposal', async () => {
//         await dao.connect(voter1).castVote(proposalId, 1) // For
//         await dao.connect(voter2).castVote(proposalId, 0) // Against
//         await dao.connect(voter3).castVote(proposalId, 2) // Abstain

//         expect(await dao.state(proposalId)).to.equal(1) // Active
//       })

//       it('emits VoteCast event', async () => {
//         await expect(dao.connect(voter1).castVote(proposalId, 1))
//           .to.emit(dao, 'VoteCast')
//           .withArgs(voter1.address, proposalId, 1, tokens(200000), '')
//       })

//       it('prevents double voting', async () => {
//         await dao.connect(voter1).castVote(proposalId, 1)

//         await expect(
//           dao.connect(voter1).castVote(proposalId, 0)
//         ).to.be.revertedWith(
//           'GovernorCountingSimple: vote not currently active'
//         )
//       })
//     })

//     describe('Failure', () => {
//       it('rejects voting on inactive proposal', async () => {
//         await expect(dao.connect(voter1).castVote(999, 1)).to.be.revertedWith(
//           'GovernorCountingSimple: vote not currently active'
//         )
//       })

//       it('rejects invalid vote option', async () => {
//         await expect(
//           dao.connect(voter1).castVote(proposalId, 3)
//         ).to.be.revertedWith(
//           'GovernorCountingSimple: invalid value for enum VoteType'
//         )
//       })
//     })
//   })

//   describe('Proposal execution', () => {
//     let proposalId

//     beforeEach(async () => {
//       // Create and pass a proposal
//       const targets = [recipient.address]
//       const values = [0]
//       const calldatas = ['0x']
//       const description = 'Test proposal for execution'

//       const tx = await dao
//         .connect(voter1)
//         .propose(targets, values, calldatas, description)
//       const receipt = await tx.wait()
//       const event = receipt.events?.find((e) => e.event === 'ProposalCreated')
//       proposalId = event.args.proposalId

//       // Wait for voting delay
//       await ethers.provider.send('evm_mine')

//       // Vote to pass the proposal
//       await dao.connect(voter1).castVote(proposalId, 1)
//       await dao.connect(voter2).castVote(proposalId, 1)
//       await dao.connect(voter3).castVote(proposalId, 1)
//       await dao.connect(voter4).castVote(proposalId, 1)
//       await dao.connect(voter5).castVote(proposalId, 1)

//       // Wait for voting period
//       for (let i = 0; i < 45818; i++) {
//         await ethers.provider.send('evm_mine')
//       }
//     })

//     describe('Success', () => {
//       it('queues proposal after successful vote', async () => {
//         await dao
//           .connect(voter1)
//           .queue(
//             targets,
//             values,
//             calldatas,
//             ethers.utils.keccak256(ethers.utils.toUtf8Bytes(description))
//           )

//         expect(await dao.state(proposalId)).to.equal(5) // Queued
//       })

//       it('executes queued proposal', async () => {
//         await dao
//           .connect(voter1)
//           .queue(
//             targets,
//             values,
//             calldatas,
//             ethers.utils.keccak256(ethers.utils.toUtf8Bytes(description))
//           )

//         // Wait for timelock delay (0 in our case)
//         await dao
//           .connect(voter1)
//           .execute(
//             targets,
//             values,
//             calldatas,
//             ethers.utils.keccak256(ethers.utils.toUtf8Bytes(description))
//           )

//         expect(await dao.state(proposalId)).to.equal(7) // Executed
//       })

//       it('emits ProposalExecuted event', async () => {
//         await dao
//           .connect(voter1)
//           .queue(
//             targets,
//             values,
//             calldatas,
//             ethers.utils.keccak256(ethers.utils.toUtf8Bytes(description))
//           )

//         await expect(
//           dao
//             .connect(voter1)
//             .execute(
//               targets,
//               values,
//               calldatas,
//               ethers.utils.keccak256(ethers.utils.toUtf8Bytes(description))
//             )
//         ).to.emit(dao, 'ProposalExecuted')
//       })
//     })

//     describe('Failure', () => {
//       it('rejects execution of non-queued proposal', async () => {
//         await expect(
//           dao
//             .connect(voter1)
//             .execute(
//               targets,
//               values,
//               calldatas,
//               ethers.utils.keccak256(ethers.utils.toUtf8Bytes(description))
//             )
//         ).to.be.revertedWith('TimelockController: operation is not ready')
//       })

//       it('rejects execution by non-executor', async () => {
//         await dao
//           .connect(voter1)
//           .queue(
//             targets,
//             values,
//             calldatas,
//             ethers.utils.keccak256(ethers.utils.toUtf8Bytes(description))
//           )

//         await expect(
//           dao
//             .connect(user1)
//             .execute(
//               targets,
//               values,
//               calldatas,
//               ethers.utils.keccak256(ethers.utils.toUtf8Bytes(description))
//             )
//         ).to.be.revertedWith('TimelockController: operation is not ready')
//       })
//     })
//   })

//   describe('Quorum requirements', () => {
//     let proposalId

//     beforeEach(async () => {
//       // Create a proposal
//       const targets = [recipient.address]
//       const values = [0]
//       const calldatas = ['0x']
//       const description = 'Test proposal for quorum'

//       const tx = await dao
//         .connect(voter1)
//         .propose(targets, values, calldatas, description)
//       const receipt = await tx.wait()
//       const event = receipt.events?.find((e) => e.event === 'ProposalCreated')
//       proposalId = event.args.proposalId

//       // Wait for voting delay
//       await ethers.provider.send('evm_mine')
//     })

//     it('requires quorum to pass proposal', async () => {
//       // Vote with less than quorum
//       await dao.connect(voter1).castVote(proposalId, 1)
//       await dao.connect(voter2).castVote(proposalId, 1)

//       // Wait for voting period
//       for (let i = 0; i < 45818; i++) {
//         await ethers.provider.send('evm_mine')
//       }

//       // Proposal should be defeated
//       expect(await dao.state(proposalId)).to.equal(3) // Defeated
//     })

//     it('passes proposal with sufficient quorum', async () => {
//       // Vote with more than quorum (4% of 1M = 40k, we have 600k voting)
//       await dao.connect(voter1).castVote(proposalId, 1)
//       await dao.connect(voter2).castVote(proposalId, 1)
//       await dao.connect(voter3).castVote(proposalId, 1)

//       // Wait for voting period
//       for (let i = 0; i < 45818; i++) {
//         await ethers.provider.send('evm_mine')
//       }

//       // Proposal should be succeeded
//       expect(await dao.state(proposalId)).to.equal(4) // Succeeded
//     })
//   })

//   describe('Timelock integration', () => {
//     it('respects timelock delay', async () => {
//       // Create a proposal that passes
//       const targets = [recipient.address]
//       const values = [0]
//       const calldatas = ['0x']
//       const description = 'Test timelock proposal'

//       const tx = await dao
//         .connect(voter1)
//         .propose(targets, values, calldatas, description)
//       const receipt = await tx.wait()
//       const event = receipt.events?.find((e) => e.event === 'ProposalCreated')
//       const proposalId = event.args.proposalId

//       // Wait for voting delay
//       await ethers.provider.send('evm_mine')

//       // Vote to pass
//       await dao.connect(voter1).castVote(proposalId, 1)
//       await dao.connect(voter2).castVote(proposalId, 1)
//       await dao.connect(voter3).castVote(proposalId, 1)

//       // Wait for voting period
//       for (let i = 0; i < 45818; i++) {
//         await ethers.provider.send('evm_mine')
//       }

//       // Queue the proposal
//       await dao
//         .connect(voter1)
//         .queue(
//           targets,
//           values,
//           calldatas,
//           ethers.utils.keccak256(ethers.utils.toUtf8Bytes(description))
//         )

//       // Try to execute immediately (should fail due to timelock)
//       await expect(
//         dao
//           .connect(voter1)
//           .execute(
//             targets,
//             values,
//             calldatas,
//             ethers.utils.keccak256(ethers.utils.toUtf8Bytes(description))
//           )
//       ).to.be.revertedWith('TimelockController: operation is not ready')

//       // Wait for timelock delay (0 in our case, but still need to mine a block)
//       await ethers.provider.send('evm_mine')

//       // Now execute should succeed
//       await dao
//         .connect(voter1)
//         .execute(
//           targets,
//           values,
//           calldatas,
//           ethers.utils.keccak256(ethers.utils.toUtf8Bytes(description))
//         )
//     })
//   })
// })
