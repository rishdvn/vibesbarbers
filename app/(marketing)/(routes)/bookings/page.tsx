"use server";

import { fetchUsers } from "../booking/actions";
import Header from "./components/header";
import FormComponent from "./components/form";

const SERVICES = {
    "Haircut": 20,
    "Haircut & Beard": 40,
}

export default async function BookingPage() {
    const users = await fetchUsers();
    // const rosters = await fetchRosters();
    // const appointments = await fetchAllAppointments();

    let barberUID: string;

    return (
    <div className='h-full flex flex-col items-center'>
        <form className="w-full max-w-screen-md flex h-full flex-col">
            <Header submited={false}/>
            <FormComponent services={SERVICES} users={users}/>
        </form>
        
    </div> 
    )
}