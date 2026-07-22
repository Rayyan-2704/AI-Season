import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageLayout from "../components/layout/PageLayout";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import { useAuth } from "../context/AuthContext";

function Register() {
  const { register, login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await register(form);
      await login({ email: form.email, password: form.password });
      navigate("/planner");
    } catch (err) {
      const detail = err.response?.data?.message || "Something went wrong. Please try again.";
      setError(detail);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageLayout>
      <section className="mx-auto max-w-md px-6 py-20">
        <div className="text-center mb-10">
          <h1 className="text-4xl text-charcoal">Start your story</h1>
          <p className="text-charcoal/70 mt-3">
            Create an account to plan your first narrative itinerary.
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-terracotta/10 border border-terracotta/30 text-terracotta text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs uppercase tracking-wide text-charcoal/50 mb-2">
                Name
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full border border-charcoal/15 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-terracotta"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wide text-charcoal/50 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full border border-charcoal/15 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-terracotta"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wide text-charcoal/50 mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={8}
                className="w-full border border-charcoal/15 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-terracotta"
                placeholder="At least 8 characters"
              />
            </div>

            <Button type="submit" variant="primary" isLoading={isLoading} className="w-full">
              Create account
            </Button>
          </form>
        </Card>

        <p className="text-center text-sm text-charcoal/60 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-terracotta hover:opacity-80">
            Log in
          </Link>
        </p>
      </section>
    </PageLayout>
  );
}

export default Register;