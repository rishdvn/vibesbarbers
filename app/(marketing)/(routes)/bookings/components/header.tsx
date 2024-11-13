import React from 'react';

interface HeaderProps {
  submited: boolean;
}

const Header: React.FC<HeaderProps> = ({ submited }) => {
  return (
    <div className="text-xl font-medium bg-black px-4 py-9 sm:px-4 text-white">
      {submited ? "Appointment booked" : "Book an appointment"}
    </div>
  );
};

export default Header;
