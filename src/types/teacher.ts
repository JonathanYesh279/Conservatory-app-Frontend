export interface User {
  _id: string
  fullName: string
  email: string
  roles: string[]
  avatarUrl?: string
  professionalInfo?: {
    instrument: string
  }
}