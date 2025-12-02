"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface Application {
  id: string
  status: string
  motivation: string
  student: {
    id: string
    name: string
    email: string
  }
  microInternship: {
    id: string
    title: string
  }
  mentorAssignment?: {
    mentor: {
      id: string
      name: string
    }
  }
}

interface Mentor {
  id: string
  name: string
  email: string
}

export default function AdminApplicationReviewPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const [application, setApplication] = useState<Application | null>(null)
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [selectedMentorId, setSelectedMentorId] = useState("")
  const [status, setStatus] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/applications/${params.id}`).then((res) => res.json()),
      fetch("/api/admin/mentors").then((res) => res.json()),
    ]).then(([appData, mentorsData]) => {
      if (appData.error) {
        setError(appData.error)
      } else {
        setApplication(appData)
        setStatus(appData.status)
        if (appData.mentorAssignment) {
          setSelectedMentorId(appData.mentorAssignment.mentor.id)
        }
      }
      if (mentorsData.error) {
        console.error(mentorsData.error)
      } else {
        setMentors(mentorsData)
      }
    })
  }, [params.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch(`/api/admin/applications/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          mentorId: selectedMentorId || undefined,
          notes: notes || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to update application")
        setLoading(false)
        return
      }

      router.push("/admin/applications")
      router.refresh()
    } catch (err) {
      setError("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <p>{error || "Loading..."}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <Link
              href="/admin/applications"
              className="text-sm text-muted-foreground hover:underline"
            >
              ← Back to Applications
            </Link>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Review Application</CardTitle>
              <CardDescription>
                {application.microInternship.title}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Student</h3>
                  <p className="text-sm">
                    {application.student.name} ({application.student.email})
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Motivation</h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-sm whitespace-pre-line">
                      {application.motivation}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <select
                      id="status"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      required
                    >
                      <option value="SUBMITTED">Submitted</option>
                      <option value="REVIEWED">Reviewed</option>
                      <option value="MENTOR_ASSIGNED">Mentor Assigned</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mentor">Assign Mentor</Label>
                    <select
                      id="mentor"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={selectedMentorId}
                      onChange={(e) => setSelectedMentorId(e.target.value)}
                    >
                      <option value="">No mentor</option>
                      {mentors.map((mentor) => (
                        <option key={mentor.id} value={mentor.id}>
                          {mentor.name} ({mentor.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (optional)</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={loading}>
                      {loading ? "Saving..." : "Update Application"}
                    </Button>
                    <Link href="/admin/applications">
                      <Button type="button" variant="outline">
                        Cancel
                      </Button>
                    </Link>
                  </div>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

