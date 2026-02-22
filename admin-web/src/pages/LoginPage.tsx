import { FormEvent, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

export function LoginPage() {
  const { user, login, loading } = useAuth();
  const [email, setEmail] = useState("admin@ecoact.app");
  const [name, setName] = useState("Community Admin");
  const [error, setError] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    return <Navigate to="/overview" replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login({
        email: email.trim() || undefined,
        name: name.trim() || undefined,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-shell">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>EcoAct Admin</h1>
        <p>Web dashboard for community admins</p>

        <label>
          Admin Email
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="admin@ecoact.app"
          />
        </label>

        <label>
          Display Name (optional)
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            type="text"
            placeholder="Community Admin"
          />
        </label>

        {error ? <p className="error">{error}</p> : null}

        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? "Signing in..." : "Sign in (Demo Admin)"}
        </button>
      </form>
    </div>
  );
}
