/**
 * Fitness Module Page Route
 * 
 * Redirects to dashboard page to support new routing structure.
 */
import { redirect } from 'next/navigation'

export default function FitnessPage() {
  redirect('/modules/fitness/dashboard')
}