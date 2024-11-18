export const BarberItem = ({keyValue, barber}:{keyValue: any, barber: object}) => {
    return (
      <div
        key={keyValue + Math.random()}
        className='z-20 flex flex-1 flex-col items-center justify-center py-3 gap-y-3 text-xs font-semibold text-gray-900 bg-white bg-opacity-85 border-b-2 border-gray-200'
      >
        <div className="flex items-center justify-center h-14 w-14 rounded-full bg-sky-500 text-white font-medium text-2xl">
          {`${barber.firstname[0]}`}
        </div>
        <p className="text-xs font-medium text-gray-900">
          {barber.firstname}
        </p>
      </div>
    )
  }