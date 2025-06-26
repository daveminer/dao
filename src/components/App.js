import { useEffect, useState, useCallback } from 'react'
import { Container } from 'react-bootstrap'
import { ethers } from 'ethers'

// Components
import Create from './Create'
import Navigation from './Navigation'
import Loading from './Loading'
import Proposals from './Proposals'

// ABIs: Import your contract ABIs here
import DAO_ABI from '../abis/DAO.json'

// Config: Import your network config here
import config from '../config.json'

function App() {
  const [provider, setProvider] = useState(null)
  const [account, setAccount] = useState(null)
  const [dao, setDao] = useState(null)
  const [treasuryBalance, setTreasuryBalance] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [proposals, setProposals] = useState([])
  const [quorum, setQuorum] = useState(null)
  const [userVotes, setUserVotes] = useState([])

  const getRecipientBalance = async (recipient, provider) => {
    const balance = await provider.getBalance(recipient)
    return ethers.utils.formatUnits(balance, 'ether')
  }

  const getUserVotes = async (proposals, dao, account) => {
    const votedProposalIds = []

    for (let i = 0; i < proposals.length; i++) {
      const proposal = proposals[i]
      const hasVoted = await dao.votes(account, proposal.id)
      const hasDownVoted = await dao.downVotes(account, proposal.id)

      if (hasVoted || hasDownVoted) {
        votedProposalIds.push(proposal.id)
      }
    }

    return votedProposalIds
  }

  const loadBlockchainData = useCallback(async () => {
    // Initiate provider
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    setProvider(provider)

    const dao = new ethers.Contract(
      config[31337].dao.address,
      DAO_ABI,
      provider
    )
    setDao(dao)

    let treasuryBalance = await provider.getBalance(dao.address)
    treasuryBalance = ethers.utils.formatUnits(treasuryBalance, 18)
    setTreasuryBalance(treasuryBalance)

    // Fetch accounts
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    })
    const account = ethers.utils.getAddress(accounts[0])
    setAccount(account)

    const count = await dao.proposalCount()
    const items = []

    for (let i = 0; i < count; i++) {
      let proposal = await dao.proposals(i + 1)
      proposal = {
        ...proposal,
        recipientBalance: await getRecipientBalance(
          proposal.recipient,
          provider
        ),
      }
      items.push(proposal)
    }
    setProposals(items)

    const quorum = await dao.quorum()
    setQuorum(quorum)

    const userVotes = await getUserVotes(items, dao, account)
    setUserVotes(userVotes)

    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (isLoading) {
      loadBlockchainData()
    }
  }, [isLoading, loadBlockchainData])

  return (
    <Container>
      <Navigation account={account} />

      <h1 className='my-4 text-center'>Welcome to our DAO!</h1>

      {isLoading ? (
        <Loading />
      ) : (
        <>
          <Create provider={provider} dao={dao} setIsLoading={setIsLoading} />
          <hr />
          <p className='text-center'>
            <strong>Treasury Balance:</strong> {treasuryBalance}
          </p>
          <hr />

          <Proposals
            dao={dao}
            provider={provider}
            proposals={proposals}
            quorum={quorum}
            setIsLoading={setIsLoading}
            userVotes={userVotes}
          />
        </>
      )}
    </Container>
  )
}

export default App
