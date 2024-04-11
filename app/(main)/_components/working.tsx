// END CALENDAR DAY
    
const [endSelectedDay, setEndSelectedDay] = useState(today);
const [endCurrentMonth, setEndCurrentMonth] = useState(format(today,'MMM-yyyy'));
let endFirstDayCurrentMonth = parse(endCurrentMonth, 'MMM-yyyy', new Date())

const container = useRef(null)
const containerNav = useRef(null)
const containerOffset = useRef(null)

function changeEndSelectedDay(day: string) {
  if (format(endSelectedDay, 'MM') === format(day, 'MM')) {
    setEndSelectedDay(day)
  } else {
    setEndSelectedDay(day)
    setEndCurrentMonth(format(day, 'MMM-yyyy'))
  }
}

// calendar days
let endDays = eachDayOfInterval({
  start: startOfWeek(endFirstDayCurrentMonth),
  end: endOfWeek(endOfMonth(endFirstDayCurrentMonth))
});

function nextMonth() {
let endFirstDayNextMonth = add(endFirstDayCurrentMonth, {months: 1})
setEndCurrentMonth(format(endFirstDayNextMonth, 'MMM-yyyy'))
}

function prevMonth() {
  let endFirstDayNextMonth = add(endFirstDayCurrentMonth, {months: -1})
  setEndCurrentMonth(format(endFirstDayNextMonth, 'MMM-yyyy'))
}

const EndCalendar = () => {

  return (
  <div className="p-2">
    <div className="flex items-center text-center text-gray-900">
      <button
        onClick={prevMonth}
        type="button"
        className="-m-1.5 flex flex-none items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"
      >
        <span className="sr-only">Previous month</span>
        <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
      </button>
      <div className="flex-auto text-sm font-semibold">{format(endCurrentMonth, 'MMMM yyyy')}</div>
      <button
        onClick={nextMonth}
        type="button"
        className="-m-1.5 flex flex-none items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"
      >
        <span className="sr-only">Next month</span>
        <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
    <div className="mt-6 grid grid-cols-7 text-center text-xs leading-6 text-gray-500">
      <div>S</div>
      <div>M</div>
      <div>T</div>
      <div>W</div>
      <div>T</div>
      <div>F</div>
      <div>S</div>
    </div>
    <div className="isolate mt-2 grid grid-cols-7 gap-px rounded-lg bg-gray-200 text-sm ring-1 ring-gray-200">
      {endDays.map((day, dayIdx) => (
          <button
            onClick={() => changeEndSelectedDay(day)}
            key={day.date}
            type="button"
            className={classNames(
              'py-1.5 hover:bg-gray-100 focus:z-10',
              isSameMonth(day, endFirstDayCurrentMonth) ? 'bg-white' : 'bg-gray-50',
              (isEqual(day, endSelectedDay) || isEqual(day, today)) && 'font-semibold',
              isEqual(day, endSelectedDay) && 'text-white',
              !isEqual(day, endSelectedDay) && isSameMonth(day, endFirstDayCurrentMonth) && !isEqual(day, today) && 'text-gray-900',
              !isEqual(day, endSelectedDay) && !isSameMonth(day, endFirstDayCurrentMonth) && !isEqual(day, today) && 'text-gray-400',
              isEqual(day, today) && !isEqual(day, endSelectedDay) && 'text-red-500',
              dayIdx === 0 && 'rounded-tl-lg',
              dayIdx === 6 && 'rounded-tr-lg',
              dayIdx === days.length - 7 && 'rounded-bl-lg',
              dayIdx === days.length - 1 && 'rounded-br-lg'
            )}
          >
            <time
              dateTime={day.date}
              className={classNames(
                'mx-auto flex h-7 w-7 items-center justify-center rounded-full',
                isEqual(day, endSelectedDay) && isEqual(day, today) && 'bg-red-500',
                isEqual(day, endSelectedDay) && !isEqual(day, today) && 'bg-gray-900'
              )}
            >
              {format(day,'d')}
            </time>
          </button>
      ))}
    </div>
  </div>
  )
}