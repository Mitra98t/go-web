import React, { useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { Link } from "react-router-dom";
import { auth } from "../firebase";
export default function NotFound() {
  const [user] = useAuthState(auth);
  useEffect(() => {
    if (!user && window.location.pathname !== "/") {
      window.location.href = "/";
    }
  }, [user]);
  return (
    <div className="flex flex-col gap-2">
      <p>404 Not Found</p>
      <Link to="/">Go to Home</Link>
    </div>
  );
}
