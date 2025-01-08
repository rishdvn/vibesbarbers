'use server';

import { fetchBarbers } from "../../../../utils/actions";
import Header from "./components/header";
import FormComponent from "./components/form";
import { Suspense } from "react";

const SERVICES = {
    "Haircut": 20,
    "Haircut & Beard": 40,
}

export default async function BookingPage({ 
    searchParams
}: {
    searchParams: { [key: string]: string | string[] | undefined }
}) {

    const barbers = await fetchBarbers();
    const selectedService = searchParams.service as string;

    return (
    <div className='min-h-screen flex flex-col items-center bg-black'>
        <form className="w-full max-w-screen-md flex h-full flex-col">
            <Header submited={false}/>
            <Suspense>
                <FormComponent services={SERVICES} users={barbers} initialService={selectedService}/>
            </Suspense>
        </form>
    </div> 
    )
}