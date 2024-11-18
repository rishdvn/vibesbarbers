import MultipleSchedule from "../../_components/multipleSchedule";
import { CalendarProvider } from "./context";

const Calendar = () => {
    return (
        <CalendarProvider>
            <MultipleSchedule />
        </CalendarProvider>
    )
};

export default Calendar;