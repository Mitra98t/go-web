import "../App.css";
import React, { useEffect, useState } from "react";
import Navbar from "../sections/Navbar";
import GameSettingsModal from "../sections/GameSettingsModal";
import {
  useCollection,
  useCollectionOnce,
} from "react-firebase-hooks/firestore";
import { collection, doc } from "firebase/firestore";
import { auth, db } from "../firebase";
import ProfilePic from "../components/ProfilePic";
import { Link } from "react-router-dom";
import GameData from "../components/GameData";
import { useAuthState } from "react-firebase-hooks/auth";

export default function Home() {
  const [user] = useAuthState(auth);
  useEffect(() => {
    if (!user && window.location.pathname !== "/") {
      window.location.href = "/";
    }
  }, [user]);
  const [modal, setModal] = useState(false);

  const toggleModal = () => {
    setModal(!modal);
  };

  return (
    <div className="animationWrapper w-full h-screen flex flex-col items-center gap-4 bg-base-300">
      <Navbar />
      {user ? (
        <button
          className="btn btn-primary btn-sm md:btn-md lg:btn-lg btn-wide"
          onClick={toggleModal}
        >
          New Game
        </button>
      ) : (
        <p className=" whitespace-nowrap w-fit">Log in to start a new game</p>
      )}
      {modal && <GameSettingsModal toggleModal={toggleModal} />}
      <GameData />
    </div>
  );
}
