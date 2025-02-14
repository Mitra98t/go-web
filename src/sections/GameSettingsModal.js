import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import React, { useState } from "react";
import { auth, db } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";


const delay = (ms) => new Promise((res) => setTimeout(res, ms));

export default function GameSettingsModal({ toggleModal }) {
  const [user] = useAuthState(auth);
  const [size, setSize] = useState(9);
  const [isPrivate, setIsPrivate] = useState(false);
  const [color, setColor] = useState("B");

  const createGame = async (e) => {
    e.preventDefault();
    const gamesRef = collection(db, "games");
    console.log(gamesRef);
    let gameDoc = await addDoc(gamesRef, {
      players: color === "B" ? { B: user.uid, W: "" } : { B: "", W: user.uid },
      turn: "B",
      boardArray: Array.from({ length: size * size }).fill(""),
      boardSize: size,
      snapBoard: { white: [], black: [] },
      captured: { white: 0, black: 0 },
      turnCount: 0,
      movesHystory: [],
      creationTimeMS: serverTimestamp(),
      isPrivate: isPrivate,
      closed: false,
      createdBy: user.uid,
      result: { score: { B: 0, W: 0 }, points: { B: [], W: [] } },
    });
    // copy the game id to the clipboard
    // redirect to the game page
    await delay(200);
    window.location.href = `/game/${gameDoc.id}`;

  };

  return (
    <div
      className="absolute flex items-center justify-center w-full h-screen bg-[#00000020]"
      onClick={toggleModal}
    >
      <form
        className="z-50 w-fit h-fit flex flex-col items-center justify-center gap-6 p-8 border-2 border-primary bg-base-300 rounded-lg"
        onSubmit={createGame}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full flex flex-col gap-2">
          <div className="w-full flex justify-between items-center gap-6">
            <label>Game Size</label>
            <select
              className=" cursor-pointer"
              name="size"
              value={size}
              onChange={(e) => {
                setSize(e.target.value);
              }}
            >
              <option value={9}>9x9</option>
              <option value={13}>13x13</option>
              <option value={19}>19x19</option>
            </select>
          </div>
          <div className="w-full flex justify-between items-center gap-6">
            <label>Private</label>
            <input
              className=" cursor-pointer"
              name="isPrivate"
              value={isPrivate}
              type="checkbox"
              onChange={(e) => {
                setIsPrivate(e.target.checked);
              }}
            />
          </div>
          <div className="w-full flex justify-between items-center gap-6">
            <label>Your color</label>
            <select
              className=" cursor-pointer"
              name="color"
              value={color}
              onChange={(e) => {
                if (e.target.value == "X") {
                  let random = Math.random() > 0.5;
                  if (random) {
                    setColor("W");
                    return;
                  }
                  setColor("B");
                  return;
                }
                setColor(e.target.value);
              }}
            >
              <option value="B">Black</option>
              <option value="W">White</option>
              <option value="X">Random</option>
            </select>
          </div>
        </div>
        <input
          type="submit"
          value="Submit"
          className="btn btn-outline btn-success cursor-pointer"
        />
      </form>
    </div>
  );
}
