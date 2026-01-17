import { PureAbility } from '@casl/ability'

// Define all subjects (resources) that can be acted upon
export type Subjects =
  | 'Catalog'
  | 'Entry'
  | 'LoadOrder'
  | 'Exit'  // Load orders with status "salida" - only admin can edit/delete
  | 'Report'
  | 'User'
  | 'Email'
  | 'all' // special subject for admin bypass

// Define all actions that can be performed
export type Actions =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'manage' // special action for admins (all actions on all subjects)

// Define the application ability type
export type AppAbility = PureAbility<[Actions, Subjects]>
