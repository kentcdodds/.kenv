// Menu: Gather Guest List
// Description: Handle the Guest List for Gather
// Author: Kent C. Dodds
// Twitter: @kentcdodds

import '@johnlindquist/kit'
import {z} from 'zod'

const GuestObjectSchema = z.object({
  name: z.string().optional(),
  affiliation: z.string().optional(),
  role: z.string().optional(),
})
const GuestsSchema = z.record(z.string().email(), GuestObjectSchema)

const GATHER_API_KEY = await env('GATHER_API_KEY', async () => {
  return await arg(
    {
      placeholder: 'GATHER_API_KEY',
      ignoreBlur: true,
    },
    () =>
      md(`
# Get a Gather API Key

[app.gather.town/apikeys](https://app.gather.town/apikeys)
    `),
  )
})

const GATHER_SPACE_ID = await env('GATHER_SPACE_ID', async () => {
  return await arg(
    {
      placeholder: 'GATHER_SPACE_ID',
      ignoreBlur: true,
    },
    () =>
      md(`
# Specify the Gather Space ID

It's everything after "app/" in this URL with "/" replaced by "\\":

https://app.gather.town/app/BL0B93FK23T/example
    `),
  )
})

async function go() {
  const params = new URLSearchParams({
    apiKey: GATHER_API_KEY,
    spaceId: GATHER_SPACE_ID,
  })
  const rawGuests = await fetch(
    `https://gather.town/api/getEmailGuestlist?${params}`,
  ).then(r => r.json())

  const guests = GuestsSchema.parse(rawGuests)
  const choices = [
    {name: '➕ Add a guest', value: {type: 'add-guest'}},
    ...Object.entries(guests).map(([email, {name, affiliation, role}]) => ({
      name: `${email} (${name?.trim() || 'Unnamed'}, ${
        affiliation?.trim() || 'Unaffiliated'
      }, ${role?.trim() || 'No role'})`,
      value: {type: 'modify-guest', email},
    })),
  ]
  const rawSelection = await arg(
    {placeholder: 'Which guest would you like to modify?'},
    choices,
  )
  const SelectionSchema = z.union([
    z.object({
      type: z.literal('add-guest'),
    }),
    z.object({
      type: z.literal('modify-guest'),
      email: z.string(),
    }),
  ])
  const selection = SelectionSchema.parse(rawSelection)
  switch (selection.type) {
    case 'add-guest': {
      await addGuest()
      return go()
    }
    case 'modify-guest': {
      await modifyGuest(selection.email, guests)
      return go()
    }
  }
}

async function addGuest() {
  const email = z
    .string()
    .email()
    .parse(await arg({placeholder: `What's the guests' email?`}))
  const body = {
    apiKey: GATHER_API_KEY,
    spaceId: GATHER_SPACE_ID,
    guestlist: {[email]: {}},
  }
  const updateResponse = await fetch(
    'https://api.gather.town/api/setEmailGuestlist',
    {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'content-type': 'application/json',
      },
    },
  )
  const update = await updateResponse.json()
  console.log('Guest Update: ', update[email])
}

async function modifyGuest(
  email: string,
  guests: z.infer<typeof GuestsSchema>,
) {
  const guest = guests[email]
  const action = await arg({placeholder: `What would you like to do?`}, [
    {name: 'Remove Guest', value: 'remove'},
    {name: `Change Guest Email (${email})`, value: 'change-email'},
    {
      name: `Change Guest Name (${guest.name?.trim() || 'Unnamed'})`,
      value: 'change-name',
    },
    {
      name: `Change Guest Affiliation (${
        guest.affiliation?.trim() || 'Unaffiliated'
      })`,
      value: 'change-affiliation',
    },
    {
      name: `Change Guest Role (${guest.role?.trim() || 'No role'})`,
      value: 'change-role',
    },
    {
      name: `Cancel`,
      value: 'cancel',
    },
  ])
  switch (action) {
    case 'remove': {
      delete guests[email]
      break
    }
    case 'change-email': {
      const newEmail = z
        .string()
        .email()
        .parse(await arg({placeholder: 'New Email'}))
      guests[newEmail] = guests[email]
      delete guests[email]
      email = newEmail
      break
    }
    case 'change-name': {
      const newName = await arg({placeholder: 'New Name'})
      if (newName) {
        guests[email].name = newName
      } else {
        delete guests[email].name
      }
      break
    }
    case 'change-affiliation': {
      const newAffiliation = await arg({
        placeholder: 'New Affiliation',
      })
      if (newAffiliation) {
        guests[email].affiliation = newAffiliation
      } else {
        delete guests[email].affiliation
      }
      break
    }
    case 'change-role': {
      const newRole = await arg({placeholder: 'New Role'})
      if (newRole) {
        guests[email].role = newRole
      } else {
        delete guests[email].role
      }
      break
    }
    case 'cancel': {
      return go()
    }
  }
  const body = {
    apiKey: GATHER_API_KEY,
    spaceId: GATHER_SPACE_ID,
    guestlist: guests,
    overwrite: true,
  }
  const updateResponse = await fetch(
    'https://api.gather.town/api/setEmailGuestlist',
    {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'content-type': 'application/json',
      },
    },
  )
  const update = await updateResponse.json()
  console.log('Guest Update: ', update[email])
}

go()
