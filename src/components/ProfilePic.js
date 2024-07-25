import React from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase";

export default function ProfilePic({ seed = null, flip = false }) {
  const [user] = useAuthState(auth);
  return (
    <img
      src={`https://api.dicebear.com/8.x/adventurer/svg?seed=${
        seed == null ? user.email : seed
      }`}
      alt="avatar"
      className={` rounded-full object-cover w-full aspect-square ${
        flip ? "-scale-x-100" : ""
      }`}
    />
  );
}
