'use server';

import { fetchUsers } from "../booking/actions";
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
    const users = await fetchUsers();
    const selectedService = searchParams.service as string;

    return (
    <div className='h-full flex flex-col items-center'>
        <form className="w-full max-w-screen-md flex h-full flex-col">
            <Header submited={false}/>
            <Suspense>
                <FormComponent services={SERVICES} users={users} initialService={selectedService}/>
            </Suspense>
        </form>
    </div> 
    )
}