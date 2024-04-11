import { useEffect } from "react";

function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
  }

const Button = ({isDisabled, data, page, children, nextPage}:{isDisabled: boolean, data: any, page: number, children: string, nextPage: any}) => {
    return ( 
        <button
            disabled={isDisabled}
            onClick={() => nextPage()}
            type="button"
            className={classNames(
                "w-full rounded-md px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600",
                isDisabled ? "bg-gray-300 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-500"
            )}
        >
            {children}
        </button>
     );
}

 
export default Button;