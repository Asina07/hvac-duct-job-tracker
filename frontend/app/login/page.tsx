"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }
    // 1. set loading true
    setLoading(true);
    // 2. call login(email, password)
    try {
      const response = await login(email, password, name);
      // 3. save token to localStorage
      localStorage.setItem("token", response.token);
      // 4. redirect to dashboard
      router.push("/dashboard");
    } catch (err) {
      // 5. if error, set error message
      setError("Invalid email or password");
    } finally {
      // 6. set loading false
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-full max-w-xs">
          <form className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="name"
              >
                Username
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                type="text"
                placeholder="Username"
              />
            <p className="text-gray-600 text-xs italic ">Demo User</p>

            </div>
            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="email"
              >
                Email
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="text"
                placeholder="Email"
              />
            <p className="text-gray-600 text-xs italic">demo@hvactracker.com</p>
            </div>
            <div className="mb-6">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="password"
              >
                Password
              </label>
              <input
                className="shadow appearance-none border border-red-500 rounded w-full py-2 px-3 text-gray-700  leading-tight focus:outline-none focus:shadow-outline"
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="******************"
              />
            <p className="text-gray-600 text-xs italic ">abcd@1234</p>

              {error && <p className="text-red-500 text-xs italic">{error}</p>}
            </div>
            <div className="flex items-center justify-center">
              <button
                onClick={handleSubmit}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                type="button"
              >
                {loading ? "Logging in..." : "Sign In"}
              </button>
              
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
