import { BarbersCol } from "./BarbersCols";
import { TimeAxis } from "./TimeAxis";
import { User } from "@/utils/schemas/User";
import { WholeThing } from "./WholeThing";

export const CalendarCanvas = ({workingBarbers, view, children}: {workingBarbers: User[], view: string, children?: React.ReactNode}) => {
return (
    <div className='flex flex-row flex-grow w-full items-start overflow-y-scroll overflow-x-auto'>
{workingBarbers.length === 0 ? (
    <div className='flex flex-row items-center justify-center text-sm p-2'>
        {`${view === "Team" ? "No barbers are" : "You are not"} working on this day. Roster work to add appointments.`}
    </div>
    ) : (
    //     <div
    //       className='flex flex-grow w-full h-full items-start overflow-y-auto overflow-x-auto'
    //     >
    //                 <TimeAxis/>

    //                 {workingBarbers.map((barber) => (
    //                     <BarbersCol key={barber.uid} barber={barber} view={view} />
    //                 ))}
    //     {children}
    // </div>
    <WholeThing />
    )}
    </div>
  )};