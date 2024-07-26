import React, { useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import ProfilePic from "../components/ProfilePic";
import { addDoc, collection, doc, setDoc } from "firebase/firestore";
import { useDocumentOnce } from "react-firebase-hooks/firestore";
import { Link } from "react-router-dom";

export default function Navbar() {
  const [user] = useAuthState(auth);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    let res = await signInWithPopup(auth, provider);
    let userData = {
      displayName: res.user.displayName,
      email: res.user.email,
    };

    await setDoc(doc(db, "users", res.user.uid), userData, { merge: true });
  };

  return (
    <div className="w-full h-24 bg-base-100 flex items-center px-12 flex-row-reverse justify-between">
      {user ? (
        <Link
          to={`/profile/${user.uid}`}
          className="h-2/3 aspect-square border-2 border-primary rounded-full"
        >
          <ProfilePic />
        </Link>
      ) : (
        <button onClick={signInWithGoogle}>Login</button>
      )}
      <Link to="/" className=" text-2xl font-bold text-base-content">
        Home
      </Link>
    </div>
  );
}
