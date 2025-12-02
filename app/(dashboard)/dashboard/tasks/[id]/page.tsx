"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface Task {
  id: string
  title: string
  description: string
  type: string
  internshipId: string
  artifactTemplate?: {
    name: string
    description: string
    body: string
  }
  taskProgress?: {
    id: string
    status: string
    artifactUrl: string | null
  }
  weeklyPlan: {
    weekNumber: number
    title: string
  }
}

export default function TaskPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [task, setTask] = useState<Task | null>(null)
  const [artifactUrl, setArtifactUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch(`/api/tasks/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error)
        } else {
          setTask(data)
          if (data.taskProgress?.artifactUrl) {
            setArtifactUrl(data.taskProgress.artifactUrl)
          }
        }
      })
      .catch(() => setError("Failed to load task"))
  }, [params.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch(`/api/tasks/${params.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artifactUrl }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to submit task")
        setLoading(false)
        return
      }

      router.push(`/dashboard/internships/${data.internshipId}`)
      router.refresh()
    } catch (err) {
      setError("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  if (!task) {
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
              href={`/dashboard/internships/${task.internshipId}`}
              className="text-sm text-muted-foreground hover:underline"
            >
              ← Back to Week {task.weeklyPlan.weekNumber}
            </Link>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{task.title}</CardTitle>
              <CardDescription>
                Week {task.weeklyPlan.weekNumber}: {task.weeklyPlan.title}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none mb-6">
                <p className="whitespace-pre-line">{task.description}</p>
              </div>

              {task.artifactTemplate && (
                <div className="bg-blue-50 p-4 rounded-md mb-6">
                  <h4 className="font-semibold mb-2">
                    Template: {task.artifactTemplate.name}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    {task.artifactTemplate.description}
                  </p>
                  <details>
                    <summary className="cursor-pointer text-sm text-primary hover:underline mb-2">
                      View template
                    </summary>
                    <pre className="mt-2 p-3 bg-white rounded text-xs overflow-auto whitespace-pre-wrap">
                      {task.artifactTemplate.body}
                    </pre>
                  </details>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="artifactUrl">
                    Artifact URL or Content
                  </Label>
                  <Textarea
                    id="artifactUrl"
                    placeholder="Paste a link to your work (GitHub, Google Docs, etc.) or write your content here"
                    value={artifactUrl}
                    onChange={(e) => setArtifactUrl(e.target.value)}
                    required
                    rows={8}
                  />
                  <p className="text-xs text-muted-foreground">
                    You can submit a link to your work or paste the content
                    directly.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={loading || !artifactUrl.trim()}
                  >
                    {loading
                      ? "Submitting..."
                      : task.taskProgress?.status === "SUBMITTED"
                      ? "Update Submission"
                      : "Submit Task"}
                  </Button>
                  <Link href={`/dashboard/internships/${task.internshipId}`}>
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </form>

              {task.taskProgress?.status === "APPROVED" && (
                <div className="mt-4 p-3 bg-green-50 rounded-md">
                  <p className="text-sm text-green-800">
                    ✓ This task has been approved by your mentor!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

