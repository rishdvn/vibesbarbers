import { ChevronRightIcon, HomeIcon } from '@heroicons/react/20/solid'
import { useEffect, useState } from 'react'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function Breadcrumbs({handlePageChange, pageData, page}: {handlePageChange: any, pageData: [], page: number}) {
  
  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol role="list" className="flex items-center space-x-4">
        {pageData.map((page, pageIndex) => (
          <li key={page.name}>
            <div 
              onClick={() => {
                if (page.breadcrumb) {
                  handlePageChange(pageIndex)
                }
              }}
              className="flex items-center"
            >
              <a
                className={classNames(
                  "text-sm font-medium",
                  page.current ? "cursor-pointer text-gray-900" : "text-gray-400",
                  page.breadcrumb ? "cursor-pointer text-gray-400 hover:text-gray-700" : "cursor-default "
                )}
                aria-current={page.current === pageIndex ? 'page' : undefined}
              >
                {page.name}
              </a>
              {pageIndex === pageData.length - 1 ? null : (
                <ChevronRightIcon className="ml-4 h-5 w-5 flex-shrink-0 text-gray-400" aria-hidden="false" />
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  )
}
