import MultipleSchedule from "./components/MultipleSchedule";
import { CalendarProvider } from "./context";

const Calendar = () => {
    return (
        <CalendarProvider>
            <MultipleSchedule />
        </CalendarProvider>
    )
};

export default Calendar;