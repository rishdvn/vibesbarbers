import { CalendarDaysIcon, CreditCardIcon, UserCircleIcon } from '@heroicons/react/20/solid'
import Button from './button'
import { format } from 'date-fns'

export default function Summary({selectedDay, isDisabled, page, data, nextPage}:{selectedDay: any, isDisabled: boolean, page: number, data: any, nextPage: any}) {
  return (
    <div className="lg:col-start-3 lg:row-end-1">
      <h2 className="sr-only">Summary</h2>
      <div className="rounded-lg bg-gray-50 shadow-sm ring-1 ring-gray-900/5">
        <dl className="flex flex-wrap">
          <div className="flex-auto pl-6 pt-6">
            <dt className="text-sm font-semibold leading-6 text-gray-900">Vibes Barber</dt>
            <dd className="mt-1 text-base font-semibold leading-6 text-gray-900">{data.service}</dd>
          </div>
          {data.professional && (
            <div className="mt-6 flex w-full flex-none gap-x-4 border-t border-gray-900/5 px-6 pt-6">
              <dt className="flex-none">
                <span className="sr-only">Client</span>
                <UserCircleIcon className="h-6 w-5 text-gray-400" aria-hidden="true" />
              </dt>
              <dd className="text-sm font-medium leading-6 text-gray-900">{data.professional}</dd>
            </div>
          )}
          {data.time && (
            <div className="mt-4 flex w-full flex-none gap-x-4 px-6">
              <dt className="flex-none">
                <span className="sr-only">Due date</span>
                <CalendarDaysIcon className="h-6 w-5 text-gray-400" aria-hidden="true" />
              </dt>
              <dd className="text-sm leading-6 text-gray-500">
                <time dateTime="2023-01-31">{`${format(selectedDay, 'MMM do')}, ${data.time}`}</time>
              </dd>
            </div>
          )}
        </dl>
        <div className="mt-6 border-t border-gray-900/5 px-6 py-6">
          <Button
            isDisabled={isDisabled}
            page={page}
            nextPage={nextPage}
            data={data}
          >
            {page === 2 || page === 3 ? 'Confirm' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  )
}
