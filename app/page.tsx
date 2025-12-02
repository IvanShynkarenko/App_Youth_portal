import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { prisma } from "@/lib/prisma"

async function getInternships() {
  return await prisma.microInternship.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    take: 10,
  })
}

export default async function HomePage() {
  const internships = await getInternships()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-5xl font-bold mb-6">
                Find a Micro-Internship in 4–6 Weeks
              </h1>
              <p className="text-xl mb-8 text-blue-100">
                Connect with mentors, build real projects, and grow your skills
                through short, focused internships designed for teenagers.
              </p>
              <div className="flex gap-4 justify-center">
                <Link href="#internships">
                  <Button size="lg" variant="secondary">
                    Browse Internships
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Internships List */}
        <section id="internships" className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8 text-center">
              Available Micro-Internships
            </h2>
            {internships.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No internships available at the moment. Check back soon!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {internships.map((internship) => (
                  <Card key={internship.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{internship.title}</CardTitle>
                          <CardDescription className="mt-2">
                            {internship.durationInWeeks} weeks
                          </CardDescription>
                        </div>
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                          {internship.durationInWeeks}w
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                        {internship.description}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {internship.tags.split(",").map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 text-xs bg-gray-100 rounded"
                          >
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/internships/${internship.id}`}
                          className="flex-1"
                        >
                          <Button variant="outline" className="w-full">
                            View Details
                          </Button>
                        </Link>
                        <Link
                          href={`/internships/${internship.id}/apply`}
                          className="flex-1"
                        >
                          <Button className="w-full">Apply</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-12 text-center">
              Why Choose Micro-Internships?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-4xl mb-4">⚡</div>
                <h3 className="text-xl font-semibold mb-2">Quick & Focused</h3>
                <p className="text-muted-foreground">
                  3-6 week programs designed to fit your schedule
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-xl font-semibold mb-2">Real Projects</h3>
                <p className="text-muted-foreground">
                  Work on actual projects and build your portfolio
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">👥</div>
                <h3 className="text-xl font-semibold mb-2">Expert Mentors</h3>
                <p className="text-muted-foreground">
                  Get guidance from industry professionals
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-gray-400">
            © 2024 Youth Portal. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

