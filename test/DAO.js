const { expect } = require('chai')
const { ethers } = require('hardhat')

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
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
    token = await Token.deploy('Dapp University', 'DAPP', '1000000')

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
    dao = await DAO.deploy(token.address, '500000000000000000000001')

    await funder.sendTransaction({
      to: dao.address,
      value: ether(100),
    })
  })

  describe('Deployment', () => {
    it('sends ether to the DAO treasury', async () => {
      expect(await ethers.provider.getBalance(dao.address)).to.equal(ether(100))
    })

    it('returns token address', async () => {
      expect(await dao.token()).to.equal(token.address)
    })

    it('returns quorum', async () => {
      expect(await dao.quorum()).to.equal('500000000000000000000001')
    })
  })

  describe('Proposal creation', () => {
    let transaction, result

    describe('Success', () => {
      beforeEach(async () => {
        transaction = await dao
          .connect(investor1)
          .createProposal('Proposal 1', ether(100), recipient.address)
        result = await transaction.wait()
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
      it('reject invalid amount', async () => {
        await expect(
          dao
            .connect(investor1)
            .createProposal('Proposal 1', ether(1000), recipient.address)
        ).to.be.revertedWith('Not enough balance')
      })

      it('reject non-investor', async () => {
        await expect(
          dao
            .connect(user1)
            .createProposal('Proposal 1', ether(100), recipient.address)
        ).to.be.revertedWith('must be token holder')
      })

      //   it('reject zero amount', async () => {
      //     // await expect(
      //     //   dao.connect(investor1).createProposal('Proposal 1', 0, recipient.address)
      //     // ).to.be.revertedWith('Amount must be greater than 0')
      //   })
    })
  })

  describe('Voting', () => {
    let transaction, result

    beforeEach(async () => {
      transaction = await dao
        .connect(investor1)
        .createProposal('Proposal 1', ether(100), recipient.address)
      result = await transaction.wait()
    })

    describe('Success', () => {
      beforeEach(async () => {
        transaction = await dao.connect(investor1).vote(1)
        result = await transaction.wait()
      })

      it('updates vote count', async () => {
        const proposal = await dao.proposals(1)
        expect(proposal.votes).to.equal(tokens(200000))
      })

      it('emits a vote event', async () => {
        await expect(transaction)
          .to.emit(dao, 'Vote')
          .withArgs(1, investor1.address)
      })
    })

    describe('Failure', () => {
      it('reject non-investor', async () => {
        await expect(dao.connect(user1).vote(1)).to.be.revertedWith(
          'must be token holder'
        )
      })

      it('rejects double voting', async () => {
        transaction = await dao.connect(investor1).vote(1)
        await transaction.wait()

        await expect(dao.connect(investor1).vote(1)).to.be.revertedWith(
          'already voted'
        )
      })
    })
  })

  describe('Governance', () => {
    let transaction, result

    describe('Success', () => {
      beforeEach(async () => {
        transaction = await dao
          .connect(investor1)
          .createProposal('Proposal 1', ether(100), recipient.address)

        result = await transaction.wait()

        transaction = await dao.connect(investor1).vote(1)
        result = await transaction.wait()

        transaction = await dao.connect(investor2).vote(1)
        result = await transaction.wait()

        transaction = await dao.connect(investor3).vote(1)
        result = await transaction.wait()

        transaction = await dao.connect(investor1).finalizeProposal(1)
        result = await transaction.wait()
      })

      it('transfers function to recipient', async () => {
        expect(await ethers.provider.getBalance(recipient.address)).to.equal(
          tokens(10100)
        )
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
        transaction = await dao
          .connect(investor1)
          .createProposal('Proposal 1', ether(100), recipient.address)

        result = await transaction.wait()

        transaction = await dao.connect(investor1).vote(1)
        result = await transaction.wait()

        transaction = await dao.connect(investor2).vote(1)
        result = await transaction.wait()
      })

      it('rejects finalization if not enough votes', async () => {
        await expect(
          dao.connect(investor1).finalizeProposal(1)
        ).to.be.revertedWith('must reach quorum to finalize proposal')
      })

      it('rejects finalization from a non-investor', async () => {
        transaction = await dao.connect(investor3).vote(1)
        result = await transaction.wait()

        await expect(dao.connect(user1).finalizeProposal(1)).to.be.revertedWith(
          'must be token holder'
        )
      })

      it('rejects proposal if already finalized', async () => {
        transaction = await dao.connect(investor3).vote(1)
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
