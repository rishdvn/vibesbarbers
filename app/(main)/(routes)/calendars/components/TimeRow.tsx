export const TimeRow = ({time}:{time:string}) => {
    return (
      <div className="grid grid-rows-3 h-24">
          <div className="flex justify-center mt-1">
            <span className="text-xs leading-5 text-gray-400">
              {time}
            </span>
          </div>
          <div />
          <div />
      </div>
    )
}