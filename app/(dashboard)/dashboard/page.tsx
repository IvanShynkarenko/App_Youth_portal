import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { formatDate } from "@/lib/utils"

async function getStudentApplications(userId: string) {
  return await prisma.application.findMany({
    where: {
      studentId: userId,
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
                  taskProgresses: {
                    where: { studentId: userId },
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

export default async function StudentDashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/login")
  }

  if (session.user.role !== "STUDENT") {
    redirect("/")
  }

  const applications = await getStudentApplications(session.user.id)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">My Dashboard</h1>

          {applications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">
                  You don't have any active internships yet.
                </p>
                <Link href="/">
                  <Button>Browse Internships</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {applications.map((application) => {
                const totalWeeks = application.microInternship.durationInWeeks
                const currentWeek = Math.min(
                  totalWeeks,
                  Math.floor(
                    (Date.now() -
                      (application.startedAt
                        ? new Date(application.startedAt).getTime()
                        : Date.now())) /
                      (7 * 24 * 60 * 60 * 1000)
                  ) + 1
                )

                const totalTasks = application.microInternship.weeklyPlans.reduce(
                  (sum, week) => sum + week.tasks.length,
                  0
                )
                const completedTasks = application.microInternship.weeklyPlans.reduce(
                  (sum, week) =>
                    sum +
                    week.tasks.filter(
                      (task) =>
                        task.taskProgresses[0]?.status === "APPROVED"
                    ).length,
                  0
                )

                return (
                  <Card key={application.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>
                            {application.microInternship.title}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            Week {currentWeek} of {totalWeeks}
                          </CardDescription>
                        </div>
                        <Link
                          href={`/dashboard/internships/${application.microInternship.id}`}
                        >
                          <Button>View Details</Button>
                        </Link>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>
                            {completedTasks} / {totalTasks} tasks completed
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{
                              width: `${(completedTasks / totalTasks) * 100}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        {application.microInternship.weeklyPlans.map((week) => {
                          const weekTasks = week.tasks
                          const completedWeekTasks = weekTasks.filter(
                            (task) =>
                              task.taskProgresses[0]?.status === "APPROVED"
                          ).length

                          return (
                            <div
                              key={week.id}
                              className="border rounded-lg p-4"
                            >
                              <h3 className="font-semibold mb-2">
                                Week {week.weekNumber}
                              </h3>
                              <p className="text-sm text-muted-foreground mb-3">
                                {week.title}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {completedWeekTasks} / {weekTasks.length} tasks
                                completed
                              </p>
                              {week.deadlineAt && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Due: {formatDate(week.deadlineAt)}
                                </p>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

