import { CalendarMultiView } from "./components/Calendar";
import { CalendarProvider } from "./context";

const Calendar = () => {
  return (
    <CalendarProvider>
            <CalendarMultiView />
    </CalendarProvider>
    )
};

export default Calendar;