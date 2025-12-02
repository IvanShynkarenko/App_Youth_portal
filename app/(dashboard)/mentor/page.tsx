import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { formatDate } from "@/lib/utils"

async function getMentorAssignments(mentorId: string) {
  return await prisma.mentorAssignment.findMany({
    where: { mentorId },
    include: {
      application: {
        include: {
          student: true,
          microInternship: {
            include: {
              weeklyPlans: {
                include: {
                  tasks: {
                    include: {
                      taskProgresses: {
                        where: {
                          status: {
                            in: ["SUBMITTED", "IN_PROGRESS"],
                          },
                        },
                        include: {
                          feedbacks: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })
}

export default async function MentorDashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/login")
  }

  if (session.user.role !== "MENTOR") {
    redirect("/")
  }

  const assignments = await getMentorAssignments(session.user.id)

  // Calculate stats
  const tasksNeedingFeedback = assignments.reduce(
    (sum, assignment) =>
      sum +
      assignment.application.microInternship.weeklyPlans.reduce(
        (weekSum, week) =>
          weekSum +
          week.tasks.reduce(
            (taskSum, task) =>
              taskSum +
              task.taskProgresses.filter(
                (tp) => tp.status === "SUBMITTED"
              ).length,
            0
          ),
        0
      ),
    0
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Mentor Dashboard</h1>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Assigned Students</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{assignments.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tasks Needing Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{tasksNeedingFeedback}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">SLA Mode</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {assignments[0]?.slaMode || "LIGHT"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  1 check-in per week; replies ideally within 48 hours
                </p>
              </CardContent>
            </Card>
          </div>

          {assignments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  You don't have any assigned students yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {assignments.map((assignment) => (
                <Card key={assignment.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>
                          {assignment.application.student.name}
                        </CardTitle>
                        <CardDescription>
                          {assignment.application.microInternship.title}
                        </CardDescription>
                      </div>
                      <Link
                        href={`/mentor/students/${assignment.application.student.id}`}
                      >
                        <Button>View Details</Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {assignment.application.microInternship.weeklyPlans.map(
                        (week) => (
                          <div key={week.id} className="border rounded-lg p-4">
                            <h3 className="font-semibold mb-3">
                              Week {week.weekNumber}: {week.title}
                            </h3>
                            <div className="space-y-2">
                              {week.tasks.map((task) => {
                                const progress = task.taskProgresses[0]
                                if (!progress) return null

                                return (
                                  <div
                                    key={task.id}
                                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                                  >
                                    <div className="flex-1">
                                      <p className="text-sm font-medium">
                                        {task.title}
                                      </p>
                                      {progress.artifactUrl && (
                                        <a
                                          href={progress.artifactUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-xs text-primary hover:underline"
                                        >
                                          View submission
                                        </a>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`px-2 py-1 text-xs rounded ${
                                          progress.status === "SUBMITTED"
                                            ? "bg-yellow-100 text-yellow-800"
                                            : "bg-gray-100 text-gray-800"
                                        }`}
                                      >
                                        {progress.status}
                                      </span>
                                      <Link
                                        href={`/mentor/tasks/${progress.id}`}
                                      >
                                        <Button size="sm" variant="outline">
                                          Review
                                        </Button>
                                      </Link>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Availability & SLA</CardTitle>
            </CardHeader>
            <CardContent>
              <Link href="/mentor/availability">
                <Button variant="outline">Manage Availability</Button>
              </Link>
              <p className="text-sm text-muted-foreground mt-4">
                SLA-Light expectations: 1 check-in per week; replies ideally
                within 48 hours. Your current mode:{" "}
                {assignments[0]?.slaMode || "LIGHT"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

