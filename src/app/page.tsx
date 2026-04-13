"use client"

import { trpc } from "./_trpc/client";

export default function Home() {

  const { data } = trpc.hello.useQuery()
  return (
    <div className="">
      {data}
    </div>
  );
}
