type Media = {media_key: string; type: 'photo'; url: string}
type TweetData = {
  id: string
  attachments?: {media_keys: Array<string>}
  author_id: string
  text: string
  created_at: string
  geo?: {place_id: string}
}
type User = {
  id: string
  name: string
  username: string
}
type JsonResponse = {
  data: Array<TweetData>
  includes: {users: Array<User>; media: Array<Media>}
}

export {JsonResponse}
