import { useState } from 'react'
import { Form, Button, Spinner } from 'react-bootstrap'
import { ethers } from 'ethers'

const Create = ({ dao, provider, setIsLoading }) => {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [address, setAddress] = useState('')
  const [description, setDescription] = useState('')
  const [deposit, setDeposit] = useState('')
  const [isWaiting, setIsWaiting] = useState(false)

  const createHandler = async (e) => {
    e.preventDefault()
    setIsWaiting(true)

    try {
      const signer = await provider.getSigner()
      const formattedAmount = ethers.utils.parseUnits(
        amount.toString(),
        'ether'
      )
      const formattedDeposit = ethers.utils.parseUnits(
        deposit.toString(),
        'ether'
      )

      // Get token contract
      const tokenAddress = await dao.token()
      const tokenABI = [
        'function approve(address spender, uint256 amount) external returns (bool)',
      ]
      const token = new ethers.Contract(tokenAddress, tokenABI, signer)

      // Approve DAO to spend tokens
      const approveTx = await token.approve(dao.address, formattedDeposit)
      await approveTx.wait()

      const transaction = await dao
        .connect(signer)
        .createProposal(
          name,
          formattedAmount,
          address,
          description,
          formattedDeposit
        )

      await transaction.wait()
    } catch (error) {
      console.log(error)
      window.alert('User rejected or transaction reverted.')
    }

    setIsLoading(true)
  }

  return (
    <Form onSubmit={createHandler}>
      <Form.Group style={{ maxWidth: '450px', margin: '50px auto' }}>
        <Form.Control
          type='text'
          placeholder='Enter name'
          value={name}
          className='my-2'
          onChange={(e) => setName(e.target.value)}
        />
        <Form.Control
          type='number'
          placeholder='Enter amount'
          value={amount}
          className='my-2'
          onChange={(e) => setAmount(e.target.value)}
        />
        <Form.Control
          type='text'
          placeholder='Enter address'
          value={address}
          className='my-2'
          onChange={(e) => setAddress(e.target.value)}
        />
        <Form.Control
          type='text'
          placeholder='Enter description'
          value={description}
          className='my-2'
          onChange={(e) => setDescription(e.target.value)}
        />
        <Form.Control
          type='number'
          placeholder='Enter deposit amount (tokens)'
          value={deposit}
          className='my-2'
          onChange={(e) => setDeposit(e.target.value)}
        />
        {isWaiting ? (
          <Button
            variant='primary'
            type='submit'
            style={{ display: 'block', margin: '0 auto' }}
          >
            <Spinner animation='border' size='sm' />
          </Button>
        ) : (
          <Button variant='primary' type='submit' style={{ width: '100%' }}>
            Create Proposal
          </Button>
        )}
      </Form.Group>
    </Form>
  )
}

export default Create
