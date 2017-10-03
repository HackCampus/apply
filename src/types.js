import type {$Request} from 'express'

export type Request = $Request & {
  user: ?{id: 'string'}
}
