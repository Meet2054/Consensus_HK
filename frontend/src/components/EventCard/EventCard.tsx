import React from "react";
import { Event } from "../../types/types";

// Global counters for image parameters
let headCounter = 0;
let glassesCounter = 0;
let bodyCounter = 0;
let accessoryCounter = 0;

export default function EventCard({ eventData }: { eventData: Event }) {
// Dynamically calculate parameters
  const head = (headCounter++) % 233; // Ensure it wraps around
  const glasses = (glassesCounter++) % 20;
  const background = 0; // Static background
  const body = (bodyCounter++) % 29;
  const accessory = (accessoryCounter++) % 136;
  
  function ChoiceButton({ isYes }: { isYes: boolean }) {
    return isYes ? (
      <div className="bg-green-500 w-20 rounded-md flex justify-center items-center">
        Yes
      </div>
    ) : (
      <div className="bg-red-500 w-20 rounded-md flex justify-center items-center">
        No
      </div>
    );
  }

  function Outcomes() {
    return eventData.choices.length > 1 ? (
      <div className="">
        {eventData.choices.map((choice, index) => (
          <div key={index} className="my-2 flex w-full justify-between">
            <div>{choice}</div>
            <div className="flex flex-row gap-2">
              <ChoiceButton isYes={true} />
              <ChoiceButton isYes={false} />
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="flex flex-row">
        <div className="w-[50%] flex justify-center items-center">
          <ChoiceButton isYes={true} />
        </div>

        <div className="w-[50%] flex justify-center items-center">
          <ChoiceButton isYes={false} />
        </div>
      </div>
    );
  }

  return (
<div className="bg-white w-[350px] md:w-[400px] rounded-md flex flex-col p-5 justify-between">
      {/* Question */}
      <div className="press-start-2p-regular mb-4">{eventData.question}</div>

      {/* Dynamic Image */}
      <img
        src={`https://noun-api.com/beta/pfp?head=${head}&glasses=${glasses}&background=${background}&body=${body}&accessory=${accessory}`}
        alt="Noun Image"
        className="w-20 h-20 md:w-24 md:h-24 object-contain mx-auto mb-4"
      />

      {/* Outcomes */}
      <div className="gap-2">
        <Outcomes />
      </div>
    </div>
  );
}
