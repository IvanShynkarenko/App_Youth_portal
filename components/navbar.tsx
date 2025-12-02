"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"

export function Navbar() {
  const { data: session } = useSession()

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-primary">
            Youth Portal
          </Link>
          <div className="flex items-center gap-4">
            {session ? (
              <>
                <Link href="/dashboard" className="text-sm hover:underline">
                  Dashboard
                </Link>
                {session.user.role === "MENTOR" && (
                  <Link href="/mentor" className="text-sm hover:underline">
                    Mentor Portal
                  </Link>
                )}
                {session.user.role === "ADMIN" && (
                  <Link href="/admin" className="text-sm hover:underline">
                    Admin Portal
                  </Link>
                )}
                <span className="text-sm text-muted-foreground">
                  {session.user.name}
                </span>
                <Button variant="outline" size="sm" onClick={() => signOut()}>
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

