"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Internship {
  id: string
  title: string
  durationInWeeks: number
}

export default function ApplyPage({
  params,
}: {
  params: { id: string }
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [internship, setInternship] = useState<Internship | null>(null)
  const [formData, setFormData] = useState({
    motivation: "",
    interests: "",
    city: "",
    linkedinUrl: "",
    portfolioUrl: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/auth/login?redirect=/internships/${params.id}/apply`)
      return
    }

    if (status === "authenticated" && session?.user.role !== "STUDENT") {
      router.push("/")
      return
    }

    // Fetch internship details
    fetch(`/api/internships/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error)
        } else {
          setInternship(data)
          // Pre-fill user data
          if (session?.user) {
            setFormData((prev) => ({
              ...prev,
              city: session.user.name || "",
            }))
          }
        }
      })
      .catch(() => setError("Failed to load internship"))
  }, [status, session, router, params.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch(`/api/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          microInternshipId: params.id,
          ...formData,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to submit application")
        setLoading(false)
        return
      }

      router.push(`/applications/${data.applicationId}`)
    } catch (err) {
      setError("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!internship) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-red-600">{error || "Internship not found"}</p>
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
              href={`/internships/${params.id}`}
              className="text-sm text-muted-foreground hover:underline"
            >
              ← Back to internship details
            </Link>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Apply for: {internship.title}</CardTitle>
              <CardDescription>
                Complete this short form to apply. NGO will respond within 48
                hours.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="motivation">
                    Motivation (3-5 bullet points)
                  </Label>
                  <Textarea
                    id="motivation"
                    placeholder="- Why you're interested in this internship&#10;- What you hope to learn&#10;- Relevant experience or skills"
                    value={formData.motivation}
                    onChange={(e) =>
                      setFormData({ ...formData, motivation: e.target.value })
                    }
                    required
                    rows={6}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use bullet points (start each line with -)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interests">Interests</Label>
                  <Input
                    id="interests"
                    placeholder="e.g., IT, Web Development, Design"
                    value={formData.interests}
                    onChange={(e) =>
                      setFormData({ ...formData, interests: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="Your city"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="linkedinUrl">LinkedIn URL (optional)</Label>
                  <Input
                    id="linkedinUrl"
                    type="url"
                    placeholder="https://linkedin.com/in/yourprofile"
                    value={formData.linkedinUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, linkedinUrl: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="portfolioUrl">
                    Portfolio/GitHub URL (optional)
                  </Label>
                  <Input
                    id="portfolioUrl"
                    type="url"
                    placeholder="https://github.com/yourusername"
                    value={formData.portfolioUrl}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        portfolioUrl: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-md">
                  <h4 className="font-semibold mb-2 text-sm">
                    Example of a strong application:
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Clear passion for the field</li>
                    <li>Specific learning goals mentioned</li>
                    <li>Relevant experience or projects highlighted</li>
                    <li>Shows commitment and enthusiasm</li>
                    <li>Professional but authentic tone</li>
                  </ul>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? "Submitting..." : "Submit Application"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

