import { notFound, redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/prisma"
import { formatDate } from "@/lib/utils"
import Link from "next/link"

async function getInternshipDetails(
  internshipId: string,
  studentId: string
) {
  const application = await prisma.application.findFirst({
    where: {
      microInternshipId: internshipId,
      studentId,
      status: {
        in: ["IN_PROGRESS", "MENTOR_ASSIGNED"],
      },
    },
    include: {
      microInternship: {
        include: {
          weeklyPlans: {
            orderBy: { weekNumber: "asc" },
            include: {
              tasks: {
                include: {
                  artifactTemplate: true,
                  taskProgresses: {
                    where: { studentId },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  return application
}

export default async function InternshipDetailDashboardPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "STUDENT") {
    redirect("/auth/login")
  }

  const application = await getInternshipDetails(
    params.id,
    session.user.id
  )

  if (!application) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:underline"
            >
              ← Back to Dashboard
            </Link>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-2xl">
                {application.microInternship.title}
              </CardTitle>
              <CardDescription>
                {application.microInternship.durationInWeeks} weeks
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="space-y-6">
            {application.microInternship.weeklyPlans.map((week) => (
              <Card key={week.id}>
                <CardHeader>
                  <CardTitle>
                    Week {week.weekNumber}: {week.title}
                  </CardTitle>
                  <CardDescription>{week.description}</CardDescription>
                  {week.deadlineAt && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Deadline: {formatDate(week.deadlineAt)}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {week.tasks.map((task) => {
                      const progress = task.taskProgresses[0]
                      const status = progress?.status || "PENDING"

                      return (
                        <div
                          key={task.id}
                          className="border rounded-lg p-4 space-y-3"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold">{task.title}</h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                {task.description}
                              </p>
                              <span className="inline-block mt-2 px-2 py-1 text-xs bg-gray-100 rounded">
                                {task.type}
                              </span>
                            </div>
                            <div className="ml-4">
                              <span
                                className={`px-2 py-1 text-xs rounded ${
                                  status === "APPROVED"
                                    ? "bg-green-100 text-green-800"
                                    : status === "SUBMITTED"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : status === "IN_PROGRESS"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {status}
                              </span>
                            </div>
                          </div>

                          {task.artifactTemplate && (
                            <div className="bg-blue-50 p-3 rounded-md">
                              <h5 className="text-sm font-semibold mb-2">
                                Template: {task.artifactTemplate.name}
                              </h5>
                              <p className="text-xs text-muted-foreground mb-2">
                                {task.artifactTemplate.description}
                              </p>
                              <details className="text-xs">
                                <summary className="cursor-pointer text-primary hover:underline">
                                  View template
                                </summary>
                                <pre className="mt-2 p-2 bg-white rounded text-xs overflow-auto">
                                  {task.artifactTemplate.body}
                                </pre>
                              </details>
                            </div>
                          )}

                          {progress && progress.artifactUrl && (
                            <div className="bg-gray-50 p-3 rounded-md">
                              <p className="text-sm font-semibold mb-1">
                                Your submission:
                              </p>
                              <a
                                href={progress.artifactUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline"
                              >
                                {progress.artifactUrl}
                              </a>
                              {progress.submittedAt && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Submitted: {formatDate(progress.submittedAt)}
                                </p>
                              )}
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Link
                              href={`/dashboard/tasks/${task.id}`}
                              className="flex-1"
                            >
                              <Button
                                variant={
                                  status === "PENDING" ? "default" : "outline"
                                }
                                className="w-full"
                              >
                                {status === "PENDING"
                                  ? "Start Task"
                                  : status === "APPROVED"
                                  ? "View Task"
                                  : "Update Task"}
                              </Button>
                            </Link>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

