import React from "react";

export default function Stone({ isWhite = false }) {
  return (
    <div
      className={`aspect-square w-[92%] rounded-full  ${
        isWhite ? "border border-slate-500 bg-slate-200" : "bg-slate-900"
      }`}
    ></div>
  );
}
