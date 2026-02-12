// index.tsx
import type { NextPage } from "next";
import React from "react";
import { Boxes } from "../components/ui/background-boxes";
import Image from "next/image";
import gif from "../public/pepe-gif.gif";
import Link from "next/link";

const Home: NextPage = () => {
  return (
    <>
      <div className="h-full relative w-full overflow-hidden bg-darkgreen items-center flex justify-center rounded-lg">
        <div className="absolute inset-0 w-full h-full bg-darkgreen [mask-image:radial-gradient(transparent,white)] pointer-events-none z-0" />

        <Boxes className="h-auto" />

        {/* Flex container for "hey" elements and PredPumpFun */}
        <div className="flex items-center justify-center md:space-x-4 sm:space-x-0 sm:space-y-4 mt-28 md:mt-48 z-10">
         <Image
          src={gif}
          alt="Animated GIF"
          className="w-20 h-20 sm:w-24 sm:h-24 md:w-36 md:h-36 lg:w-52 lg:h-48"
          width={200}
          height={200}
        />


          <div className="animate-bounce">
          <div className="press-start-2p-regular text-transparent stroke-text-md sm:stroke-text sm:text-8xl md:text-6xl lg:text-8xl rainbow-tail">
            PREDICT
          </div>
          </div>
          <Image
            src={gif}
            alt="Animated GIF"
            className="w-20 h-20 sm:w-24 sm:h-24 md:w-36 md:h-36 lg:w-52 lg:h-48"
            width={200}
            height={200}
          />
        </div>
      </div>
      <div className="justify-center items-center flex mt-14">
        <div className="flex flex-col gap-6">
          <Link href="/markets">
            <button className="bg-green-800/50 rounded-3xl border-4 border-dashed border-lime-400 text-white text-2xl hover:bg-teal-700 px-8 py-4 press-start-2p-regular">
              Create Market
            </button>
          </Link>
          <Link href="/markets/view">
            <button className="bg-blue-600/50 rounded-3xl border-4 border-dashed border-blue-400 text-white text-2xl hover:bg-blue-700 px-8 py-4 press-start-2p-regular">
              View Markets
            </button>
          </Link>
        </div>
      </div>
    </>
  );
};

export default Home;
