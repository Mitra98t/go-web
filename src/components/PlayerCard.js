import { collection } from "firebase/firestore";
import React, { useEffect } from "react";
import { useCollectionOnce } from "react-firebase-hooks/firestore";
import { db } from "../firebase";
import ProfilePic from "./ProfilePic";

export default function PlayerCard({
  uid,
  isBlack = false,
  isVerticalMonitor,
  turn,
  children,
}) {
  const [users, usersLoading, usersError, usersReload] = useCollectionOnce(
    collection(db, "users")
  );

  const [user, setUser] = React.useState({});

  useEffect(() => {
    if (!users) return;
    let usr = getUserData(uid);
    setUser(usr);
  }, [users, uid]);

  function getUserData(uid) {
    let user = users.docs.find((doc) => doc.id === uid);
    return { id: user?.id, ...user?.data() };
  }

  if (usersLoading) return <p>Loading...</p>;
  if (usersError) return <p>Error: {usersError.message}</p>;

  return (
    <div
      className={`w-full h-full border-primary border-2 ${
        isBlack
          ? "text-slate-100 bg-slate-900"
          : "bg-slate-200 text-slate-900 font-medium"
      } ${isVerticalMonitor ? " py-2 px-4 " : " p-6 gap-3"}  rounded-2xl ${
        isBlack && turn && "ring-4 ring-secondary"
      }  flex flex-col items-start justify-start`}
    >
      <div
        className={
          "w-full flex flex-row " +
          (isVerticalMonitor ? " gap-2 " : " gap-3 whitespace-nowrap")
        }
      >
        {uid ? (
          <>
            <div className="w-8 aspect-square">
              <ProfilePic seed={user.email} flip />
            </div>
            {user.displayName}
          </>
        ) : (
          <>
            <div
              className={`w-8 aspect-square rounded-full ${
                isBlack
                  ? "text-slate-100 bg-slate-900"
                  : "bg-slate-200 text-slate-900 font-medium"
              }`}
            ></div>
            {"Waiting for player..."}
          </>
        )}
      </div>
      {children}
    </div>
  );
}
