import { BarberItem } from "./BarberItem"
import { TimeRow } from "./TimeRow"
import { useCalendar } from "../context"
import { format } from "date-fns"

export const TimeAxis = () => {
    const { timeSlots, selectedDay } = useCalendar();
    const dayName = format(selectedDay, 'EEEE').toLowerCase();
    const dayTiming = timeSlots[dayName].concat(["Extra"]);
    const daySlots = dayTiming.length;

    return (
    <div className="sticky left-0 flex flex-col z-20 w-14 bg-white border-r border-gray-100">
        <div
            className='sticky top-0 select-none overflow-hidden'
        >
            <BarberItem keyValue='time' barber={{firstname: 'Time'}}/>
            <div 
            style={{
                content: '',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '90%',
                backgroundColor: 'rgba(255, 255, 255, 1)'
            }}
            />
        </div>
        <div className="h-5 border-b-2 border-gray-100" />
        <div 
            className="grid flex-auto grid-cols-1 grid-rows-1"
        >
            <div
            className="col-start-1 col-end-2 row-start-1 grid divide-y divide-gray-100 flex flex-grow"
            >
            {dayTiming.map((time) => (
                <TimeRow key={time} time={time}/>
            ))}
            </div>
        </div>
    </div>
    )
}