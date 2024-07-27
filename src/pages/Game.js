import "../App.css";
import React, { useEffect, useState } from "react";
import Stone from "../components/Stone";
import { useDocument } from "react-firebase-hooks/firestore";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { Link, useParams } from "react-router-dom";
import PlayerCard from "../components/PlayerCard";
import { useAuthState } from "react-firebase-hooks/auth";

export default function Game() {
  const [user] = useAuthState(auth);
  useEffect(() => {
    if (!user && window.location.pathname !== "/") {
      window.location.href = "/";
    }
  }, [user]);
  const params = useParams();
  const gameID = params.game;
  const [game, loading, error] = useDocument(doc(db, "games", gameID), {
    snapshotListenOptions: { includeMetadataChanges: true },
  });

  useEffect(() => {
    if (!game) return;
    let userID = auth.currentUser.uid;
    if (game.data().players.B === userID || game.data().players.W === userID) {
      return;
    }

    if (game.data().players.B === "") {
      updateDoc(doc(db, "games", gameID), {
        players: { B: userID, W: game.data().players.W },
      });
    } else if (game.data().players.W === "") {
      updateDoc(doc(db, "games", gameID), {
        players: { B: game.data().players.B, W: userID },
      });
    }
  }, [game, gameID]);

  const isVerticalMonitor = useIsWindowVertical();

  const onForfait = async () => {
    if (game.data().closed) {
      return;
    }
    let { players, boardArray, boardSize, captured } = game.data();

    let colorForfeit = auth.currentUser.uid === players.B ? "B" : "W";

    let result = calculateScore(boardArray, boardSize, captured);

    result.score[colorForfeit] = 0;
    result.points[colorForfeit] = [];

    await updateDoc(doc(db, "games", gameID), {
      closed: true,
      result,
    });
  };

  const onPass = async () => {
    if (
      game.data().players[game.data().turn] !== auth.currentUser.uid ||
      game.data().closed
    ) {
      return;
    }
    let { turn, movesHystory, turnCount, closed } = game.data();
    if (
      movesHystory.length > 0 &&
      movesHystory[movesHystory.length - 1].move === "pass"
    ) {
      closed = true;
    }
    movesHystory.push({
      turn,
      player: turn === "B" ? "black" : "white",
      move: "pass",
    });
    let result;
    if (closed) {
      result = calculateScore(
        game.data().boardArray,
        game.data().boardSize,
        game.data().captured,
      );
    }
    await updateDoc(doc(db, "games", gameID), {
      turn: turn === "B" ? "W" : "B",
      movesHystory,
      turnCount: turnCount + 1,
      closed,
      result: closed
        ? { score: result.score, points: result.points }
        : { score: { B: 0, W: 0 }, points: { B: [], W: [] } },
    });
    console.log(game.data());
  };

  if (error) {
    return <div>Error: {error.message}</div>;
  } else if (loading) {
    return <div>Loading...</div>;
  } else if (!game) {
    return <div>The game does not exists</div>;
  } else
    return (
      <div
        className={`animationWrapper bg-base-300 w-full h-dvh flex ${
          isVerticalMonitor
            ? " flex-col p-4 gap-4 justify-evenly "
            : " flex-row justify-end "
        } items-center `}
      >
        {/* Player cards on top on mobile */}
        {isVerticalMonitor ? (
          <div className="w-full">
            {getPlayerCards(game, isVerticalMonitor)}
          </div>
        ) : (
          <></>
        )}
        {/* GOBAN */}
        <div
          className={`${
            isVerticalMonitor
              ? "w-full"
              : "h-full w-full flex items-center justify-center "
          }`}
        >
          <div
            className={`${
              isVerticalMonitor ? "w-full" : "h-4/5"
            } aspect-square`}
            id="goban"
          >
            <div
              style={{
                gridTemplateColumns: `repeat(${
                  game.data().boardSize - 1
                }, 1fr)`,
                gridTemplateRows: `repeat(${game.data().boardSize - 1}, 1fr)`,
                padding: `calc(100%/${game.data().boardSize * 2})`,
              }}
              className={`relative grid w-full h-full bg-neutral-content border border-neutral rounded-lg p-[calc(100%/18)]`}
            >
              {Array.from({
                length:
                  (game.data().boardSize - 1) * (game.data().boardSize - 1),
              }).map((_, index) => (
                <div
                  key={"canvas " + index}
                  className="border border-neutral"
                ></div>
              ))}
              <div
                style={{
                  gridTemplateColumns: `repeat(${game.data().boardSize}, 1fr)`,
                  gridTemplateRows: `repeat(${game.data().boardSize}, 1fr)`,
                }}
                className="absolute top-0 left-0 w-full h-full grid "
              >
                {game.data().boardArray.map((cell, index) => (
                  <button
                    disabled={
                      cell !== "" ||
                      game.data().players[game.data().turn] !==
                        auth.currentUser.uid ||
                      game.data().closed ||
                      game.data().players.B === "" ||
                      game.data().players.W === ""
                    }
                    name={index}
                    key={"placement " + index}
                    className={`flex items-center justify-center w-full h-full rounded-xl m-[2.5%] p-[2.5%] ${
                      cell !== "" ||
                      game.data().players[game.data().turn] !==
                        auth.currentUser.uid ||
                      game.data().closed ||
                      game.data().players.B === "" ||
                      game.data().players.W === ""
                        ? ""
                        : "hover:bg-[#00000020]"
                    }`}
                    onClick={async () => {
                      if (
                        game.data().turn === "W" &&
                        checkKO(
                          game.data().snapBoard.white,
                          game.data().boardArray,
                          game.data().boardSize,
                          index,
                          game.data().turn,
                        )
                      ) {
                        return;
                      }
                      if (
                        game.data().turn === "B" &&
                        checkKO(
                          game.data().snapBoard.black,
                          game.data().boardArray,
                          game.data().boardSize,
                          index,
                          game.data().turn,
                        )
                      ) {
                        return;
                      }

                      let capturedCells = getCapturedCells(
                        game.data().boardArray,
                        game.data().boardSize,
                        index,
                        game.data().turn,
                      );

                      let newBoardArray = [...game.data().boardArray];
                      if (capturedCells.length > 0) {
                        capturedCells.forEach((cell) => {
                          newBoardArray[cell] = "";
                        });
                      }

                      if (
                        !checkIfLegalMove(
                          newBoardArray,
                          game.data().boardSize,
                          index,
                          game.data().turn,
                        )
                      ) {
                        return;
                      }

                      newBoardArray[index] = game.data().turn;

                      let { turn, movesHystory, turnCount, snapBoard } =
                        game.data();
                      movesHystory.push({
                        turn,
                        player: turn === "B" ? "black" : "white",
                        move: index,
                      });
                      let newSnap = { ...snapBoard };
                      if (turn === "W") {
                        newSnap.white = newBoardArray;
                      } else {
                        newSnap.black = newBoardArray;
                      }
                      await updateDoc(doc(db, "games", gameID), {
                        turn: game.data().turn === "B" ? "W" : "B",
                        movesHystory,
                        turnCount: turnCount + 1,
                        boardArray: newBoardArray,
                        snapBoard: newSnap,
                        captured:
                          game.data().turn === "B"
                            ? {
                                white: game.data().captured.white,
                                black:
                                  game.data().captured.black +
                                  capturedCells.length,
                              }
                            : {
                                white:
                                  game.data().captured.white +
                                  capturedCells.length,
                                black: game.data().captured.black,
                              },
                      });
                    }}
                  >
                    {cell !== "" ? <Stone isWhite={cell === "W"} /> : <></>}
                    {game.data().result.points.B.includes(index) && (
                      <div className="bg-slate-900 opacity-70 rounded-md w-1/2 aspect-square"></div>
                    )}
                    {game.data().result.points.W.includes(index) && (
                      <div className="bg-slate-200 opacity-70 rounded-md border border-slate-500 w-1/2 aspect-square "></div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Extra bar for interactions */}
        <div
          className={`${isVerticalMonitor ? "w-full" : "w-fit p-12"} h-full`}
        >
          <div className="w-full h-full flex flex-col justify-between items-center">
            {!isVerticalMonitor ? (
              <div className="flex flex-col items-center justify-start gap-6">
                {getPlayerCards(game, isVerticalMonitor)}
                <button
                  disabled={
                    game.data().players[game.data().turn] !==
                      auth.currentUser.uid ||
                    game.data().closed ||
                    game.data().players.B === "" ||
                    game.data().players.W === ""
                  }
                  className="btn w-full btn-secondary"
                  onClick={onPass}
                >
                  Pass
                </button>
              </div>
            ) : (
              <button
                disabled={
                  game.data().players[game.data().turn] !==
                    auth.currentUser.uid ||
                  game.data().closed ||
                  game.data().players.B === "" ||
                  game.data().players.W === ""
                }
                className="btn btn-wide btn-secondary"
                onClick={onPass}
              >
                Pass
              </button>
            )}

            <div
              className={`w-full flex ${
                isVerticalMonitor ? " flex-row " : " flex-col "
              } items-center justify-center gap-2`}
            >
              <Link
                className={`btn ${
                  isVerticalMonitor ? " " : " w-full "
                } btn-outline btn-secondary`}
                to="/home"
              >
                Leave Game Room
              </Link>
              <button
                className={
                  "btn " +
                  (isVerticalMonitor ? " " : " w-full ") +
                  " btn-error text-white rounded-lg font-bold" +
                  (game.data().closed ? " btn-disabled" : "")
                }
                onClick={onForfait}
              >
                Forfeit
              </button>
            </div>
          </div>
        </div>
      </div>
    );
}

function checkIfLegalMove(boardArray, boardSize, index, turn) {
  if (boardArray[index] !== "") {
    return false;
  }

  const newBoardArray = [...boardArray];
  newBoardArray[index] = turn;

  return checkGroupLiberty(newBoardArray, boardSize, index, turn).hasLiberty;
}

function getCapturedCells(boardArray, boardSize, index, turn) {
  const adjacentCells = getAdjacentCells(index, boardSize);
  let capturedGroups = [];
  let simulatedBoard = [...boardArray];
  simulatedBoard[index] = turn;

  for (const cell of adjacentCells) {
    if (boardArray[cell] === "") {
      continue;
    }

    if (boardArray[cell] === turn) {
      continue;
    }

    if (boardArray[cell] !== turn) {
      let res = checkGroupLiberty(
        simulatedBoard,
        boardSize,
        cell,
        boardArray[cell],
      );
      if (!res.hasLiberty) {
        capturedGroups = capturedGroups.concat(res.groupStones);
      }
    }
  }
  return capturedGroups;
}

function checkGroupLiberty(boardArray, boardSize, index, turn) {
  const visited = new Set();
  const groupStones = new Set();
  const stack = [index];

  while (stack.length > 0) {
    console.log("check liberty");
    const current = stack.pop();

    if (boardArray[current] === "") {
      return { hasLiberty: true, groupStones: Array.from(groupStones) };
    }

    if (boardArray[current] !== turn || visited.has(current)) {
      continue;
    }

    visited.add(current);
    groupStones.add(current);

    const adjacentCells = getAdjacentCells(current, boardSize);
    for (const cell of adjacentCells) {
      stack.push(cell);
    }
  }

  return { hasLiberty: false, groupStones: Array.from(groupStones) };
}

function getAdjacentCells(indexIn, boardSizeIn) {
  let index = parseInt(indexIn);
  let boardSize = parseInt(boardSizeIn);
  const row = Math.floor(index / boardSize);
  const col = index % boardSize;

  const adjacentCells = [];

  // cell above
  if (row > 0) {
    adjacentCells.push(index - boardSize);
  }

  // cell below
  if (row < boardSize - 1) {
    adjacentCells.push(index + boardSize);
  }

  // cell to the left
  if (col > 0) {
    adjacentCells.push(index - 1);
  }

  // cell to the right
  if (col < boardSize - 1) {
    adjacentCells.push(index + 1);
  }

  return adjacentCells;
}

function checkKO(snapBoardArray, boardArray, boardSize, index, turn) {
  if (snapBoardArray.length === 0) {
    return;
  }

  let newBoardArray = [...boardArray];
  let capturedCells = getCapturedCells(newBoardArray, boardSize, index, turn);
  if (capturedCells.length > 0) {
    capturedCells.forEach((cell) => {
      newBoardArray[cell] = "";
    });
  }
  newBoardArray[index] = turn;

  let newSnap = [...snapBoardArray];

  return newBoardArray.join() === newSnap.join();
}

function calculateScore(boardArray, boardSize, captured) {
  const score = { B: 0, W: 0 };
  const points = { B: [], W: [] };
  let searchesArray = [];

  const checkIfVisited = (index, searches) => {
    for (const search of searches) {
      if (search.indexOf(index) !== -1) {
        return true;
      }
    }
    return false;
  };

  for (let i = 0; i < boardArray.length; i++) {
    if (checkIfVisited(i, searchesArray)) continue;
    let currSearch = pointsBFSearch(boardArray, boardSize, i);
    console.log("search at index ", i);
    console.log(currSearch);
    searchesArray.push(currSearch);
  }

  searchesArray.forEach((search) => {
    let currSearch = search.filter((x) => boardArray[x] !== "");
    if (currSearch.every((cell) => boardArray[cell] === "B")) {
      let resultSearch = search.filter(
        (x) => boardArray[x] === "" || boardArray[x] === "W",
      );
      score.B += resultSearch.length;
      points.B = points.B.concat(resultSearch);
    }
    if (currSearch.every((cell) => boardArray[cell] === "W")) {
      let resultSearch = search.filter(
        (x) => boardArray[x] === "" || boardArray[x] === "B",
      );
      score.W += resultSearch.length;
      points.W = points.W.concat(resultSearch);
    }
  });

  score.W += captured.white;
  score.B += captured.black;

  // add komi
  score.W += 6.5;

  return { score, points };
}

function pointsBFSearch(boardArray, boardSize, index) {
  const visited = new Set();
  const stack = [index];
  if (boardArray[index] !== "") return Array.from(visited);

  while (stack.length > 0) {
    const current = stack.pop();

    if (visited.has(current)) {
      continue;
    }

    visited.add(current);

    const adjacentCells = getAdjacentCells(current, boardSize);
    for (const cell of adjacentCells) {
      if (boardArray[cell] === "B" || boardArray[cell] === "W") {
        visited.add(cell);
      } else stack.push(cell);
    }
  }

  return Array.from(visited);
}

function getPlayerCards(game, isVerticalMonitor) {
  return (
    <div
      className={
        isVerticalMonitor
          ? "w-full h-full flex flex-row items-center justify-evenly gap-2"
          : "w-fit flex flex-col items-center justify-evenly gap-2"
      }
    >
      <PlayerCard
        uid={game.data().players.B}
        isBlack
        isVerticalMonitor={isVerticalMonitor}
      >
        {<p>{`Captured ${game.data().captured.black}`}</p>}
        {!game.data().closed &&
          game.data().turn === "B" &&
          (auth.currentUser.uid === game.data().players.B
            ? "Your Turn"
            : "Opponent's Turn")}
        {game.data().closed && <p>Score {game.data().result.score.B}</p>}
        {game.data().result.score.B > game.data().result.score.W && (
          <p className="text-green-400">Winner</p>
        )}
      </PlayerCard>
      <PlayerCard
        uid={game.data().players.W}
        isVerticalMonitor={isVerticalMonitor}
      >
        {<p>{`Captured ${game.data().captured.white}`}</p>}
        {!game.data().closed &&
          game.data().turn === "W" &&
          (auth.currentUser.uid === game.data().players.W
            ? "Your Turn"
            : "Opponent's Turn")}
        {game.data().closed && <p>Score {game.data().result.score.W}</p>}
        {game.data().result.score.W > game.data().result.score.B && (
          <p className="text-green-600">Winner</p>
        )}
      </PlayerCard>
    </div>
  );
}

function getWindowDimensions() {
  const { innerWidth: width, innerHeight: height } = window;
  return {
    width,
    height,
  };
}

function isVertical() {
  return getWindowDimensions().width < getWindowDimensions().height;
}

function useIsWindowVertical() {
  const [windowDimensions, setWindowDimensions] = useState(isVertical());

  useEffect(() => {
    function handleResize() {
      setWindowDimensions(isVertical());
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return windowDimensions;
}
