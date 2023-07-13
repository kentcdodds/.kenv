// Menu: Gather Guest List
// Description: Handle the Guest List for Gather
// Author: Kent C. Dodds
// Twitter: @kentcdodds

import '@johnlindquist/kit'
import path from 'node:path'
import os from 'node:os'
import {z} from 'zod'
import md5 from 'md5-hex'
import filenamify from 'filenamify'
import {unusedFilename} from 'unused-filename'

const GuestObjectSchema = z.object({
  name: z.string().optional(),
  affiliation: z.string().optional(),
  role: z.string().optional(),
})
const GuestsSchema = z.record(z.string().email(), GuestObjectSchema)
type Guests = z.infer<typeof GuestsSchema>

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
    {name: '💾 Save guestlist', value: {type: 'save-guestlist'}},
    {name: '📤 Upload guestlist', value: {type: 'upload-guestlist'}},
    ...Object.entries(guests).map(([email, {name, affiliation, role}]) => ({
      name: email,
      description: `${name?.trim() || 'Unnamed'}, ${
        affiliation?.trim() || 'Unaffiliated'
      }, ${role?.trim() || 'No role'}`,
      preview: () =>
        `<img class="w-full object-cover" src="https://www.gravatar.com/avatar/${md5(
          email,
        )}?d=retro" />`,
      value: {type: 'modify-guest', email},
    })),
  ]

  const rawSelection = await arg(
    {placeholder: 'Which guest would you like to modify?'},
    choices,
  )
  const SelectionSchema = z.union([
    z.object({type: z.literal('add-guest')}),
    z.object({type: z.literal('save-guestlist')}),
    z.object({type: z.literal('upload-guestlist')}),
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
    case 'save-guestlist': {
      await saveGuestList(guests)
      return go()
    }
    case 'upload-guestlist': {
      await uploadGuestList(guests)
      return go()
    }
    default: {
      throw new Error(`Unexpected selection type: ${JSON.stringify(selection)}`)
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

async function modifyGuest(email: string, guests: Guests) {
  const action = await arg(
    {placeholder: `What would you like to do with ${email}?`},
    [
      {name: 'Modify Guest', value: 'modify'},
      {name: 'Remove Guest', value: 'remove'},
      {name: `Cancel`, value: 'cancel'},
    ],
  )
  switch (action) {
    case 'cancel': {
      return go()
    }
    case 'remove': {
      delete guests[email]
      break
    }
    case 'modify': {
      const [newEmail, name, affiliation, role] = await fields([
        {label: 'Email', defaultValue: email},
        {label: 'Name', defaultValue: guests[email].name || ''},
        {label: 'Affiliation', defaultValue: guests[email].affiliation || ''},
        {label: 'Role', defaultValue: guests[email].role || ''},
      ])
      if (newEmail !== email) {
        guests[newEmail] = guests[email]
        delete guests[email]
        email = newEmail
      }
      if (name) guests[email].name = name
      if (affiliation) guests[email].affiliation = affiliation
      if (role) guests[email].role = role
      break
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

async function saveGuestList(guests: Guests) {
  const filename = filenamify(`gather-guestlist-${GATHER_SPACE_ID}.json`, {
    replacement: '-',
  })
  const filepath = await unusedFilename(
    path.join(os.homedir(), `Desktop`, filename),
  )
  const dest =
    (await arg({
      placeholder: 'Where would you like to save the guestlist?',
      hint: `defaults to ${filepath}`,
    })) || filepath

  await writeJson(dest, guests, {spaces: 2})
  console.log(Object.keys(guests).length, 'guests saved to', dest)
}

async function uploadGuestList(guests: Guests) {
  let selectedFiles = await getSelectedFile()
  let newGuests: Guests | null = null

  if (selectedFiles) {
    const filePath = selectedFiles.split('\n')[0]
    newGuests = await readJson(filePath)
      .then(v => GuestsSchema.parse(v))
      .catch(() => null)
  }

  if (!newGuests) {
    const droppedFiles = await drop({
      placeholder: 'Drop json file here',
      preview: () =>
        md(`
It should be a json file with the following shape:

\`\`\`json
{
  "email@example.com": {
    "name": "Name",
    "affiliation": "Affiliation",
    "role": "Role"
  }
}
\`\`\`

All properties are optional. Can be an empty object.
    `),
    })
    const filePath = droppedFiles[0].path
    const rawGuests = await readJson(filePath)
    newGuests = GuestsSchema.parse(rawGuests)
  }

  if (!newGuests) {
    notify({title: 'Invalid guestlist', message: 'Please try again'})
    return go()
  }

  const guestCount = Object.keys(guests).length
  const overwrite = await arg(
    {
      placeholder: `Overwrite existing guest list?`,
      hint: `${guestCount} guests are currently in the guestlist.`,
    },
    [
      {name: 'Overwrite', value: true},
      {name: 'Append', value: false},
    ],
  )

  const newGuestCount = Object.keys(newGuests).length

  const confirmUpload = await arg(
    {
      placeholder: `${
        overwrite ? 'Overwrite' : 'Merge'
      } with ${newGuestCount} guests?`,
      hint: `${guestCount} guests are currently in the guestlist.`,
    },
    [
      {name: 'Yes', value: true},
      {name: 'No', value: false},
    ],
  )

  if (!confirmUpload) {
    return go()
  }

  const body = {
    apiKey: GATHER_API_KEY,
    spaceId: GATHER_SPACE_ID,
    // we're doing own own merging here because I don't know how they do it
    // and we can do it ourselves easily
    guestlist: overwrite ? newGuests : {...guests, ...newGuests},
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
  console.log(
    'Guest Update: ',
    Object.keys(update).length,
    'guests now on the list.',
  )
}

go()
