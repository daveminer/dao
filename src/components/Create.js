import { useState } from 'react'
import { Form, Button, Spinner } from 'react-bootstrap'
import { ethers } from 'ethers'

const Create = ({ dao, provider, setIsLoading }) => {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [address, setAddress] = useState('')
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

      const transaction = await dao
        .connect(signer)
        .createProposal(name, formattedAmount, address)

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
