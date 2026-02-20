/**
 * Login Page
 *
 * Firebase authentication page. Will include:
 * - Email/password login form
 * - Email/password registration form
 * - Google sign-in button
 * - Redirect to /home on successful auth
 */

export default function Login() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="bg-surface p-8 rounded-lg max-w-md w-full">
        <h1 className="text-3xl font-heading text-primary mb-4 text-center">
          Login
        </h1>
        <p className="text-accent font-body text-center">
          Authentication form will appear here.
        </p>
      </div>
    </div>
  )
}
