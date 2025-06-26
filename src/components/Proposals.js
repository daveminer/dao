import Table from 'react-bootstrap/Table'
import Button from 'react-bootstrap/Button'
import { ethers } from 'ethers'

const Proposals = ({
  dao,
  proposals,
  quorum,
  provider,
  setIsLoading,
  userVotes,
}) => {
  const finalizeHandler = async (id) => {
    try {
      const signer = provider.getSigner()
      const transaction = await dao.connect(signer).finalizeProposal(id)
      await transaction.wait()
    } catch (error) {
      window.alert('User rejected or transaction reverted')
    }

    setIsLoading(true)
  }

  const voteHandler = async (id, isUpvote) => {
    try {
      const signer = provider.getSigner()
      const transaction = await dao.connect(signer).vote(id, isUpvote)
      await transaction.wait()
    } catch (error) {
      window.alert('User rejected or transaction reverted')
    }

    setIsLoading(true)
  }

  return (
    <Table striped bordered hover responsive>
      <thead>
        <tr>
          <th>#</th>
          <th>Proposal Name</th>
          <th>Description</th>
          <th>Recipient Address</th>
          <th>Recipient Balance</th>
          <th>Amount</th>
          <th>Status</th>
          <th>Total Votes</th>
          <th>Tallied Votes</th>
          <th>Up Votes</th>
          <th>Down Votes</th>
          <th>Quorum</th>
          <th>Cast Vote</th>
          <th>Finalize</th>
        </tr>
      </thead>
      <tbody>
        {proposals.map((proposal, index) => {
          return (
            <tr key={index}>
              <td>{proposal.id.toString()}</td>
              <td>{proposal.name}</td>
              <td>{proposal.description}</td>
              <td>{proposal.recipient}</td>
              <td>{proposal.recipientBalance} ETH</td>
              <td>{ethers.utils.formatUnits(proposal.amount, 'ether')} ETH</td>
              <td>{proposal.finalized ? 'Approved' : 'In Progress'}</td>
              <td>
                {(
                  Number(proposal.votes) + Number(proposal.downVotes)
                ).toString()}
              </td>
              <td>{(proposal.votes - proposal.downVotes).toString()}</td>
              <td>{proposal.votes.toString()}</td>
              <td>{proposal.downVotes.toString()}</td>
              <td>{quorum.toString()}</td>
              <td>
                {!proposal.finalized && !userVotes.includes(proposal.id) && (
                  <div className='d-flex flex-column gap-2'>
                    <Button
                      variant='success'
                      onClick={() => voteHandler(proposal.id, true)}
                    >
                      Vote
                    </Button>
                    <Button
                      variant='danger'
                      onClick={() => voteHandler(proposal.id, false)}
                    >
                      Down Vote
                    </Button>
                  </div>
                )}
              </td>
              <td className='align-middle'>
                {!proposal.finalized && proposal.votes > quorum && (
                  <Button
                    variant='primary'
                    style={{ width: '100%' }}
                    onClick={() => finalizeHandler(proposal.id)}
                  >
                    Finalize
                  </Button>
                )}
              </td>
            </tr>
          )
        })}
      </tbody>
    </Table>
  )
}

export default Proposals
