"use client";

import Image from "next/image";
import { StarIcon } from "@heroicons/react/20/solid";
import ServicesLanding from "./_components/serviceslanding";
import { useUserAuth } from "@/src/context/AuthContext";
import { useState } from "react";
import { Menu } from "@headlessui/react";


const MarketingPage = () => {
    const imageSize = 60;
    const { user, signUserOut } = useUserAuth();
    
    return (
        <div className="flex flex-col items-center h-full">
            <div className="flex w-full sm:px-2 py-1 justify-between items-center max-w-screen-lg">
                <Image width={imageSize} height={imageSize} src="/black_logo_vibes.png" alt="logo" />
                {user ? (
                    <div
                        className="mr-2 text-lg font-bold text-gray-800"
                    >
                        {user.phoneNumber ? user.phoneNumber : user.email}
                    </div>
                )
                : null}
            </div>
            <div className="flex-1 relative overflow-hidden">                
                {/* <video autoPlay muted loop className="object-cover w-full brightness-75 md:-translate-y-1/3 lg:-translate-y-1/3">         
                    <source src="/background.mp4" type="video/mp4"/>    
                </video> */}
                <Image
                    src="/vibes.png"
                    width={1920}
                    height={1080}
                    className="object-cover brightness-75 md:-translate-y-1/3 lg:-translate-y-1/3 scale-x-[-1]"
                />
                <div className={`flex flex-row justify-center absolute bottom-0 left-0 w-full text-white`}>
                    <div className="flex w-full max-w-screen-lg px-2 py-4 justify-between items-end">
                        {/* Vibes info */}
                        <div
                            className="flex flex-col gap-y-2"
                        >
                            <h1 className="cursor-default text-4xl font-bold">
                                Vibes Barbers
                            </h1>
                            <div
                                className="flex flex-row gap-x-3"
                            >
                                <p
                                    className="cursor-default"
                                >
                                    4.7
                                </p>
                                <div
                                    className=" flex flex-row gap-x-1 items-center"
                                > 
                                    <StarIcon className="h-5 w-5 text-yellow-500" />
                                    <StarIcon className="h-5 w-5 text-yellow-500" />
                                    <StarIcon className="h-5 w-5 text-yellow-500" />
                                    <StarIcon className="h-5 w-5 text-yellow-500" />
                                    <StarIcon className="h-5 w-5 text-yellow-500" />
                                </div>
                                <div
                                    className="cursor-default font-semibold"
                                >
                                (480)
                                </div>
                            </div>
                        </div>
                        {/* <Image
                            src="/prices.png"
                            width={270}
                            height={200}
                        /> */}
                        {/* <button
                            type="button"
                            className="rounded-full px-3.5 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 hover:text-black"
                        >
                            View prices
                        </button> */}
                    </div>
                </div>
            </div>
            <div className="w-full flex flex-col max-w-screen-lg py-4 px-2 gap-y-4">
                <div>
                    <h1 className="text-3xl font-bold">
                        Services
                    </h1>
                    <ServicesLanding />
                </div>
            </div>
        </div>
     );
}
 
export default MarketingPage;