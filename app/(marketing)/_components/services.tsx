const services = [
    {
      name: 'Haircut',
      time: '20mins'
    },
    {
      name: 'Haircut & Beard',
      time: '40mins'
    },
  ]

  function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
  }
  
  export default function Services({handleService, data}: {handleService: any, data: any}) {

    return (
      <div className="flex flex-col gap-y-3">
        {services.map((service) => (
          <div
            onClick={() => {handleService(service.name)}}
            key={service.name}
            className={classNames(
              "relative flex items-center rounded-lg border border-gray-300 bg-white px-3 py-3 shadow-sm hover:border-gray-400",
              data.service === service.name ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
            )}
          >
            <div 
              className="min-w-0 flex-1"
            >
              <a href="#" className="focus:outline-none flex flex-col gap-y-1">
                <span className="absolute inset-0" aria-hidden="true" />
                <p className="text-sm font-medium text-gray-900">{service.name}</p>
                <p className="truncate text-sm text-gray-500">{service.time}</p>
              </a>
            </div>
          </div>
        ))}
      </div>
    )
  }
  