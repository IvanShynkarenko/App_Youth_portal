import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { prisma } from "@/lib/prisma"
import { formatDate } from "@/lib/utils"

const statusSteps = [
  { key: "SUBMITTED", label: "Submitted", description: "Application received" },
  { key: "REVIEWED", label: "Reviewed", description: "Under review" },
  { key: "MENTOR_ASSIGNED", label: "Mentor Assigned", description: "Mentor matched" },
  { key: "IN_PROGRESS", label: "In Progress", description: "Internship started" },
  { key: "COMPLETED", label: "Completed", description: "Internship finished" },
]

async function getApplication(id: string, userId: string) {
  return await prisma.application.findFirst({
    where: {
      id,
      studentId: userId,
    },
    include: {
      microInternship: true,
      mentorAssignment: {
        include: {
          mentor: true,
        },
      },
      feedbacks: {
        include: {
          author: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })
}

export default async function ApplicationStatusPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "STUDENT") {
    notFound()
  }

  const application = await getApplication(params.id, session.user.id)

  if (!application) {
    notFound()
  }

  const currentStatusIndex = statusSteps.findIndex(
    (step) => step.key === application.status
  )

  // Calculate ETA for response (48 hours from submission)
  const responseEta = application.submittedAt
    ? new Date(
        new Date(application.submittedAt).getTime() + 48 * 60 * 60 * 1000
      )
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Application Status</CardTitle>
              <CardDescription>
                {application.microInternship.title}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Status Timeline */}
              <div className="mb-8">
                <div className="relative">
                  {statusSteps.map((step, index) => {
                    const isActive = index <= currentStatusIndex
                    const isCurrent = index === currentStatusIndex

                    return (
                      <div key={step.key} className="flex items-start mb-6">
                        <div className="flex flex-col items-center mr-4">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                              isActive
                                ? "bg-primary text-white"
                                : "bg-gray-200 text-gray-500"
                            }`}
                          >
                            {index + 1}
                          </div>
                          {index < statusSteps.length - 1 && (
                            <div
                              className={`w-0.5 h-12 ${
                                isActive ? "bg-primary" : "bg-gray-200"
                              }`}
                            />
                          )}
                        </div>
                        <div className="flex-1 pt-1">
                          <h3
                            className={`font-semibold ${
                              isCurrent ? "text-primary" : ""
                            }`}
                          >
                            {step.label}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {step.description}
                          </p>
                          {isCurrent && (
                            <p className="text-xs text-primary mt-1">
                              Current status
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Status-specific information */}
              {application.status === "SUBMITTED" && (
                <div className="bg-blue-50 p-4 rounded-md mb-4">
                  <p className="text-sm">
                    <strong>Next step:</strong> NGO will review your application
                    within 48 hours.
                  </p>
                  {responseEta && (
                    <p className="text-sm mt-1 text-muted-foreground">
                      Expected response by: {formatDate(responseEta)}
                    </p>
                  )}
                </div>
              )}

              {application.status === "REVIEWED" && (
                <div className="bg-yellow-50 p-4 rounded-md mb-4">
                  <p className="text-sm">
                    Your application is being reviewed. You will be notified when
                    a mentor is assigned.
                  </p>
                </div>
              )}

              {application.status === "MENTOR_ASSIGNED" &&
                application.mentorAssignment && (
                  <div className="bg-green-50 p-4 rounded-md mb-4">
                    <p className="text-sm">
                      <strong>Mentor assigned:</strong>{" "}
                      {application.mentorAssignment.mentor.name}
                    </p>
                    <p className="text-sm mt-1 text-muted-foreground">
                      Your internship will begin soon. Check your dashboard for
                      updates.
                    </p>
                  </div>
                )}

              {application.status === "IN_PROGRESS" && (
                <div className="bg-green-50 p-4 rounded-md mb-4">
                  <p className="text-sm">
                    Your internship is in progress! Visit your dashboard to see
                    weekly tasks and submit your work.
                  </p>
                  <a
                    href="/dashboard"
                    className="text-sm text-primary hover:underline mt-2 inline-block"
                  >
                    Go to Dashboard →
                  </a>
                </div>
              )}

              {application.status === "COMPLETED" && (
                <div className="bg-green-50 p-4 rounded-md mb-4">
                  <p className="text-sm font-semibold">
                    Congratulations! You've completed the internship.
                  </p>
                </div>
              )}

              {application.status === "REJECTED" && (
                <div className="bg-red-50 p-4 rounded-md mb-4">
                  <p className="text-sm">
                    <strong>Application not accepted.</strong>
                    {application.rejectionReason && (
                      <span className="block mt-1">
                        {application.rejectionReason}
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* Application Details */}
              <div className="mt-6 space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Your Application</h4>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-sm whitespace-pre-line">
                      {application.motivation}
                    </p>
                  </div>
                </div>

                {application.feedbacks.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Feedback</h4>
                    <div className="space-y-2">
                      {application.feedbacks.map((feedback) => (
                        <div
                          key={feedback.id}
                          className="bg-gray-50 p-4 rounded-md"
                        >
                          <p className="text-sm">{feedback.text}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {feedback.author.name} • {formatDate(feedback.createdAt)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* FAQ Section */}
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-1">
                    How long does the review process take?
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Typically within 48 hours of submission.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">
                    What happens after I'm accepted?
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    You'll be matched with a mentor and receive access to your
                    weekly tasks and dashboard.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">
                    Can I apply to multiple internships?
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Yes, but we recommend focusing on one at a time for the
                    best experience.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

