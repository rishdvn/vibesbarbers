"use client";

interface BookButtonProps {
    allowSubmit?: boolean;
    onSubmit?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const BookButton = ({
    allowSubmit = true,
    onSubmit,
}: BookButtonProps) => {
    return (
        <div className="sticky bottom-0 border-t border-gray-700 bg-black w-full flex justify-end space-x-3 px-4 py-2 sm:px-4">
            <button
                onClick={onSubmit}
                disabled={!allowSubmit}
                className="disabled:opacity-50 disabled:bg-gray-600 disabled:text-gray-300 disabled:cursor-not-allowed flex w-full justify-center rounded-md bg-green-700 p-3 text-md font-medium text-gray-100 hover:bg-green-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700"
            >
                BOOK
            </button>
        </div>
    );
};

export default BookButton;
