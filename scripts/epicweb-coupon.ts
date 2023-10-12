// Name: EpicWeb Coupon
// Description: Generates a coupon for EpicWeb (opens in the browser, must be authenticated as admin)
// Author: Kent C. Dodds
// Twitter: @kentcdodds

import '@johnlindquist/kit'

const [quantity, percentOff] = await fields({
  validate: ({orderedValues: [q, p]}: any) => {
    if (isNaN(Number(q))) return false
    const pNum = Number(p)
    if (isNaN(pNum)) return false
    return pNum > 0 && pNum <= 100
  },
  fields: [
    {label: 'Quantity', value: '1', type: 'number', required: true},
    {label: 'percentOff', value: '20', type: 'number', required: true},
  ],
})

const url = new URL('https://www.epicweb.dev/api/admin/coupon')
url.searchParams.set('quantity', quantity)
url.searchParams.set('percentOff', percentOff)
url.searchParams.set(
  'productId',
  'kcd_product_dbf94bf0-66b0-11ee-8c99-0242ac120002',
)

browse(url.toString())
