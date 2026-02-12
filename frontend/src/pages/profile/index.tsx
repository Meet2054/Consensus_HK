import React, { useEffect, useState } from "react";

import EventCard from "../../components/EventCard/EventCard";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/router";
import { useAccount } from "wagmi";
import { Event } from "../../types/types";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";

export default function index() {
  const { address, chainId } = useAccount();
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [mybuys, setMyBuys] = useState<Event[]>([]);
  const [resolve, setResolve] = useState<Event[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true); // Loading state

  const router = useRouter();

  async function fetchMyEvents() {
    try {
      setIsLoading(true); // Start loading
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("deployer", address)
        .eq("chainId", chainId);

      if (error) throw error;

      if (data) {
        const transformedEvents: Event[] = data.map((d: any) => ({
          id: d.id,
          address: d.fpmm_address,
          question: d.fpmm_title,
          choices: [""],
        }));

        setMyEvents(transformedEvents);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setIsLoading(false); // Stop loading
    }
  }

  async function fetchMyBuy() {
    try {
      setIsLoading(true);
      // First get all buys for the user
      const { data: buyData, error: buyError } = await supabase
        .from("buys")
        .select("*")
        .eq("user_address", address);

      if (buyError) throw buyError;

      // Get unique fpmm addresses
      const uniqueFpmmAddresses = buyData
        .map((item) => item.fpmm_address)
        .filter((value, index, self) => self.indexOf(value) === index);

      // Now fetch the event details for each unique fpmm_address
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("*")
        .in("fpmm_address", uniqueFpmmAddresses);

      if (eventError) throw eventError;

      if (eventData) {
        // Filter only resolved events and transform them
        const transformedEvents: Event[] = eventData
          .filter((d) => d.resolved === false) // Only keep resolved events
          .map((d: any) => ({
            id: d.id,
            address: d.fpmm_address,
            question: d.fpmm_title,
            choices: [""],
          }));

        setMyBuys(transformedEvents);
      }
    } catch (e: any) {
      console.error("Error fetching buys:", e);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchMyResolved() {
    try {
      setIsLoading(true);
      // Fetch user's buys
      const { data: buyData, error: buyError } = await supabase
        .from("buys")
        .select("*")
        .eq("user_address", address);

      if (buyError) throw buyError;

      // Get unique addresses from buys
      const uniqueFpmmAddresses = buyData
        .map((item) => item.fpmm_address)
        .filter((value, index, self) => self.indexOf(value) === index);

      // Fetch events user participated in
      const { data: participatedEvents, error: eventError } = await supabase
        .from("events")
        .select("*")
        .in("fpmm_address", uniqueFpmmAddresses);

      if (eventError) throw eventError;

      // Fetch events user created
      const { data: createdEvents, error: eventError2 } = await supabase
        .from("events")
        .select("*")
        .eq("deployer", address);

      if (eventError2) throw eventError2;

      // Combine and transform both sets of events
      if (participatedEvents || createdEvents) {
        // Combine both arrays and remove duplicates using Set
        const allEvents = [
          ...(participatedEvents || []),
          ...(createdEvents || []),
        ];
        const uniqueEvents = allEvents.filter(
          (event, index, self) =>
            index ===
            self.findIndex((e) => e.fpmm_address === event.fpmm_address)
        );

        // Filter for resolved events and transform
        const resolvedEvents: Event[] = uniqueEvents
          .filter((d) => d.resolved === true)
          .map((d: any) => ({
            id: d.id,
            address: d.fpmm_address,
            question: d.fpmm_title,
            choices: [""],
          }));

        console.log("Resolveeee", resolvedEvents);
        setResolve(resolvedEvents);
      }
    } catch (e: any) {
      console.error("Error fetching resolved events:", e);
    } finally {
      setIsLoading(false);
    }
  }

  function handleClick(fpmm_address: string) {
    router.push(`/profile/${fpmm_address}`);
  }

  function handleClickTxn(fpmm_address: string) {
    router.push(`/event/${fpmm_address}`);
  }

  useEffect(() => {
    if (address) {
      fetchMyEvents();
      fetchMyBuy();
      fetchMyResolved();
    }
  }, [address]);

  return (
    <TabGroup>
      <TabList className="flex gap-8 text-white mb-4">
        <Tab
          className={({ selected }) =>
            `${
              selected ? "border-b-2 border-white" : ""
            } px-4 py-2 focus:outline-none hover:text-gray-300`
          }
        >
          My Prediction
        </Tab>
        <Tab
          className={({ selected }) =>
            `${
              selected ? "border-b-2 border-white" : ""
            } px-4 py-2 focus:outline-none hover:text-gray-300`
          }
        >
          My Transactions
        </Tab>
        <Tab
          className={({ selected }) =>
            `${
              selected ? "border-b-2 border-white" : ""
            } px-4 py-2 focus:outline-none hover:text-gray-300`
          }
        >
          My Resolved
        </Tab>
      </TabList>
      <TabPanels>
        <TabPanel>
          <div className="flex w-full flex-col justify-center items-center flex-wrap">
            {isLoading ? ( // Show loading spinner or message
              <div>Loading...</div>
            ) : (
              <>
                <div className="flex gap-2 flex-wrap">
                  {/* If you want to add other raw events */}
                </div>

                <div className="flex gap-2 flex-wrap justify-center items-center">
                  {myEvents.map((event, index) => (
                    <div key={index} onClick={() => handleClick(event.address)}>
                      <EventCard eventData={event} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </TabPanel>
        <TabPanel>
          <div className="flex w-full flex-col justify-center items-center flex-wrap">
            {isLoading ? ( // Show loading spinner or message
              <div>Loading...</div>
            ) : (
              <>
                <div className="flex gap-2 flex-wrap">
                  {/* If you want to add other raw events */}
                </div>

                <div className="flex gap-2 flex-wrap justify-center items-center">
                  {mybuys.map((event, index) => (
                    <div key={index} onClick={() => handleClickTxn(event.address)}>
                      <EventCard eventData={event} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </TabPanel>
        <TabPanel>
          <div className="flex w-full flex-col justify-center items-center flex-wrap">
            {isLoading ? ( // Show loading spinner or message
              <div>Loading...</div>
            ) : (
              <>
                <div className="flex gap-2 flex-wrap">
                  {/* If you want to add other raw events */}
                </div>

                <div className="flex gap-2 flex-wrap justify-center items-center">
                  {resolve.map((event, index) => (
                    <div key={index} onClick={() => handleClickTxn(event.address)}>
                      <EventCard eventData={event} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </TabPanel>
      </TabPanels>
    </TabGroup>
  );
}
