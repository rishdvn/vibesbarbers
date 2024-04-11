const professionals = [
    {
      name: 'Patrick',
    },
    {
      name: 'Vince',
    },
    {
        name: 'Derek',
    },
    {
        name: 'Manny',
    },
  ]

  function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
  }
  
  export default function Professionals({handleProfessional, data}: {handleProfessional: any, data: any}) {
    return (
      <div className="grid grid-cols-3 gap-x-3 gap-y-3">
        {professionals.map((professional) => (
          <div
            key={professional.name}
            className={classNames(
                "relative flex items-center rounded-lg border border-gray-300 bg-white px-3 py-3 shadow-sm hover:border-gray-400",
                data.professional === professional.name ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
              )}
          >
            <div 
                onClick={() => {handleProfessional(professional.name)}}
                className="justify-center items-center min-w-0 flex-1"
            >
              <a href="#" className="p-3 gap-y-3 justify-center items-center focus:outline-none flex flex-col gap-y-1">
                <div className="flex-shrink-0 h-20 w-20 rounded-full bg-sky-200">
                    
                </div>
                <span className="absolute inset-0" aria-hidden="true" />
                <p className="text-sm font-medium text-gray-900">{professional.name}</p>
              </a>
            </div>
          </div>
        ))}
      </div>
    )
  }
  