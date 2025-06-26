const { expect } = require('chai')
const { ethers } = require('hardhat')

const tokens = (n) => {
  return ethers.parseUnits(n.toString(), 'ether')
}

const ether = tokens

describe('DAO', () => {
  let token, dao

  let deployer,
    funder,
    investor1,
    investor2,
    investor3,
    investor4,
    investor5,
    recipient,
    user1

  beforeEach(async () => {
    // Set up accounts
    let accounts = await ethers.getSigners()
    deployer = accounts[0]
    funder = accounts[1]
    investor1 = accounts[2]
    investor2 = accounts[3]
    investor3 = accounts[4]
    investor4 = accounts[5]
    investor5 = accounts[6]
    recipient = accounts[7]
    user1 = accounts[8]

    // Deploy Token
    const Token = await ethers.getContractFactory('Token')
    token = await Token.deploy('Dapp University', 'DAPP', 1000000)

    // Wait for deployment to complete
    await token.waitForDeployment()

    // Verify token address is not null
    console.log('Token address:', await token.getAddress())

    // Send tokens to investors - each one gets 20%
    transaction = await token
      .connect(deployer)
      .transfer(investor1.address, tokens(200000))
    await transaction.wait()

    transaction = await token
      .connect(deployer)
      .transfer(investor2.address, tokens(200000))
    await transaction.wait()

    transaction = await token
      .connect(deployer)
      .transfer(investor3.address, tokens(200000))
    await transaction.wait()

    transaction = await token
      .connect(deployer)
      .transfer(investor4.address, tokens(200000))
    await transaction.wait()

    transaction = await token
      .connect(deployer)
      .transfer(investor5.address, tokens(200000))
    await transaction.wait()

    // Deploy DAO
    // Set Quorum to > 50% of token total supply
    // 500k tokens + 1 wei, i.e. 500000000000000000000001
    const DAO = await ethers.getContractFactory('DAO')
    dao = await DAO.deploy(await token.getAddress(), '500000000000000000000001')

    // Wait for DAO deployment to complete
    await dao.waitForDeployment()

    await funder.sendTransaction({
      to: await dao.getAddress(),
      value: ether(100),
    })

    // Approve DAO to spend tokens
    transaction = await token
      .connect(investor1)
      .approve(await dao.getAddress(), ether(100))
    await transaction.wait()
  })

  describe('Deployment', () => {
    it('sends ether to the DAO treasury', async () => {
      expect(await ethers.provider.getBalance(await dao.getAddress())).to.equal(
        ether(100)
      )
    })

    it('returns token address', async () => {
      expect(await dao.token()).to.equal(await token.getAddress())
    })

    it('returns quorum', async () => {
      expect(await dao.quorum()).to.equal('500000000000000000000001')
    })
  })

  describe('Proposal creation', () => {
    let transaction, result

    describe('Success', () => {
      beforeEach(async () => {
        // Approve DAO to spend tokens
        transaction = await token
          .connect(investor1)
          .approve(await dao.getAddress(), ether(100))
        await transaction.wait()

        transaction = await dao
          .connect(investor1)
          .createProposal(
            'Proposal 1',
            ether(100),
            recipient.address,
            'Description 1'
          )
        result = await transaction.wait()
      })

      it('transfers tokens from proposer to DAO', async () => {
        const balance = await token.balanceOf(await dao.getAddress())
        expect(balance).to.equal(tokens(100))

        const proposerBalance = await token.balanceOf(investor1.address)
        expect(proposerBalance).to.equal(tokens(199900))
      })

      it('updates proposal count', async () => {
        expect(await dao.proposalCount()).to.equal(1)
      })

      it('updates proposal mapping', async () => {
        const proposal = await dao.proposals(1)

        expect(proposal.id).to.equal(1)
        expect(proposal.amount).to.equal(ether(100))
        expect(proposal.recipient).to.equal(recipient.address)
      })

      it('emits a propose event', async () => {
        await expect(transaction)
          .to.emit(dao, 'Propose')
          .withArgs(1, ether(100), recipient.address, investor1.address)
      })
    })

    describe('Failure', () => {
      it('requires enough tokens for the deposit transfer', async () => {
        // Approve DAO to spend tokens
        await token
          .connect(investor1)
          .approve(await dao.getAddress(), tokens(10000000))

        await expect(
          dao
            .connect(investor1)
            .createProposal(
              'Proposal 1',
              tokens(10000000),
              recipient.address,
              'Description 1'
            )
        ).to.be.revertedWith('Insufficient token balance for deposit')
      })

      it('reject non-investor', async () => {
        await expect(
          dao
            .connect(user1)
            .createProposal(
              'Proposal 1',
              ether(100),
              recipient.address,
              'Description 1'
            )
        ).to.be.revertedWith('must be token holder')
      })
    })
  })

  describe('Voting', () => {
    let transaction, result

    beforeEach(async () => {
      // Approve DAO to spend tokens
      transaction = await token
        .connect(investor1)
        .approve(await dao.getAddress(), ether(100))
      await transaction.wait()

      transaction = await dao
        .connect(investor1)
        .createProposal(
          'Proposal 1',
          ether(100),
          recipient.address,
          'Description 2'
        )
      result = await transaction.wait()
    })

    describe('Success', () => {
      beforeEach(async () => {
        transaction = await dao.connect(investor1).vote(1, true)
        result = await transaction.wait()

        transaction = await dao.connect(investor2).vote(1, true)
        result = await transaction.wait()

        transaction = await dao.connect(investor3).vote(1, false)
        result = await transaction.wait()
      })

      it('updates vote count', async () => {
        const proposal = await dao.proposals(1)
        // TODO: check
        expect(proposal.votes).to.equal(tokens(399900))
      })

      it('updates down vote count', async () => {
        const proposal = await dao.proposals(1)
        expect(proposal.downVotes).to.equal(tokens(200000))
      })

      it('emits a vote event', async () => {
        await expect(transaction)
          .to.emit(dao, 'Vote')
          .withArgs(1, investor3.address, false)
      })
    })

    describe('Failure', () => {
      it('reject non-investor', async () => {
        await expect(dao.connect(user1).vote(1, true)).to.be.revertedWith(
          'must be token holder'
        )
      })

      it('rejects double voting', async () => {
        transaction = await dao.connect(investor1).vote(1, true)
        await transaction.wait()

        await expect(dao.connect(investor1).vote(1, false)).to.be.revertedWith(
          'already voted'
        )
      })
    })
  })

  describe('Governance', () => {
    let transaction, result

    describe('Success', () => {
      beforeEach(async () => {
        // Approve DAO to spend tokens
        transaction = await token
          .connect(investor1)
          .approve(await dao.getAddress(), tokens(100))
        await transaction.wait()

        transaction = await dao
          .connect(investor1)
          .createProposal(
            'Proposal 1',
            tokens(100),
            recipient.address,
            'Description 1'
          )

        result = await transaction.wait()

        transaction = await dao.connect(investor1).vote(1, true)
        result = await transaction.wait()

        transaction = await dao.connect(investor2).vote(1, true)
        result = await transaction.wait()

        transaction = await dao.connect(investor3).vote(1, true)
        result = await transaction.wait()

        transaction = await dao.connect(investor1).finalizeProposal(1)
        result = await transaction.wait()
      })

      it('transfers tokens from DAO to recipient', async () => {
        const balance = await token.balanceOf(recipient.address)
        expect(balance).to.equal(tokens(100))

        const daoBalance = await token.balanceOf(await dao.getAddress())
        expect(daoBalance).to.equal(tokens(0))
      })

      it('updates the proposal to finalized', async () => {
        const proposal = await dao.proposals(1)
        expect(proposal.finalized).to.equal(true)
      })

      it('emits a finalize event', async () => {
        await expect(transaction).to.emit(dao, 'Finalize').withArgs(1)
      })
    })

    describe('Failure', () => {
      beforeEach(async () => {
        // Approve DAO to spend tokens
        transaction = await token
          .connect(investor1)
          .approve(await dao.getAddress(), ether(100))
        await transaction.wait()

        transaction = await dao
          .connect(investor1)
          .createProposal(
            'Proposal 1',
            ether(100),
            recipient.address,
            'Description 1'
          )

        result = await transaction.wait()

        transaction = await dao.connect(investor1).vote(1, true)
        result = await transaction.wait()

        transaction = await dao.connect(investor2).vote(1, false)
        result = await transaction.wait()
      })

      it('rejects finalization if not enough votes', async () => {
        await expect(
          dao.connect(investor1).finalizeProposal(1)
        ).to.be.revertedWith('must reach quorum to finalize proposal')
      })

      it('rejects finalization from a non-investor', async () => {
        transaction = await dao.connect(investor3).vote(1, true)
        result = await transaction.wait()

        await expect(dao.connect(user1).finalizeProposal(1)).to.be.revertedWith(
          'must be token holder'
        )
      })

      it('rejects proposal if already finalized', async () => {
        transaction = await dao.connect(investor3).vote(1, true)
        result = await transaction.wait()

        transaction = await dao.connect(investor4).vote(1, true)
        result = await transaction.wait()

        transaction = await dao.connect(investor5).vote(1, true)
        result = await transaction.wait()

        transaction = await dao.connect(investor1).finalizeProposal(1)
        result = await transaction.wait()

        await expect(
          dao.connect(investor1).finalizeProposal(1)
        ).to.be.revertedWith('proposal already finalized')
      })
    })
  })
})
