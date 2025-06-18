"use client"

import EventHeader from "@/components/organisms/event-header"
import EventDetails from "@/components/organisms/event-details"
import CommentsSection from "@/components/organisms/comments-section"
import EventImage from "@/components/organisms/event-image"
import SimilarEvents from "@/components/organisms/similar-events"
import Button from "@/components/atoms/Button"
import { useAuth } from "@/context/auth-context"

export default function EventPageTemplate() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen bg-[#f2f7f5]">
      <main className="max-w-[1200px] mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,1fr] gap-12">
          <div>
            <EventHeader />
            <EventDetails />
            <CommentsSection />

            {!isAuthenticated && (
              <Button variant="primary" size="lg">
                Unirme a la conversación
              </Button>
            )}
          </div>

          <div className="space-y-10">
            <EventImage />
            <SimilarEvents />
          </div>
        </div>
      </main>
    </div>
  )
}
