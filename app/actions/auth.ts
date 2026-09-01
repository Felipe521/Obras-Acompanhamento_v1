'use server'

import { signOut } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function logoutAction() {
  revalidatePath('/', 'layout')
  await signOut({ redirectTo: '/login' })
}
