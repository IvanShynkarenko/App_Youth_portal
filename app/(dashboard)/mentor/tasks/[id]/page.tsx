"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface TaskProgress {
  id: string
  status: string
  artifactUrl: string | null
  submittedAt: string | null
  task: {
    id: string
    title: string
    description: string
    weeklyPlan: {
      weekNumber: number
      title: string
    }
  }
  student: {
    id: string
    name: string
    email: string
  }
  feedbacks: Array<{
    id: string
    text: string
    createdAt: string
  }>
}

export default function MentorTaskReviewPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const [taskProgress, setTaskProgress] = useState<TaskProgress | null>(null)
  const [feedback, setFeedback] = useState("")
  const [action, setAction] = useState<"approve" | "request_changes" | null>(
    null
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch(`/api/mentor/tasks/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error)
        } else {
          setTaskProgress(data)
        }
      })
      .catch(() => setError("Failed to load task"))
  }, [params.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!action) return

    setError("")
    setLoading(true)

    try {
      const response = await fetch(`/api/mentor/tasks/${params.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          feedback: feedback || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to submit review")
        setLoading(false)
        return
      }

      router.push("/mentor")
      router.refresh()
    } catch (err) {
      setError("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  if (!taskProgress) {
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
              href="/mentor"
              className="text-sm text-muted-foreground hover:underline"
            >
              ← Back to Dashboard
            </Link>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Review Task Submission</CardTitle>
              <CardDescription>
                Week {taskProgress.task.weeklyPlan.weekNumber}:{" "}
                {taskProgress.task.weeklyPlan.title}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Student</h3>
                <p className="text-sm text-muted-foreground">
                  {taskProgress.student.name} ({taskProgress.student.email})
                </p>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold mb-2">Task</h3>
                <p className="font-medium">{taskProgress.task.title}</p>
                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">
                  {taskProgress.task.description}
                </p>
              </div>

              {taskProgress.artifactUrl && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Submission</h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <a
                      href={taskProgress.artifactUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline break-all"
                    >
                      {taskProgress.artifactUrl}
                    </a>
                    {taskProgress.submittedAt && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Submitted: {new Date(taskProgress.submittedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {taskProgress.feedbacks.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Previous Feedback</h3>
                  <div className="space-y-2">
                    {taskProgress.feedbacks.map((fb) => (
                      <div key={fb.id} className="bg-gray-50 p-3 rounded-md">
                        <p className="text-sm">{fb.text}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(fb.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="feedback">Feedback (optional)</Label>
                  <Textarea
                    id="feedback"
                    placeholder="Provide feedback to help the student improve..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={6}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    variant="default"
                    onClick={() => setAction("approve")}
                    disabled={loading}
                  >
                    Approve Task
                  </Button>
                  <Button
                    type="submit"
                    variant="outline"
                    onClick={() => setAction("request_changes")}
                    disabled={loading}
                  >
                    Request Changes
                  </Button>
                  <Link href="/mentor">
                    <Button type="button" variant="ghost">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

