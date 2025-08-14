
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PageTitle } from '@/components/shared/PageTitle'
import { Frown } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center p-4">
        <Frown className="h-24 w-24 text-primary mb-6" />
        <PageTitle 
            title="404 - Page Not Found" 
            subtitle="Oops! The page you are looking for does not exist or has been moved."
        />
        <Button asChild size="lg" className="mt-6">
            <Link href="/dashboard">Return to Dashboard</Link>
        </Button>
    </div>
  )
}
