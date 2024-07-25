import React, { useEffect } from "react";
import Navbar from "../sections/Navbar";
import GameData from "../components/GameData";
import { auth } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";

export default function Profile() {
  const [user] = useAuthState(auth);
  useEffect(() => {
    if (!user && window.location.pathname !== "/") {
      window.location.href = "/";
    }
  }, [user]);
  return (
    <div className="animationWrapper w-full h-screen flex flex-col items-center gap-4 bg-base-300">
      <Navbar />
      <button
        className="btn btn-outline btn-warning"
        onClick={() => auth.signOut()}
      >
        Logout
      </button>
      <GameData privateGames />
    </div>
  );
}
