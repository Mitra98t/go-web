import { collection, deleteDoc, doc } from "firebase/firestore";
import React from "react";
import {
  useCollection,
  useCollectionOnce,
} from "react-firebase-hooks/firestore";
import { auth, db } from "../firebase";
import { Link } from "react-router-dom";
import ProfilePic from "./ProfilePic";
import { useAuthState } from "react-firebase-hooks/auth";

export default function GameData({ privateGames = false }) {
  const [user] = useAuthState(auth);
  const [games, loading, error] = useCollection(collection(db, "games"), {
    snapshotListenOptions: { includeMetadataChanges: true },
  });

  const [users, usersLoading, usersError, usersReload] = useCollectionOnce(
    collection(db, "users"),
  );

  function getUserData(uid) {
    let user = users.docs.find((doc) => doc.id === uid);
    return { id: user?.id, ...user?.data() };
  }

  async function deleteGame(gameId) {
    await deleteDoc(doc(db, "games", gameId));
  }

  return (
    <div className="w-full h-full flex flex-col sm:flex-row items-center justify-evenly animationWrapper">
      <div className="w-full sm:w-1/3 h-full flex flex-col items-start justify-start gap-6">
        <h1 className="text-3xl font-bold px-12">{`${
          privateGames ? "Personal" : "Public"
        } games`}</h1>
        <div className="flex flex-col gap-3 w-full h-full overflow-y-scroll px-12">
          {(loading || usersLoading) && <p>Loading...</p>}
          {(error || usersError) && <p>Error: {error.message}</p>}
          {games &&
            users &&
            (privateGames
              ? games.docs.filter((doc) =>
                  Object.values(doc.data().players).includes(user.uid),
                )
              : games.docs.filter((doc) => !doc.data().isPrivate)
            )
              .filter(
                (doc) => !doc.data().closed || doc.data().createdBy == user.uid,
              )
              .sort((a, _) => {
                if (a.data().players.includes("")) {
                  return -1;
                } else {
                  return 1;
                }
              })
              .map((doc) => (
                <React.Fragment key={doc.id}>
                  <div className="w-full h-fit flex flex-row items-center justify-between gap-3">
                    <Link
                      className="bg-base-100 border-2 border-base-content hover:border-primary rounded-2xl  py-3 px-6 flex flex-col items-start gap-3 w-full h-fit"
                      to={
                        !privateGames && doc.data().isPrivate
                          ? "#"
                          : `/game/${doc.id}`
                      }
                    >
                      {Object.keys(doc.data().players).map((key) => {
                        let currUser = getUserData(doc.data().players[key]);
                        return (
                          <div
                            key={currUser.id}
                            className="flex items-center gap-3"
                          >
                            <div
                              className={`h-10 w-10 rounded-full border-2 border-primary ${
                                key === "B" ? "bg-slate-900" : "bg-slate-100"
                              }`}
                            >
                              {currUser.email && (
                                <ProfilePic seed={currUser.email} flip />
                              )}
                            </div>
                            <p className=" font-semibold text-lg">
                              {currUser.displayName
                                ? currUser.displayName
                                : "Wating for player"}
                            </p>
                          </div>
                        );
                      })}
                      <p>{`Board size ${doc.data().boardSize}`}</p>
                    </Link>
                    {privateGames && doc.data().createdBy === user.uid && (
                      <button
                        className=" font-bold"
                        onClick={() => deleteGame(doc.id)}
                      >
                        X
                      </button>
                    )}
                  </div>
                </React.Fragment>
              ))}
        </div>
      </div>
      <div className="w-full sm:w-2/3 h-full">
        {`This will display ${
          privateGames ? "personal" : "public"
        } match statistics`}
      </div>
    </div>
  );
}
