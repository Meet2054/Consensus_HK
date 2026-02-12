import "../styles/globals.css";
import "@rainbow-me/rainbowkit/styles.css";

import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import type { AppProps } from "next/app";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";

import { config } from "../wagmi";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import Nouns from "../public/nouns.png";
import Image from "next/image";

const client = new QueryClient();

function MyApp({ Component, pageProps }: AppProps) {
  const glassesArray = Array.from({ length: 15 });
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={client}>
        <RainbowKitProvider modalSize="compact">
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <main className="min-w-full flex min-h-screen flex-col relative overflow-hidden">
              {/* Left glasses icon */}
              <div className="absolute pl-4 top-0 h-full flex flex-col justify-between items-center">
                {glassesArray.map((_, index) => (
                  <Image
                    key={index}
                    src={Nouns}
                    alt="Glasses Icon"
                    className="w-0 md:w-10 lg:w-12"
                  />
                ))}
              </div>

              {/* Right glasses icon */}
              <div className="absolute right-4 top-0 h-full flex flex-col justify-between items-center">
                {glassesArray.map((_, index) => (
                  <Image
                    key={index}
                    src={Nouns}
                    alt="Glasses Icon"
                    className="w-0 md:w-10 lg:w-12"
                  />
                ))}
              </div>

              {/* Content */}
              <Navbar />
              <div className="flex-1 px-8 md:px-8 lg:px-24 ">
                <Component {...pageProps} />
              </div>

              <div className="px-4 md:px-8 lg:px-16 xl:px-24">
                <Footer />
              </div>
            </main>
          </LocalizationProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default MyApp;
